import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { useEffect } from 'react'
import { bounds, inBounds } from '@/towns'

type Point = { lat: number; lon: number }

const maxBounds: [[number, number], [number, number]] = [
  [bounds.lat[0], bounds.lon[0]],
  [bounds.lat[1], bounds.lon[1]],
]

function ClickToPin({ onPick }: { onPick: (p: Point) => void }) {
  useMapEvents({
    click: (e) => {
      if (inBounds(e.latlng.lat, e.latlng.lng)) onPick({ lat: e.latlng.lat, lon: e.latlng.lng })
    },
  })
  return null
}

// Pan to the pin when it's set from outside the map (town list, GPS).
function FollowPin({ pin }: { pin: Point | null }) {
  const map = useMap()
  useEffect(() => {
    if (pin) map.panTo([pin.lat, pin.lon])
  }, [map, pin])
  return null
}

export function FieldMap({ pin, onPick }: { pin: Point | null; onPick: (p: Point) => void }) {
  return (
    <MapContainer
      bounds={maxBounds}
      maxBounds={maxBounds}
      maxBoundsViscosity={1}
      minZoom={6}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPin onPick={onPick} />
      <FollowPin pin={pin} />
      {pin && (
        <CircleMarker
          center={[pin.lat, pin.lon]}
          radius={10}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#b4533a', fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  )
}
