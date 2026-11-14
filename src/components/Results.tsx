import type { RefObject } from 'react'
import type { Crop, RecommendResponse, Result, Verdict } from '@/api/client'
import { reasonText, useLang } from '@/i18n'

export const verdictStyle: Record<Verdict, { icon: string; text: string; bar: string }> = {
  good: { icon: '✓', text: 'text-good', bar: 'bg-good' },
  possible: { icon: '~', text: 'text-possible', bar: 'bg-possible' },
  poor: { icon: '✕', text: 'text-poor', bar: 'bg-poor' },
}

export function VerdictLabel({ result }: { result: Result }) {
  const { t } = useLang()
  const style = verdictStyle[result.verdict]
  return (
    <span className={`whitespace-nowrap text-lg font-extrabold ${style.text}`}>
      {style.icon} {t.verdict[result.verdict]} · {result.score}/100
    </span>
  )
}

export function ScoreBar({ value, verdict }: { value: number; verdict: Verdict }) {
  return (
    <div className="h-5 overflow-hidden rounded-full border-2 border-black bg-white" role="img" aria-label={`${Math.round(value)}%`}>
      <div className={`h-full ${verdictStyle[verdict].bar}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function SiteSummary({ data }: { data: RecommendResponse }) {
  const { t } = useLang()
  const { site } = data
  const rainSign = site.shift.rainPct > 0 ? '+' : ''
  const tempSign = site.shift.tempDelta > 0 ? '+' : ''

  return (
    <section aria-label={t.siteSummary} className="grid gap-3 rounded-xl border-2 border-black bg-leaf-soft p-4 text-base">
      <b className="text-lg">
        {site.nearestTown} · {t.sowing} {t.months[data.plantingMonth - 1]}
      </b>
      <span>
        {Math.round(site.climate.annualRain)} {t.perYear} · {t.texture[site.soil.texture]} · pH {site.soil.ph.toFixed(1)}
      </span>

      <div className="rounded-lg border-2 border-black bg-ochre-soft p-3">
        <b className="block text-lg text-possible">{t.fieldShift}</b>
        <span className="block font-bold">
          {t.rain} {rainSign}
          {Math.round(site.shift.rainPct)}% · {tempSign}
          {site.shift.tempDelta.toFixed(1)} °C
        </span>
        <span className="block">{t.fieldShiftHelp}</span>
      </div>

      {data.source === 'snapshot' && <span className="font-semibold text-muted">{t.sample}</span>}
      <span className="rounded-md border border-black bg-white px-2 py-1 text-xs font-semibold text-ink">{t.note}</span>
    </section>
  )
}

export function Results({ data, crops, onOpen, backRef }: {
  data: RecommendResponse
  crops: Map<string, Crop>
  onOpen: (result: Result, trigger: HTMLButtonElement) => void
  backRef: RefObject<HTMLButtonElement | null>
}) {
  const { t, lang } = useLang()

  return (
    <div className="grid gap-3">
      <SiteSummary data={data} />
      {data.results.map((result) => (
        <button
          key={result.cropId}
          type="button"
          onClick={(event) => onOpen(result, event.currentTarget)}
          className="grid min-h-12 gap-2 rounded-xl border-2 border-black bg-white p-4 text-left transition-colors hover:bg-leaf-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ochre"
        >
          <span className="flex flex-wrap items-baseline justify-between gap-2">
            <b className="text-xl font-extrabold">{crops.get(result.cropId)?.name[lang] ?? result.cropId}</b>
            <VerdictLabel result={result} />
          </span>

          <span className="grid grid-cols-[1fr_auto] items-center gap-3">
            <ScoreBar value={result.score} verdict={result.verdict} />
            <strong className="text-lg tabular-nums">{result.score}/100</strong>
          </span>

          {result.reasons[0] && <span className="text-base text-muted">{reasonText(t, result.reasons[0])}</span>}
          {result.waterDeficitMm > 0 && !data.irrigated && (
            <span className="text-base font-bold text-poor">{t.deficit(Math.round(result.waterDeficitMm))}</span>
          )}
        </button>
      ))}
    </div>
  )
}

