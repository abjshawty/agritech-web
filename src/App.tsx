import { useEffect, useMemo, useState } from 'react'
import { getCrops, getRecommend, type Crop, type RecommendResponse, type Result } from '@/api/client'
import { CropDetail } from '@/components/CropDetail'
import { FieldMap } from '@/components/FieldMap'
import { Results } from '@/components/Results'
import { useLang } from '@/i18n'
import { inBounds, towns } from '@/towns'

type Point = { lat: number; lon: number }

export default function App() {
  const { t, lang, setLang } = useLang()
  const [pin, setPin] = useState<Point | null>(null)
  const [month, setMonth] = useState<number | null>(null)
  const [irrigated, setIrrigated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<RecommendResponse | null>(null)
  const [open, setOpen] = useState<Result | null>(null)
  const [crops, setCrops] = useState<Map<string, Crop>>(new Map())

  useEffect(() => {
    getCrops().then(({ data }) => {
      if (data) setCrops(new Map(data.map((c) => [c.id, c])))
    })
  }, [])

  // `?town=Bouaké` picks that town and analyzes straight away: handy for demo links and the video.
  useEffect(() => {
    const name = new URLSearchParams(location.search).get('town')
    const tw = towns.find((x) => x.name.toLowerCase() === name?.toLowerCase())
    if (!tw) return
    setPin({ lat: tw.lat, lon: tw.lon })
    analyze({ lat: tw.lat, lon: tw.lon })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const town = useMemo(
    () => towns.find((tw) => pin && Math.abs(tw.lat - pin.lat) < 1e-6 && Math.abs(tw.lon - pin.lon) < 1e-6),
    [pin],
  )

  function locateMe() {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      if (inBounds(coords.latitude, coords.longitude)) setPin({ lat: coords.latitude, lon: coords.longitude })
      else setError(t.outside)
    })
  }

  async function analyze(at: Point | null = pin) {
    if (!at) return
    setLoading(true)
    setError(null)
    setOpen(null)
    const { data, error, response } = await getRecommend({
      lat: at.lat,
      lon: at.lon,
      irrigated,
      ...(month ? { plantingMonth: month } : {}),
    })
    setLoading(false)
    if (error || !data) setError(response.status === 400 ? t.noSoil : t.unavailable)
    else setData(data)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-line bg-white px-4 py-2.5">
        <span className="font-bold tracking-wide text-leaf">AGRITECH</span>
        <button
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          className="rounded-full border border-line px-3 py-1 text-sm font-semibold"
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </header>

      <main className="grid min-h-0 flex-1 grid-rows-[40vh_1fr] md:grid-cols-[3fr_2fr] md:grid-rows-1">
        <div className="relative min-h-0">
          <FieldMap pin={pin} onPick={setPin} />
          <button
            onClick={locateMe}
            className="absolute top-3 right-3 z-[1000] rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold shadow"
          >
            {t.useLocation}
          </button>
        </div>

        <aside className="grid min-h-0 content-start gap-3 overflow-y-auto border-line bg-paper p-4 md:border-l">
          <div className="grid gap-2">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">{t.town}</span>
              <select
                id="town"
                value={town?.name ?? ''}
                onChange={(e) => {
                  const tw = towns.find((x) => x.name === e.target.value)
                  if (tw) setPin({ lat: tw.lat, lon: tw.lon })
                }}
                className="rounded-lg border border-line bg-white px-3 py-2.5"
              >
                <option value="">{t.chooseTown}</option>
                {towns.map((tw) => (
                  <option key={tw.name}>{tw.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">{t.plantingMonth}</span>
              <select
                id="month"
                value={month ?? ''}
                onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
                className="rounded-lg border border-line bg-white px-3 py-2.5"
              >
                <option value="">{t.auto}</option>
                {t.months.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm">
              <span className="font-semibold">{t.irrigation}</span>
              <input
                id="irrigated"
                type="checkbox"
                checked={irrigated}
                onChange={(e) => setIrrigated(e.target.checked)}
                className="size-5 accent-leaf"
              />
            </label>
            <button
              onClick={() => analyze()}
              disabled={!pin || loading}
              className="rounded-xl bg-leaf px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? t.analyzing : t.analyze}
            </button>
            {!pin && <p className="text-sm text-muted">{t.pickHint}</p>}
            {error && <p className="text-sm font-semibold text-poor">{error}</p>}
          </div>

          {data &&
            (open ? (
              <CropDetail result={open} crop={crops.get(open.cropId)} data={data} onBack={() => setOpen(null)} />
            ) : (
              <Results data={data} crops={crops} onOpen={setOpen} />
            ))}
        </aside>
      </main>
    </div>
  )
}
