import { useEffect, useMemo, useRef, useState } from 'react'
import { getCrops, getRecommend, type Crop, type RecommendResponse, type Result } from '@/api/client'
import { CropDetail } from '@/components/CropDetail'
import { FieldMap } from '@/components/FieldMap'
import { Results } from '@/components/Results'
import { useLang } from '@/i18n'
import { inBounds, towns } from '@/towns'

type Point = { lat: number; lon: number }
type ErrorKey = 'outside' | 'noSoil' | 'climateUnavailable' | 'networkError' | 'unavailable' | 'locationError' | 'cropsUnavailable'

const pointKey = (point: Point, month: number | null, irrigated: boolean) =>
  `${point.lat.toFixed(5)}:${point.lon.toFixed(5)}:${month ?? 'auto'}:${irrigated}`

export default function App() {
  const { t, lang, setLang } = useLang()
  const [pin, setPin] = useState<Point | null>(null)
  const [month, setMonth] = useState<number | null>(null)
  const [irrigated, setIrrigated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [cropsError, setCropsError] = useState(false)
  const [error, setError] = useState<ErrorKey | null>(null)
  const [data, setData] = useState<RecommendResponse | null>(null)
  const [analyzedKey, setAnalyzedKey] = useState<string | null>(null)
  const [open, setOpen] = useState<Result | null>(null)
  const [crops, setCrops] = useState<Map<string, Crop>>(new Map())
  const controllerRef = useRef<AbortController | null>(null)
  const resultsRef = useRef<HTMLElement | null>(null)
  const backRef = useRef<HTMLButtonElement | null>(null)

  const currentKey = pin ? pointKey(pin, month, irrigated) : null
  const stale = Boolean(data && analyzedKey && currentKey !== analyzedKey)

  useEffect(() => {
    const controller = new AbortController()
    void getCrops(controller.signal)
      .then(({ data: cropsData, error: cropsApiError }) => {
        if (controller.signal.aborted) return
        if (cropsApiError || !cropsData) setCropsError(true)
        else setCrops(new Map(cropsData.map((crop) => [crop.id, crop])))
      })
      .catch(() => {
        if (!controller.signal.aborted) setCropsError(true)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const name = new URLSearchParams(location.search).get('town')
    const town = towns.find((item) => item.name.toLowerCase() === name?.toLowerCase())
    if (!town) return

    const point = { lat: town.lat, lon: town.lon }
    setPin(point)
    void analyze(point)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const town = useMemo(
    () => towns.find((item) => pin && Math.abs(item.lat - pin.lat) < 1e-6 && Math.abs(item.lon - pin.lon) < 1e-6),
    [pin],
  )

  async function analyze(at: Point | null = pin) {
    if (!at) return

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const requestKey = pointKey(at, month, irrigated)
    setLoading(true)
    setError(null)
    setData(null)
    setAnalyzedKey(null)
    setOpen(null)

    try {
      const { data: result, error: apiError, response } = await getRecommend(
        {
          lat: at.lat,
          lon: at.lon,
          irrigated,
          ...(month ? { plantingMonth: month } : {}),
        },
        controller.signal,
      )

      if (controller.signal.aborted || controllerRef.current !== controller) return

      if (apiError || !result) {
        if (response.status === 400) setError('noSoil')
        else if (response.status === 503) setError('climateUnavailable')
        else if (response.status === 422) setError('outside')
        else setError('unavailable')
        return
      }

      setData(result)
      setAnalyzedKey(requestKey)
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        resultsRef.current?.focus({ preventScroll: true })
      })
    } catch (cause) {
      if (controller.signal.aborted || controllerRef.current !== controller) return
      setError(cause instanceof TypeError ? 'networkError' : 'unavailable')
    } finally {
      if (controllerRef.current === controller) setLoading(false)
    }
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setError('locationError')
      return
    }

    setLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false)
        setError(null)
        if (inBounds(coords.latitude, coords.longitude)) setPin({ lat: coords.latitude, lon: coords.longitude })
        else setError('outside')
      },
      () => {
        setLocating(false)
        setError('locationError')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const errorText: Record<ErrorKey, string> = {
    outside: t.outside,
    noSoil: t.noSoil,
    climateUnavailable: t.climateUnavailable,
    networkError: t.networkError,
    unavailable: t.unavailable,
    locationError: t.locationError,
    cropsUnavailable: t.cropsUnavailable,
  }

  return (
    <div className="flex min-h-full flex-col bg-paper text-ink">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b-2 border-line bg-white px-4 py-3 md:px-6">
        <span className="text-2xl font-extrabold tracking-wide text-leaf">AGRITECH</span>

        <label className="flex min-h-12 items-center gap-2 text-base font-bold">
          <span>{t.languageLabel}</span>
          <select
            value={lang}
            onChange={(event) => setLang(event.target.value as 'fr' | 'en')}
            aria-label={t.languageLabel}
            className="min-h-12 rounded-lg border-2 border-line bg-white px-3"
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </label>
      </header>

      <main className="grid min-h-0 flex-1 grid-rows-[40vh_1fr] md:grid-cols-[3fr_2fr] md:grid-rows-1">
        <section className="relative min-h-[280px]" aria-label={t.mapLabel}>
          <FieldMap
            pin={pin}
            onPick={(point) => {
              setPin(point)
              setError(null)
            }}
          />

          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="absolute top-3 right-3 z-[1000] min-h-12 rounded-lg border-2 border-black bg-white px-4 text-base font-bold text-black disabled:opacity-70"
          >
            {locating ? t.locating : t.useLocation}
          </button>
        </section>

        <aside className="grid min-h-0 content-start gap-4 overflow-y-auto border-line bg-white p-4 md:border-l-2 md:p-5">
          <div className="grid gap-3">
            <label className="grid gap-1 text-base font-bold">
              <span>{t.town}</span>
              <select
                id="town"
                value={town?.name ?? ''}
                onChange={(event) => {
                  const selectedTown = towns.find((item) => item.name === event.target.value)
                  if (selectedTown) {
                    setPin({ lat: selectedTown.lat, lon: selectedTown.lon })
                    setError(null)
                  }
                }}
                className="min-h-12 rounded-lg border-2 border-black bg-white px-3"
              >
                <option value="">{t.chooseTown}</option>
                {towns.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-base font-bold">
              <span>{t.plantingMonth}</span>
              <select
                id="month"
                value={month ?? ''}
                onChange={(event) => setMonth(event.target.value ? Number(event.target.value) : null)}
                className="min-h-12 rounded-lg border-2 border-black bg-white px-3"
              >
                <option value="">{t.auto}</option>
                {t.months.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg border-2 border-black bg-white px-3 text-base font-bold">
              <span>{t.irrigation}</span>
              <input
                id="irrigated"
                type="checkbox"
                checked={irrigated}
                onChange={(event) => setIrrigated(event.target.checked)}
                className="size-6 accent-leaf"
              />
            </label>

            <button
              type="button"
              onClick={() => void analyze()}
              disabled={!pin || loading}
              className="min-h-14 w-full rounded-lg border-2 border-black bg-leaf px-4 py-3 text-lg font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t.analyzing : t.analyze}
            </button>

            {!pin && <p className="text-base text-muted">{t.pickHint}</p>}
            {error && (
              <p role="alert" className="rounded-lg border-2 border-black bg-white p-3 text-base font-bold text-poor">
                ⚠ {errorText[error]}
              </p>
            )}
            {cropsError && (
              <p role="alert" className="rounded-lg border-2 border-black bg-white p-3 text-base font-bold text-poor">
                ⚠ {t.cropsUnavailable}
              </p>
            )}
            {loading && (
              <p role="status" aria-live="polite" className="text-base font-bold">
                {t.analyzing}
              </p>
            )}
          </div>

          <section ref={resultsRef} tabIndex={-1} aria-labelledby="results-heading" className="scroll-mt-4 outline-none">
            <h1 id="results-heading" className="mb-3 text-2xl font-extrabold text-leaf">
              {t.results}
            </h1>

            {stale && (
              <p role="status" className="mb-3 rounded-lg border-2 border-black bg-ochre-soft p-3 text-base font-bold">
                {t.changed}
              </p>
            )}

            {data && !stale &&
              (open ? (
                <CropDetail
                  result={open}
                  crop={crops.get(open.cropId)}
                  data={data}
                  onBack={() => {
                    setOpen(null)
                    requestAnimationFrame(() => backRef.current?.focus())
                  }}
                  backRef={backRef}
                />
              ) : (
                <Results data={data} crops={crops} onOpen={setOpen} backRef={backRef} />
              ))}
          </section>
        </aside>
      </main>
    </div>
  )
}

