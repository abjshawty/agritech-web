import type { RefObject } from 'react'
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
  backRef,
}: {
  result: Result
  crop: Crop | undefined
  data: RecommendResponse
  onBack: () => void
  backRef: RefObject<HTMLButtonElement | null>
}) {
  const { t, lang } = useLang()
  const inCycle = result.kind === 'annual' ? cycleMonths(data.plantingMonth, crop?.cycleMonths ?? 4) : cycleMonths(1, 12)
  const chart = data.site.climate.rain.map((mm, i) => ({ month: t.months[i]!.slice(0, 1).toUpperCase(), mm, i }))
  const rain = result.factors.find((factor) => factor.key === 'rain')
  const band = rain?.optimal ? rain.optimal.map((mm) => mm / inCycle.size) : null

  return (
    <div className="grid gap-4 rounded-xl border-2 border-black bg-white p-4" aria-labelledby="crop-detail-title">
      <button
        ref={backRef}
        type="button"
        onClick={onBack}
        className="min-h-12 justify-self-start rounded-lg border-2 border-black bg-white px-4 text-base font-bold text-leaf"
      >
        {t.back}
      </button>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="crop-detail-title" className="text-2xl font-extrabold">
          {crop?.name[lang] ?? result.cropId}
        </h2>
        <VerdictLabel result={result} />
      </div>

      <div className="grid gap-2">
        <span className="text-base font-bold text-muted">{t.monthlyRain}</span>
        <div
          className="h-52"
          role="img"
          aria-label={`${t.monthlyRain}: ${chart.map((item) => `${item.month} ${Math.round(item.mm)} mm`).join(', ')}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              {band && <ReferenceArea y1={band[0]} y2={band[1]} fill="#eef4ea" stroke="#000000" strokeDasharray="4 3" />}
              <XAxis dataKey="month" tick={{ fill: '#000000', fontSize: 16 }} />
              <YAxis tick={{ fill: '#000000', fontSize: 16 }} width={48} />
              <Bar dataKey="mm" stroke="#000000" strokeWidth={1}>
                {chart.map((item) => (
                  <Cell key={item.i} fill={inCycle.has(item.i) ? '#1b5e20' : '#9a3b00'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <span className="text-base font-semibold text-muted">■ {t.cycle}</span>
      </div>

      <div className="grid gap-3">
        {result.factors.map((factor) => (
          <div key={factor.key} className="grid grid-cols-[minmax(5.5rem,7rem)_1fr_3rem] items-center gap-2 text-base">
            <span className="font-semibold">{t.factor[factor.key]}</span>
            <ScoreBar value={factor.score * 100} verdict={factor.score >= 0.7 ? 'good' : factor.score >= 0.4 ? 'possible' : 'poor'} />
            <span className="text-right font-bold tabular-nums">{factor.score.toFixed(1)}</span>
          </div>
        ))}
      </div>

      <ul className="grid list-disc gap-2 border-t-2 border-black pt-3 pl-6 text-base">
        {result.reasons.map((reason, index) => (
          <li key={`${reason.key}-${index}`}>{reasonText(t, reason)}</li>
        ))}
      </ul>
    </div>
  )
}

