# Deploying AGRITECH on a VPS with Docker

This guide runs the whole app, frontend and API, on one Arch Linux server with Docker Compose.

## What you end up with

- **Two containers.** `web` is Caddy, serving the built frontend and passing `/api/*` to `backend`. `backend` is the Bun API ([agritech-backend](https://github.com/abjshawty/agritech-backend)).
- **Only `web` publishes a port.** The backend is reachable only on the private Docker network.
- **No database.** Crop profiles, the soil and GAEZ grids and the saved climate for the 30 towns are built into the backend image. At runtime the only outside call is to NASA POWER.

## 0. Prerequisites

- An Arch Linux VPS, up to date. 1 vCPU and 1 GB of RAM is enough; building the frontend is the heaviest step (see [Troubleshooting](#11-troubleshooting) if it runs out of memory).
- SSH access as a user with `sudo`.
- Optional: a domain whose DNS A record points to the VPS, for HTTPS ([step 7](#7-https-recommended)).
- Outbound HTTPS allowed: the backend calls `power.larc.nasa.gov`.

## 1. Install Docker

```sh
sudo pacman -Syu --needed docker docker-compose docker-buildx git
sudo systemctl enable --now docker.service
sudo usermod -aG docker $USER   # run docker without sudo
newgrp docker                   # or log out and back in
docker --version && docker compose version
```

`docker-compose` provides the `docker compose` plugin, and `docker-buildx` the BuildKit builder (without it, builds warn that the legacy builder is deprecated).

## 2. Set up the firewall

```sh
sudo pacman -S --needed ufw
sudo ufw default deny incoming
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp          # only if you'll use HTTPS
sudo ufw enable
sudo systemctl enable --now ufw.service
```

> Ports that Docker publishes bypass `ufw`: Docker writes its own firewall rules. That's one reason only `web` publishes a port. Never add `ports:` to the `backend` service.

## 3. Get the code

Both repos must sit side by side, because the Compose file builds `../agritech-backend`.

```sh
sudo mkdir -p /opt/agritech && sudo chown $USER: /opt/agritech
cd /opt/agritech
git clone https://github.com/abjshawty/agritech-backend.git
git clone https://github.com/abjshawty/agritech-web.git
```

## 4. Configure

The backend's settings (`SERVER_PATH=/api`, `PORT=3000`) are already in `docker-compose.yml`. The only choice is where `web` listens, set in a `.env` file next to the Compose file:

```sh
cd /opt/agritech/agritech-web
echo 'WEB_PORT=80' > .env                  # public on port 80, plain HTTP
# or, behind a host reverse proxy with HTTPS (step 7):
# echo 'WEB_PORT=127.0.0.1:8080' > .env
```

Without a `.env`, `web` listens on port 8080 on every interface.

## 5. Build and start

```sh
cd /opt/agritech/agritech-web
docker compose up -d --build
```

The first build takes a few minutes: it installs dependencies, then type-checks and builds the frontend. Both services restart by themselves after a crash or a reboot (`restart: unless-stopped`, and `docker.service` is enabled).

## 6. Check that it works

```sh
docker compose ps                     # both services running
docker compose logs backend | tail    # "Server running on http://localhost:3000/api"
PORT=${WEB_PORT:-80}; PORT=${PORT##*:}
curl -s localhost:$PORT/api/crops | head -c 200                                              # JSON list of crops
curl -s -o /dev/null -w '%{http_code}\n' "localhost:$PORT/api/recommend?lat=7.69&lon=-5.03"  # 200
```

For the full end-to-end check, run this from any machine with [Bun](https://bun.com) and a clone of `agritech-backend`:

```sh
bun e2e http://<vps-ip-or-domain>/api
```

It ends with `all checks passed`. If NASA POWER is slow, it lists the towns served from saved climate; that still counts as working.

## 7. HTTPS (recommended)

Put Caddy on the host in front of the stack. It fetches and renews Let's Encrypt certificates on its own.

```sh
# 1. Keep the stack on localhost only
cd /opt/agritech/agritech-web
echo 'WEB_PORT=127.0.0.1:8080' > .env
docker compose up -d

# 2. Host Caddy terminates HTTPS
sudo pacman -S --needed caddy
sudo tee /etc/caddy/Caddyfile >/dev/null <<'EOF'
agritech.example.com {
	reverse_proxy 127.0.0.1:8080
}
EOF
sudo systemctl enable --now caddy.service
sudo systemctl reload caddy.service
```

Replace `agritech.example.com` with your domain. Its DNS must already point at the VPS, and ports 80 and 443 must be open ([step 2](#2-set-up-the-firewall)).

## 8. Updating

```sh
cd /opt/agritech
git -C agritech-backend pull
git -C agritech-web pull
cd agritech-web && docker compose up -d --build
docker image prune -f        # remove the old images
```

**Rollback:** check out the previous commit in the affected repo (for example `git -C ../agritech-backend checkout <sha>`), then run `docker compose up -d --build` again. Return to normal with `git checkout main`.

## 9. Refreshing the built-in data (optional)

The data files are committed in `agritech-backend`, so the server never rebuilds them. To refresh them, run these in `agritech-backend` on a development machine, commit the results, then update the server ([step 8](#8-updating)):

| Command | Rebuilds |
| --- | --- |
| `bun soil:build` | Soil grid (SoilGrids) |
| `bun gaez:build` | FAO GAEZ suitability grid |
| `bun crops:build` | Crop profiles (FAO ECOCROP) |
| `bun snapshots:build` | Saved NASA POWER climate for the 30 towns |

## 10. Keeping logs from filling the disk

Docker keeps container logs forever by default. Cap them once:

```sh
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json >/dev/null <<'EOF'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
EOF
sudo systemctl restart docker.service
cd /opt/agritech/agritech-web && docker compose up -d --force-recreate
```

## 11. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Unknown lockfile version` during the build | The base image is older than the Bun that wrote `bun.lock` | The images must use `oven/bun:1.4.4-alpine` or newer. Already the case on `main`: `git pull` |
| The page loads but every analysis says the data service is unavailable; `docker compose logs web` shows `lookup backend … no such host` | Caddy can't find the backend | Start the stack from `agritech-web` with the Compose file, so the API service is named `backend`. On another platform, set `API_UPSTREAM=<host>:3000` on `web` |
| The backend exits with an address-family error | The kernel has IPv6 disabled, and the API listens on `::` | Add `HOST: 0.0.0.0` under `backend.environment` in `docker-compose.yml` |
| A point returns "no soil data here" (400) | The point is on water | Expected. Pick a point on land |
| "Data service unavailable" (503) for some places | NASA POWER is down or took over 5 s, and the point is more than 25 km from any of the 30 towns | Usually brief: retry. The towns themselves always work from saved climate |
| `port is already allocated` | Something else uses `WEB_PORT` | Change `WEB_PORT` in `.env`, or stop the other service (`sudo ss -ltnp` shows who) |
| The build is killed or very slow | Not enough RAM for the frontend build | Add 2 GB of swap (below) |

Adding swap. On btrfs (the usual Arch root filesystem), `fallocate` swap files don't work, so use btrfs's own command:

```sh
findmnt -no FSTYPE /          # which filesystem is root?
# btrfs:
sudo btrfs filesystem mkswapfile --size 2g /swapfile
# ext4 or xfs:
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile
# then, either way:
sudo swapon /swapfile
echo '/swapfile none swap defaults 0 0' | sudo tee -a /etc/fstab   # keep it after reboot
```

Useful commands:

```sh
docker compose logs -f              # follow the logs
docker compose restart backend
docker compose down                 # stop everything
```
