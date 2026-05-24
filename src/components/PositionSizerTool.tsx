import { useState } from 'react'
import { ArrowLeft, Calculator } from 'lucide-react'
import { formatCurrency } from '../lib/marketEngine'

interface PositionSizerToolProps {
  portfolioCash: number
  onBack: () => void
  onUsed: () => void
}

export function PositionSizerTool({ portfolioCash, onBack, onUsed }: PositionSizerToolProps) {
  const [price, setPrice] = useState('100')
  const [riskPct, setRiskPct] = useState('2')
  const [stopPct, setStopPct] = useState('5')
  const [calculated, setCalculated] = useState(false)

  const p = parseFloat(price) || 0
  const risk = parseFloat(riskPct) || 0
  const stop = parseFloat(stopPct) || 0

  const riskAmount = portfolioCash * (risk / 100)
  const stopDistance = p * (stop / 100)
  const shares =
    stopDistance > 0 ? Math.floor(riskAmount / stopDistance) : 0
  const cost = shares * p
  const pctOfPortfolio = portfolioCash > 0 ? (cost / portfolioCash) * 100 : 0

  function calculate() {
    setCalculated(true)
    onUsed()
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-thriv-400" strokeWidth={1.75} />
        <h2 className="font-display text-lg font-semibold">Position Sizer</h2>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        Educational risk model: size positions from portfolio risk % and stop distance.
      </p>
      <div className="glass space-y-3 rounded-xl p-4 border border-white/[0.06]">
        <Field label="Entry price ($)" value={price} onChange={setPrice} />
        <Field label="Risk per trade (% of portfolio)" value={riskPct} onChange={setRiskPct} />
        <Field label="Stop loss distance (% below entry)" value={stopPct} onChange={setStopPct} />
        <button
          type="button"
          onClick={calculate}
          className="w-full rounded-lg bg-thriv-700 py-3 text-sm font-semibold touch-manipulation min-h-[48px]"
        >
          Calculate
        </button>
      </div>
      {calculated && p > 0 && (
        <div className="glass rounded-xl p-4 border border-thriv-700/30 space-y-2 text-sm">
          <Row label="Risk capital" value={formatCurrency(riskAmount)} />
          <Row label="Suggested shares" value={String(shares)} />
          <Row label="Position cost" value={formatCurrency(cost)} />
          <Row label="% of portfolio" value={`${pctOfPortfolio.toFixed(1)}%`} />
          {cost > portfolioCash && (
            <p className="text-xs text-amber-400 pt-2">Exceeds available cash — reduce size or risk %.</p>
          )}
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-slate-500">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2.5 font-mono text-sm min-h-[44px]"
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-200">{value}</span>
    </div>
  )
}
