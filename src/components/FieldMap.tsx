import { useEffect, useRef } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { bounds, inBounds } from '@/towns'

type Point = { lat: number; lon: number }

const maxBounds: [[number, number], [number, number]] = [
  [bounds.lat[0], bounds.lon[0]],
  [bounds.lat[1], bounds.lon[1]],
]

function ClickToPin({ onPick }: { onPick: (point: Point) => void }) {
  useMapEvents({
    click: (event) => {
      if (inBounds(event.latlng.lat, event.latlng.lng)) onPick({ lat: event.latlng.lat, lon: event.latlng.lng })
    },
  })

  return null
}

function FollowPin({ pin }: { pin: Point | null }) {
  const map = useMap()

  useEffect(() => {
    if (pin) map.panTo([pin.lat, pin.lon])
  }, [map, pin])

  return null
}

function RefreshMapSize() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    let frame = 0
    const invalidate = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }))
    }
    const observer = new ResizeObserver(invalidate)
    observer.observe(container)
    invalidate()
    window.addEventListener('resize', invalidate)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', invalidate)
      cancelAnimationFrame(frame)
    }
  }, [map])

  return null
}

export function FieldMap({ pin, onPick }: { pin: Point | null; onPick: (point: Point) => void }) {
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
      <RefreshMapSize />
      {pin && (
        <CircleMarker
          center={[pin.lat, pin.lon]}
          radius={10}
          pathOptions={{ color: '#000000', weight: 3, fillColor: '#9a3b00', fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  )
}
