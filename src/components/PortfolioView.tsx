import { useMemo, useState } from 'react'
import { PieChart, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { changePercent, formatCurrency, formatPercent } from '../lib/marketEngine'
import type { Holding, Stock, Order } from '../types'

interface PortfolioViewProps {
  cash: number
  marginLoan?: number
  holdings: Holding[]
  stocks: Stock[]
  totalValue: number
  startingCash: number
  orders: Order[]
  portfolioPeak?: number
}

type SubTab = 'positions' | 'analytics' | 'log'

export function PortfolioView({
  cash,
  marginLoan = 0,
  holdings,
  stocks,
  totalValue,
  startingCash,
  orders,
  portfolioPeak,
}: PortfolioViewProps) {
  const [subTab, setSubTab] = useState<SubTab>('positions')
  const [isPrivilegesExpanded, setIsPrivilegesExpanded] = useState(false)

  const activePeakVal = Math.max(totalValue, portfolioPeak ?? 0)

  const pnl = totalValue - startingCash
  const pnlPct = (pnl / startingCash) * 100
  const up = pnl >= 0

  const rows = holdings
    .map((h) => {
      const s = stocks.find((x) => x.symbol === h.symbol)
      if (!s) return null
      const value = s.price * h.quantity
      const cost = h.avgCost * h.quantity
      const gain = value - cost
      const gainPct = (gain / cost) * 100
      return { holding: h, stock: s, value, cost, gain, gainPct }
    })
    .filter(Boolean) as {
    holding: Holding
    stock: Stock
    value: number
    cost: number
    gain: number
    gainPct: number
  }[]

  const invested = rows.reduce((s, r) => s + r.value, 0)

  // 1. Process Analytics
  const filledOrders = useMemo(() => orders.filter((o) => o.status === 'filled'), [orders])
  const totalOrdersCount = filledOrders.length

  const buysCount = useMemo(() => filledOrders.filter((o) => o.side === 'buy').length, [filledOrders])
  const sellsCount = useMemo(() => filledOrders.filter((o) => o.side === 'sell').length, [filledOrders])
  const buyPct = totalOrdersCount > 0 ? (buysCount / totalOrdersCount) * 100 : 50


  const marketCount = useMemo(() => filledOrders.filter((o) => o.type === 'market').length, [filledOrders])
  const limitCount = useMemo(() => filledOrders.filter((o) => o.type === 'limit').length, [filledOrders])
  const marketPct = totalOrdersCount > 0 ? (marketCount / totalOrdersCount) * 100 : 50

  const totalVolume = useMemo(() => {
    return filledOrders.reduce((sum, o) => sum + (o.fillPrice ?? 0) * o.quantity, 0)
  }, [filledOrders])

  const symbolStats = useMemo(() => {
    const stats: Record<
      string,
      {
        symbol: string
        buyQty: number
        buyVal: number
        sellQty: number
        sellVal: number
        orderCount: number
      }
    > = {}

    filledOrders.forEach((o) => {
      if (!stats[o.symbol]) {
        stats[o.symbol] = {
          symbol: o.symbol,
          buyQty: 0,
          buyVal: 0,
          sellQty: 0,
          sellVal: 0,
          orderCount: 0,
        }
      }
      const item = stats[o.symbol]
      item.orderCount += 1
      const price = o.fillPrice ?? 0
      if (o.side === 'buy') {
        item.buyQty += o.quantity
        item.buyVal += o.quantity * price
      } else {
        item.sellQty += o.quantity
        item.sellVal += o.quantity * price
      }
    })

    return Object.values(stats)
  }, [filledOrders])

  const activeLeader = useMemo(() => {
    if (symbolStats.length === 0) return null
    return [...symbolStats].sort((a, b) => b.orderCount - a.orderCount)[0]
  }, [symbolStats])

  const volumeLeader = useMemo(() => {
    if (symbolStats.length === 0) return null
    return [...symbolStats].sort((a, b) => b.buyVal + b.sellVal - (a.buyVal + a.sellVal))[0]
  }, [symbolStats])

  const perksInfo = useMemo(() => {
    if (activePeakVal >= 500000) {
      return {
        tierName: 'APEX Elite',
        badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        perkText: '3.3x Leverage · 3% Yield · Free Trades',
        glowClass: 'from-amber-500/25 via-amber-600/5 to-transparent',
        borderClass: 'border-amber-500/30',
      }
    } else if (activePeakVal >= 250000) {
      return {
        tierName: 'ZENITH Executive',
        badgeClass: 'bg-slate-400/10 text-slate-300 border border-slate-400/20',
        perkText: '2.5x Leverage · 1.5% Yield · 50% Off Fees',
        glowClass: 'from-slate-400/20 via-slate-500/5 to-transparent',
        borderClass: 'border-slate-500/20',
      }
    } else {
      return {
        tierName: 'GRID Standard',
        badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/20',
        perkText: '2.0x Leverage · Standard Perks',
        glowClass: 'from-red-500/10 via-red-600/5 to-transparent',
        borderClass: 'border-white/[0.06]',
      }
    }
  }, [activePeakVal])

  return (
    <div className="space-y-6">
      {/* Portfolio Equity Summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <div className={`col-span-2 sm:col-span-1 relative overflow-hidden rounded-xl border ${perksInfo.borderClass} bg-surface-950/40 p-4 flex flex-col justify-between min-h-[105px]`}>
          <div className={`absolute inset-0 bg-gradient-to-br opacity-10 pointer-events-none ${perksInfo.glowClass}`} />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-500">Total value</p>
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase ${perksInfo.badgeClass}`}>
                {perksInfo.tierName}
              </span>
            </div>
            <p className="mt-1 font-mono font-semibold text-2xl text-white">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <p className="text-[9.5px] text-slate-400 mt-2 truncate relative z-10 font-mono">
            {perksInfo.perkText}
          </p>
        </div>
        <Card label="Cash" value={formatCurrency(cash)} />
        <Card
          label="Margin loan"
          value={formatCurrency(marginLoan)}
          accent={marginLoan > 0 ? 'red' : undefined}
        />
        <Card label="Invested" value={formatCurrency(invested)} />
        <Card
          label="Total P/L"
          value={`${up ? '+' : ''}${formatCurrency(pnl)} (${formatPercent(pnlPct)})`}
          accent={up ? 'green' : 'red'}
        />
      </div>

      {/* Sub-tab Navigation Bar */}
      <div className="flex border-b border-white/[0.06] pb-1 gap-6">
        {(['positions', 'analytics', 'log'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSubTab(tab)}
            className={`border-b-2 pb-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              subTab === tab
                ? 'border-thriv-500 text-thriv-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'log' ? 'Trade Log' : tab}
          </button>
        ))}
      </div>

      {/* ── POSITIONS TAB ──────────────────────── */}
      {subTab === 'positions' && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-thriv-400" />
              <h3 className="font-display text-lg font-semibold">Holdings</h3>
            </div>
            {rows.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No positions yet. Visit the Market tab and place your first paper trade.
              </p>
            ) : (
              <>
                <div className="space-y-2 md:hidden">
                  {rows.map(({ holding, stock, value, gain, gainPct }) => {
                    const dayCh = changePercent(stock)
                    const dayUp = dayCh >= 0
                    const posUp = gain >= 0
                    return (
                      <div
                        key={holding.symbol}
                        className="rounded-lg border border-white/5 bg-surface-900/40 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-semibold text-thriv-300">
                            {holding.symbol}
                          </span>
                          <span className="font-mono text-sm text-white">{formatCurrency(value)}</span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-3 gap-x-2 gap-y-1 text-[11px]">
                          <div>
                            <p className="text-slate-500">Qty</p>
                            <p className="font-mono text-slate-300">{holding.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-500">Avg</p>
                            <p className="font-mono text-slate-300">{formatCurrency(holding.avgCost)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-500">Price</p>
                            <p className="font-mono text-slate-300">{formatCurrency(stock.price)}</p>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono">
                          <span className={posUp ? 'text-emerald-400' : 'text-red-400'}>
                            {formatCurrency(gain)} ({formatPercent(gainPct)})
                          </span>
                          <span className={dayUp ? 'text-emerald-400/80' : 'text-red-400/80'}>
                            Day {formatPercent(dayCh)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                        <th className="pb-3 text-left">Symbol</th>
                        <th className="pb-3 text-right">Qty</th>
                        <th className="pb-3 text-right">Avg cost</th>
                        <th className="pb-3 text-right">Price</th>
                        <th className="pb-3 text-right">Value</th>
                        <th className="pb-3 text-right">P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ holding, stock, value, gain, gainPct }) => {
                        const dayCh = changePercent(stock)
                        return (
                          <tr key={holding.symbol} className="border-b border-white/5">
                            <td className="py-3 font-mono font-semibold text-thriv-300">
                              {holding.symbol}
                            </td>
                            <td className="py-3 text-right font-mono">{holding.quantity}</td>
                            <td className="py-3 text-right font-mono text-slate-400">
                              {formatCurrency(holding.avgCost)}
                            </td>
                            <td className="py-3 text-right font-mono">{formatCurrency(stock.price)}</td>
                            <td className="py-3 text-right font-mono">{formatCurrency(value)}</td>
                            <td
                              className={`py-3 text-right font-mono ${
                                gain >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {formatCurrency(gain)} ({formatPercent(gainPct)})
                              <span className="block text-[10px] text-slate-500">
                                Day {formatPercent(dayCh)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {rows.length > 0 && (
            <div className="glass rounded-xl p-5">
              <h3 className="mb-3 font-display text-sm font-semibold text-slate-400">
                Allocation (by value)
              </h3>
              <div className="space-y-2">
                {rows.map(({ holding, value }) => {
                  const pct = (value / totalValue) * 100
                  return (
                    <div key={holding.symbol}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-mono text-thriv-300">{holding.symbol}</span>
                        <span className="text-slate-500">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-900">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-thriv-600 to-thriv-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-400">Cash</span>
                    <span className="text-slate-500">{((cash / totalValue) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-900">
                    <div
                      className="h-full rounded-full bg-slate-600"
                      style={{ width: `${(cash / totalValue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Virtual Card Privileges Comparison Table */}
          <div className="glass rounded-xl p-4 sm:p-5 border border-white/[0.06] bg-surface-950/25">
            <button
              type="button"
              onClick={() => setIsPrivilegesExpanded(!isPrivilegesExpanded)}
              className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer group"
            >
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-sm font-semibold text-white tracking-wide group-hover:text-thriv-400 transition-colors">
                    Virtual Ledger Card Privileges
                  </h3>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider leading-none ${
                    activePeakVal >= 500000
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                      : activePeakVal >= 250000
                      ? 'bg-slate-400/10 text-slate-350 border-slate-400/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {activePeakVal >= 500000 ? 'APEX Active' : activePeakVal >= 250000 ? 'ZENITH Active' : 'GRID Active'}
                  </span>
                </div>
                {!isPrivilegesExpanded && (
                  <p className="text-[10.5px] text-slate-500 font-mono mt-1.5 leading-normal">
                    {activePeakVal >= 500000
                      ? '3.3x Leverage · 3.0% Yield · 1.5x XP · Free Trades'
                      : activePeakVal >= 250000
                      ? '2.5x Leverage · 1.5% Yield · 1.25x XP · 50% Off Fees'
                      : '2.0x Leverage · Standard XP · $5.00 / trade'}
                  </p>
                )}
                {isPrivilegesExpanded && (
                  <p className="text-[10px] text-slate-500 mt-1">Your card tier is based on your total portfolio value (Equity). Unlock premium tiers to gain bonus trading perks.</p>
                )}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white shrink-0">
                {isPrivilegesExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>
            
            {isPrivilegesExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 animate-in fade-in duration-200">
                {/* GRID */}
                <div className={`rounded-xl p-4 border transition-all ${
                  activePeakVal < 250000 
                    ? 'border-red-500/35 bg-red-950/10 shadow-[0_0_15px_rgba(239,68,68,0.05)]' 
                    : 'border-white/5 bg-white/[0.01] opacity-75'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold text-red-400">GRID Card</span>
                    {activePeakVal < 250000 && (
                      <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Active</span>
                    )}
                  </div>
                  <div className="mt-2 font-display text-lg font-bold text-white">$0+</div>
                  <ul className="mt-3 space-y-2 text-[10.5px] text-slate-400 font-mono">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-red-400 shrink-0" /> 2.0x Loan Leverage
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-red-400 shrink-0" /> Standard 1.0x XP Progression
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-500">
                      <X className="h-3.5 w-3.5 text-slate-650 shrink-0" /> No Cash Yield (0% APY)
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-500">
                      <X className="h-3.5 w-3.5 text-slate-650 shrink-0" /> Standard $5.00 Trade Fee
                    </li>
                  </ul>
                </div>

                {/* ZENITH */}
                <div className={`rounded-xl p-4 border transition-all ${
                  activePeakVal >= 250000 && activePeakVal < 500000 
                    ? 'border-slate-400/40 bg-slate-900/20 shadow-[0_0_15px_rgba(148,163,184,0.08)]' 
                    : 'border-white/5 bg-white/[0.01]'
                } ${activePeakVal < 250000 ? 'opacity-85' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold text-slate-300">ZENITH Card</span>
                    {activePeakVal >= 250000 && activePeakVal < 500000 && (
                      <span className="bg-slate-400/20 text-slate-350 border border-slate-400/30 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Active</span>
                    )}
                    {activePeakVal < 250000 && (
                      <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider">Unlocks at $250k</span>
                    )}
                  </div>
                  <div className="mt-2 font-display text-lg font-bold text-white">$250,000+</div>
                  <ul className="mt-3 space-y-2 text-[10.5px] text-slate-400 font-mono">
                    <li className="flex items-center gap-1.5 text-slate-200">
                      <Check className="h-3.5 w-3.5 text-slate-300 shrink-0" /> 2.5x Loan Leverage (60% Cap)
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-200">
                      <Check className="h-3.5 w-3.5 text-slate-300 shrink-0" /> 1.5% Monthly Return on Cash
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-200">
                      <Check className="h-3.5 w-3.5 text-slate-300 shrink-0" /> 1.25x Quiz & Sprint XP Boost
                    </li>
                    <li className="flex items-center gap-1.5 text-slate-200">
                      <Check className="h-3.5 w-3.5 text-slate-300 shrink-0" /> 50% Off Trade Fees ($2.50)
                    </li>
                  </ul>
                </div>

                {/* APEX */}
                <div className={`rounded-xl p-4 border transition-all ${
                  activePeakVal >= 500000 
                    ? 'border-amber-500/40 bg-amber-950/10 shadow-[0_0_20px_rgba(245,158,11,0.08)]' 
                    : 'border-white/5 bg-white/[0.01]'
                } ${activePeakVal < 500000 ? 'opacity-75' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold text-amber-400">APEX Card</span>
                    {activePeakVal >= 500000 && (
                      <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Active</span>
                    )}
                    {activePeakVal < 500000 && (
                      <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider">Unlocks at $500k</span>
                    )}
                  </div>
                  <div className="mt-2 font-display text-lg font-bold text-white">$500,000+</div>
                  <ul className="mt-3 space-y-2 text-[10.5px] text-slate-400 font-mono">
                    <li className="flex items-center gap-1.5 text-amber-200">
                      <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" /> 3.3x Loan Leverage (70% Cap)
                    </li>
                    <li className="flex items-center gap-1.5 text-amber-200">
                      <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" /> 3.0% Monthly Return on Cash
                    </li>
                    <li className="flex items-center gap-1.5 text-amber-200">
                      <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" /> 1.5x Quiz & Sprint XP Boost
                    </li>
                    <li className="flex items-center gap-1.5 text-amber-200">
                      <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" /> Free Trades ($0.00 Comm.)
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ──────────────────────── */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          {totalOrdersCount === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-slate-500 text-sm">
              No trade logs available to compute analytics. Place orders first.
            </div>
          ) : (
            <>
              {/* Telemetry metrics cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card label="Total Orders Executed" value={String(totalOrdersCount)} />
                <Card label="Total Traded Volume" value={formatCurrency(totalVolume)} />
                {activeLeader && (
                  <Card
                    label="Activity Leader"
                    value={`${activeLeader.symbol} (${activeLeader.orderCount} orders)`}
                  />
                )}
                {volumeLeader && (
                  <Card
                    label="Volume Leader"
                    value={`${volumeLeader.symbol} (${formatCurrency(volumeLeader.buyVal + volumeLeader.sellVal)})`}
                  />
                )}
              </div>

              {/* Splits & order statistics */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="glass rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Order Side Ratio
                  </h4>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-emerald-400">Buys: {buysCount}</span>
                    <span className="text-red-400">Sells: {sellsCount}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden flex bg-surface-900">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${buyPct}%` }}
                    />
                    <div className="bg-red-500 h-full flex-1" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Shows your trading bias. Balanced portfolios usually distribute between buys and exits to lock profit.
                  </p>
                </div>

                <div className="glass rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Execution Method
                  </h4>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-thriv-400">Market: {marketCount}</span>
                    <span className="text-slate-400">Limit: {limitCount}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden flex bg-surface-900">
                    <div
                      className="bg-thriv-500 h-full transition-all"
                      style={{ width: `${marketPct}%` }}
                    />
                    <div className="bg-slate-600 h-full flex-1" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Market orders execute instantly at current price, while limit orders give price target control.
                  </p>
                </div>
              </div>

              {/* Performance Breakdown Table */}
              <div className="glass rounded-xl p-5">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Performance Breakdown by Symbol
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                        <th className="pb-3 text-left">Asset</th>
                        <th className="pb-3 text-right">Buys (Qty)</th>
                        <th className="pb-3 text-right">Avg Buy Price</th>
                        <th className="pb-3 text-right">Sells (Qty)</th>
                        <th className="pb-3 text-right">Avg Sell Price</th>
                        <th className="pb-3 text-right">Exited Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {symbolStats.map((item) => {
                        const avgBuy = item.buyQty > 0 ? item.buyVal / item.buyQty : 0
                        const avgSell = item.sellQty > 0 ? item.sellVal / item.sellQty : 0
                        const totalUnits = item.buyQty + item.sellQty
                        const exitPct = totalUnits > 0 ? (item.sellQty / totalUnits) * 100 : 0

                        return (
                          <tr key={item.symbol} className="border-b border-white/5">
                            <td className="py-3 font-mono font-semibold text-thriv-300">
                              {item.symbol}
                            </td>
                            <td className="py-3 text-right font-mono text-slate-300">
                              {item.buyQty > 0 ? `${item.buyQty} shares` : '—'}
                            </td>
                            <td className="py-3 text-right font-mono text-slate-400">
                              {avgBuy > 0 ? formatCurrency(avgBuy) : '—'}
                            </td>
                            <td className="py-3 text-right font-mono text-slate-300">
                              {item.sellQty > 0 ? `${item.sellQty} shares` : '—'}
                            </td>
                            <td className="py-3 text-right font-mono text-slate-400">
                              {avgSell > 0 ? formatCurrency(avgSell) : '—'}
                            </td>
                            <td className="py-3 text-right font-mono text-slate-400">
                              {exitPct.toFixed(0)}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TRADE LOG TAB ──────────────────────── */}
      {subTab === 'log' && (
        <div className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Historical Trade Log</h3>
            <span className="text-xs font-mono text-slate-500">{filledOrders.length} filled</span>
          </div>
          {filledOrders.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">
              No filled trades recorded. Place market or limit orders in the trade panel.
            </p>
          ) : (
            <>
              {/* Mobile Trade Log List */}
              <div className="space-y-2 md:hidden">
                {filledOrders.map((o) => {
                  const price = o.fillPrice ?? 0
                  const total = price * o.quantity
                  return (
                    <div
                      key={o.id}
                      className="rounded-lg border border-white/5 bg-surface-900/40 px-3 py-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-sm font-semibold text-thriv-300">
                          {o.symbol}
                        </span>
                        <span
                          className={`text-xs font-mono uppercase font-semibold ${
                            o.side === 'buy' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {o.side} · {o.type}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-slate-500 font-mono">
                        <span>{o.quantity} shares @ {formatCurrency(price)}</span>
                        <span className="text-slate-300">{formatCurrency(total)}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-600 font-mono">
                        {new Date(o.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Desktop Trade Log Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-xs uppercase text-slate-500">
                      <th className="pb-3 text-left">Execution Time</th>
                      <th className="pb-3 text-left">Symbol</th>
                      <th className="pb-3 text-left">Side</th>
                      <th className="pb-3 text-left">Type</th>
                      <th className="pb-3 text-right">Shares</th>
                      <th className="pb-3 text-right">Price</th>
                      <th className="pb-3 text-right">Net Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filledOrders.map((o) => {
                      const price = o.fillPrice ?? 0
                      const total = price * o.quantity
                      return (
                        <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-3 text-slate-500 font-mono text-xs">
                            {new Date(o.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 font-mono font-semibold text-thriv-300">
                            {o.symbol}
                          </td>
                          <td
                            className={`py-3 capitalize font-medium ${
                              o.side === 'buy' ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {o.side}
                          </td>
                          <td className="py-3 capitalize text-slate-400">{o.type}</td>
                          <td className="py-3 text-right font-mono text-slate-300">
                            {o.quantity}
                          </td>
                          <td className="py-3 text-right font-mono text-slate-300">
                            {formatCurrency(price)}
                          </td>
                          <td className="py-3 text-right font-mono text-slate-300">
                            {formatCurrency(total)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Card({
  label,
  value,
  large,
  accent,
}: {
  label: string
  value: string
  large?: boolean
  accent?: 'green' | 'red'
}) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-1 font-mono font-semibold ${
          large ? 'text-2xl' : 'text-lg'
        } ${
          accent === 'green'
            ? 'text-emerald-400'
            : accent === 'red'
              ? 'text-red-400'
              : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
