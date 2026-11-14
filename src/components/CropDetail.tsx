import { Bar, BarChart, Cell, ReferenceArea, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { Crop, RecommendResponse, Result } from '@/api/client'
import { reasonText, useLang } from '@/i18n'
import { ScoreBar, VerdictLabel } from './Results'

const cycleMonths = (planting: number, length: number) =>
  new Set(Array.from({ length }, (_, i) => (planting - 1 + i) % 12))

export function CropDetail({
  result,
  crop,
  data,
  onBack,
}: {
  result: Result
  crop: Crop | undefined
  data: RecommendResponse
  onBack: () => void
}) {
  const { t, lang } = useLang()
  const inCycle =
    result.kind === 'annual' ? cycleMonths(data.plantingMonth, crop?.cycleMonths ?? 4) : cycleMonths(1, 12)
  const chart = data.site.climate.rain.map((mm, i) => ({ month: t.months[i]!.slice(0, 1).toUpperCase(), mm, i }))

  // The crop's optimal rainfall, spread evenly over the months it covers, shaded behind the bars.
  const rain = result.factors.find((f) => f.key === 'rain')
  const band = rain?.optimal ? rain.optimal.map((mm) => mm / inCycle.size) : null

  return (
    <div className="grid gap-3">
      <button onClick={onBack} className="justify-self-start text-sm font-semibold text-leaf">
        {t.back}
      </button>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold">{crop?.name[lang] ?? result.cropId}</h2>
        <VerdictLabel result={result} />
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">{t.monthlyRain}</span>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              {band && <ReferenceArea y1={band[0]} y2={band[1]} fill="#e3eee6" stroke="#1f5a3a" strokeDasharray="4 3" />}
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <Bar dataKey="mm" radius={[3, 3, 0, 0]}>
                {chart.map((d) => (
                  <Cell key={d.i} fill={inCycle.has(d.i) ? '#1f5a3a' : '#c7d3bd'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <span className="text-xs text-muted">■ {t.cycle}</span>
      </div>

      <div className="grid gap-2">
        {result.factors.map((f) => (
          <div key={f.key} className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-2 text-sm">
            <span>{t.factor[f.key]}</span>
            <ScoreBar value={f.score * 100} verdict={f.score >= 0.7 ? 'good' : f.score >= 0.4 ? 'possible' : 'poor'} />
            <span className="text-right text-xs text-muted tabular-nums">{f.score.toFixed(1)}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-1 text-sm">
        <span>{t.moisture(Math.round(result.moisture * 100))}</span>
        {result.gaez != null && (
          <span>
            {t.gaez(result.gaez)} <span className="text-xs text-muted">· {t.gaezNote}</span>
          </span>
        )}
      </div>

      <ul className="grid list-disc gap-1 pl-5 text-sm">
        {result.reasons.map((r) => (
          <li key={r.key}>{reasonText(t, r)}</li>
        ))}
      </ul>
    </div>
  )
}
