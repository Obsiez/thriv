import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PricePoint } from '../types'
import { formatChartTime, type ChartRange } from '../lib/chartSeries'
import { formatCurrency } from '../lib/marketEngine'

interface TradingChartProps {
  data: PricePoint[]
  color: string
  range: ChartRange
  /** Pulse on last point for live 1D only */
  liveTail?: boolean
  className?: string
}

function chartPad(width: number) {
  if (width < 360) return { top: 6, right: 4, bottom: 18, left: 36 }
  if (width < 480) return { top: 8, right: 6, bottom: 20, left: 42 }
  return { top: 12, right: 12, bottom: 28, left: 52 }
}

function volHeight(width: number) {
  return width < 480 ? 22 : 32
}

export function TradingChart({ data, color, range, liveTail = false, className }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 320, h: 220 })
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        setSize({ w: Math.floor(width), h: Math.floor(height) })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pad = chartPad(size.w)
  const volH = volHeight(size.w)
  const chartH = Math.max(120, size.h - volH)

  const layout = useMemo(() => {
    if (data.length < 2 || size.w < 40) {
      return null
    }

    const prices = data.map((d) => d.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const padY = Math.max((max - min) * 0.06, max * 0.008)
    const yMin = min - padY
    const yMax = max + padY
    const yRange = yMax - yMin || 1

    const innerW = size.w - pad.left - pad.right
    const innerH = chartH - pad.top - pad.bottom

    const pts = data.map((d, i) => {
      const x = pad.left + (i / (data.length - 1)) * innerW
      const y = pad.top + innerH - ((d.price - yMin) / yRange) * innerH
      return { x, y, price: d.price, time: d.time, i }
    })

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
    const baseY = pad.top + innerH
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${baseY} L ${pts[0].x.toFixed(2)} ${baseY} Z`

    const volMax = Math.max(
      ...data.map((_, i) => Math.abs(data[i].price - (data[i - 1]?.price ?? data[i].price)) + 0.01)
    )

    const volumes = data.map((d, i) => {
      const delta = i === 0 ? 0 : Math.abs(d.price - data[i - 1].price)
      const h = (delta / volMax) * (volH - 6)
      const x = pts[i].x
      const barW = size.w < 480 ? 2 : 4
      return { x, h: Math.max(1.5, h), up: i === 0 ? true : d.price >= data[i - 1].price, barW }
    })

    const yTicks = [yMin, yMin + yRange * 0.5, yMax].map((tick) => ({
      tick,
      y: pad.top + innerH - ((tick - yMin) / yRange) * innerH,
    }))

    const xLabelCount = size.w < 400 ? 4 : Math.min(6, data.length)
    const xLabels = Array.from({ length: xLabelCount }, (_, j) => {
      const idx = Math.round((j / (xLabelCount - 1)) * (data.length - 1))
      return { x: pts[idx].x, label: formatChartTime(data[idx].time, range), idx }
    })

    return { pts, line, area, yTicks, xLabels, volumes, innerH, innerW, pad }
  }, [data, size.w, chartH, range, pad, volH])

  const onMove = useCallback(
    (clientX: number) => {
      if (!layout || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      let nearest = 0
      let best = Infinity
      layout.pts.forEach((p) => {
        const d = Math.abs(p.x - x)
        if (d < best) {
          best = d
          nearest = p.i
        }
      })
      setHover(nearest)
    },
    [layout]
  )

  const hoverPt = hover != null && layout ? layout.pts[hover] : null
  const gradId = `fill-${color.replace('#', '')}`
  const fontSize = size.w < 400 ? 8 : 10
  const tooltipLeft = hoverPt
    ? Math.min(Math.max(hoverPt.x, 56), size.w - 56)
    : 0

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-w-0 select-none touch-none overflow-hidden ${className ?? 'h-[200px] sm:h-[280px] md:h-[300px]'}`}
      onMouseMove={(e) => onMove(e.clientX)}
      onMouseLeave={() => setHover(null)}
      onTouchMove={(e) => {
        e.preventDefault()
        if (e.touches[0]) onMove(e.touches[0].clientX)
      }}
      onTouchEnd={() => setHover(null)}
    >
      {!layout ? (
        <div className="flex h-full items-center justify-center text-xs text-slate-500">
          Loading chart…
        </div>
      ) : (
        <>
          <svg
            width={size.w}
            height={chartH}
            className="block max-w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>

            {layout.yTicks.map(({ tick, y }, i) => (
              <g key={i}>
                <line
                  x1={layout.pad.left}
                  y1={y}
                  x2={size.w - layout.pad.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="2 4"
                />
                <text
                  x={layout.pad.left - 4}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize={fontSize}
                  fontFamily="JetBrains Mono, ui-monospace, monospace"
                >
                  {tick >= 1000 ? `$${(tick / 1000).toFixed(1)}k` : `$${tick.toFixed(2)}`}
                </text>
              </g>
            ))}

            {layout.xLabels.map(({ x, label, idx }) => (
              <text
                key={idx}
                x={x}
                y={chartH - 4}
                textAnchor="middle"
                fill="#64748b"
                fontSize={fontSize - 1}
                fontFamily="JetBrains Mono, ui-monospace, monospace"
              >
                {label}
              </text>
            ))}

            <path d={layout.area} fill={`url(#${gradId})`} />
            <path
              d={layout.line}
              fill="none"
              stroke={color}
              strokeWidth={size.w < 400 ? 1.5 : 1.75}
              strokeLinejoin="miter"
              strokeLinecap="butt"
            />

            {hoverPt && (
              <>
                <line
                  x1={hoverPt.x}
                  y1={layout.pad.top}
                  x2={hoverPt.x}
                  y2={layout.pad.top + layout.innerH}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={hoverPt.x}
                  cy={hoverPt.y}
                  r={size.w < 400 ? 3.5 : 4}
                  fill={color}
                  stroke="#0a0f14"
                  strokeWidth={2}
                />
              </>
            )}

            {!hoverPt && layout.pts.length > 0 && (
              <>
                <circle
                  cx={layout.pts[layout.pts.length - 1].x}
                  cy={layout.pts[layout.pts.length - 1].y}
                  r={3}
                  fill={color}
                />
                {liveTail && (
                  <circle
                    cx={layout.pts[layout.pts.length - 1].x}
                    cy={layout.pts[layout.pts.length - 1].y}
                    r={6}
                    fill={color}
                    fillOpacity={0.15}
                    className="chart-live-pulse"
                  />
                )}
              </>
            )}
          </svg>

          <svg width={size.w} height={volH} className="block opacity-55" aria-hidden>
            {layout.volumes.map((v, i) => (
              <rect
                key={i}
                x={v.x - v.barW / 2}
                y={volH - v.h}
                width={v.barW}
                height={v.h}
                fill={v.up ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}
              />
            ))}
          </svg>

          {hoverPt && (
            <div
              className="pointer-events-none absolute z-10 rounded-md border border-white/10 bg-surface-900/95 px-2 py-1 shadow-xl backdrop-blur-sm max-w-[140px]"
              style={{
                left: tooltipLeft,
                top: Math.max(hoverPt.y - 44, 4),
                transform: 'translateX(-50%)',
              }}
            >
              <p className="font-mono text-[9px] sm:text-[10px] text-slate-500 truncate">
                {formatChartTime(hoverPt.time, range)}
              </p>
              <p className="font-mono text-xs sm:text-sm font-semibold text-white tabular-nums">
                {formatCurrency(hoverPt.price)}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
