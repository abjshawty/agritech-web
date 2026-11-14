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
    <span className={`text-sm font-bold whitespace-nowrap ${style.text}`}>
      {style.icon} {t.verdict[result.verdict]} · {result.score}
    </span>
  )
}

export function ScoreBar({ value, verdict }: { value: number; verdict: Verdict }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-line">
      <div className={`h-full rounded-full ${verdictStyle[verdict].bar}`} style={{ width: `${value}%` }} />
    </div>
  )
}

export function SiteSummary({ data }: { data: RecommendResponse }) {
  const { t } = useLang()
  const { site } = data
  const rainSign = site.shift.rainPct > 0 ? '+' : ''
  const tempSign = site.shift.tempDelta > 0 ? '+' : ''
  return (
    <div className="grid gap-1 rounded-xl bg-leaf-soft p-3 text-sm">
      <b>
        {site.nearestTown} · {t.sowing} {t.months[data.plantingMonth - 1]}
      </b>
      <span>
        {Math.round(site.climate.annualRain)} {t.perYear} · {t.texture[site.soil.texture]} · pH {site.soil.ph}
      </span>
      <span>
        <span className="rounded-md bg-ochre-soft px-1.5 py-0.5 text-xs font-bold text-ochre">
          {t.rain} {rainSign}
          {site.shift.rainPct} % · {tempSign}
          {site.shift.tempDelta} °C {t.since}
        </span>
      </span>
      {data.source === 'snapshot' && <span className="text-xs text-muted">{t.sample}</span>}
    </div>
  )
}

export function Results({
  data,
  crops,
  onOpen,
}: {
  data: RecommendResponse
  crops: Map<string, Crop>
  onOpen: (r: Result) => void
}) {
  const { t, lang } = useLang()
  return (
    <div className="grid gap-2">
      <SiteSummary data={data} />
      {data.results.map((r) => (
        <button
          key={r.cropId}
          onClick={() => onOpen(r)}
          className="grid gap-1.5 rounded-xl border border-line bg-white p-3 text-left hover:border-leaf focus-visible:outline-2 focus-visible:outline-leaf"
        >
          <div className="flex items-baseline justify-between gap-2">
            <b>{crops.get(r.cropId)?.name[lang] ?? r.cropId}</b>
            <VerdictLabel result={r} />
          </div>
          <ScoreBar value={r.score} verdict={r.verdict} />
          {r.reasons[0] && <span className="text-sm text-muted">{reasonText(t, r.reasons[0])}</span>}
          {r.gaez != null && <span className="text-xs text-muted">{t.gaez(r.gaez)}</span>}
          {r.waterDeficitMm > 0 && !data.irrigated && (
            <span className="text-sm font-semibold text-poor">{t.deficit(r.waterDeficitMm)}</span>
          )}
        </button>
      ))}
    </div>
  )
}
