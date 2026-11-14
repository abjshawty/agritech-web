# agritech-web

The web app for AGRITECH, Team AKOMA's entry for the NASA Space Apps Challenge (*Field Shift — Adapting Farms with NASA Data*). A farmer or advisor picks a field in Côte d'Ivoire and gets crops ranked by how well they suit its recent climate and soil, each with a reason in plain French or English.

The API is [`agritech-backend`](https://github.com/abjshawty/agritech-backend).

## Getting started

You need Bun 1.3.10 or later, and the backend running on port 3000 (see its README). Vite proxies `/api` to it, so the app talks to the same origin in development and in production. To use a backend on another port, set `API_URL`, e.g. `API_URL=http://localhost:3001 bun dev`.

```bash
bun install
bun dev           # http://localhost:5173
bun run build     # type-check and build to dist/
bun run lint
```

Open `http://localhost:5173/?town=Bouaké` to pick a town and analyze it straight away. That's handy for demos and the video.

## Stack

Vite, React 19, TypeScript, Tailwind CSS 4, react-leaflet with OpenStreetMap tiles, Recharts, and openapi-fetch.

## Where things are

| Path                           | What                                                                   |
| ------------------------------ | ---------------------------------------------------------------------- |
| `src/App.tsx`                  | Layout: map with controls and results (side by side on desktop)         |
| `src/components/FieldMap.tsx`  | Map limited to Côte d'Ivoire; tap to pin                               |
| `src/components/Results.tsx`   | Site summary, the Field Shift badge and ranked crop cards              |
| `src/components/CropDetail.tsx`| Monthly rainfall chart with the growing cycle, factor scores, reasons   |
| `src/i18n.tsx`                 | **Every string the UI shows**, in French and English, reason templates included |
| `src/towns.ts`                 | The ~30 towns in the picker                                            |
| `src/api/schema.d.ts`          | Types generated from the backend's OpenAPI spec; don't edit by hand    |
| `src/index.css`                | Design tokens (colours, font)                                          |

## Rules of the road

- **No hardcoded text.** Add every string to both `fr` and `en` in `src/i18n.tsx`. The API sends reason keys like `rain.tooLow` with parameters, never sentences.
- **When the API changes**, start the backend and run `bun run api:types` to regenerate `src/api/schema.d.ts`, then commit it.
- **Never colour alone** for a verdict: always the icon (✓ ~ ✕) and the label as well.

## Deployment

`Dockerfile` builds the app and serves it with Caddy, which also proxies `/api/*` to the backend on the internal network. `docker-compose.yml` runs both. Clone `agritech-backend` next to this repo, then:

```bash
WEB_PORT=8080 docker compose up -d --build
```

Only the web container publishes a port.

## License

MIT
