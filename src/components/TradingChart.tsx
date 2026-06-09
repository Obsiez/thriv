import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PricePoint } from '../types'
import { formatChartTime, type ChartRange } from '../lib/chartSeries'
import { formatCurrency } from '../lib/marketEngine'
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react'

interface TradingChartProps {
  data: PricePoint[]
  color: string
  range: ChartRange
  /** Pulse on last point for live 1D only */
  liveTail?: boolean
  /** Horizontal reference (e.g. option strike) */
  referencePrice?: number
  /** Smaller chart without volume strip */
  compact?: boolean
  className?: string
  orders?: any[]
  showVolume?: boolean
}

function chartPad(width: number) {
  if (width < 360) return { top: 6, right: 4, bottom: 18, left: 36 }
  if (width < 480) return { top: 8, right: 6, bottom: 20, left: 42 }
  return { top: 12, right: 12, bottom: 28, left: 52 }
}

function volHeight(width: number) {
  return width < 480 ? 22 : 32
}

const getTouchDistance = (t1: React.Touch | Touch, t2: React.Touch | Touch) => {
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

export function TradingChart({
  data,
  color,
  range,
  liveTail = false,
  referencePrice,
  compact = false,
  className,
  showVolume = true,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 320, h: 220 })
  const [hover, setHover] = useState<number | null>(null)
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const panStartX = useRef(0)
  const panStartRange = useRef<[number, number] | null>(null)
  const pinchStartDistance = useRef<number | null>(null)
  const pinchStartRange = useRef<[number, number] | null>(null)

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

  const pad = useMemo(() => chartPad(size.w), [size.w])
  const volH = (compact || showVolume === false) ? 0 : volHeight(size.w)
  const chartH = Math.max((compact || showVolume === false) ? 100 : 120, size.h - volH)

  // Track data changes for live updates when zoomed in
  const prevDataLengthRef = useRef(data.length)
  useEffect(() => {
    if (zoomRange) {
      const prevLen = prevDataLengthRef.current
      const curLen = data.length
      if (curLen !== prevLen) {
        const [start, end] = zoomRange
        // If they were at the latest tick, slide the window to keep the latest tick visible
        if (end >= prevLen - 2) {
          const count = end - start + 1
          const newEnd = curLen - 1
          const newStart = Math.max(0, newEnd - count + 1)
          setZoomRange([newStart, newEnd])
        } else {
          // Clamp bounds
          setZoomRange([
            Math.min(start, curLen - 1),
            Math.min(end, curLen - 1)
          ])
        }
      }
    }
    prevDataLengthRef.current = data.length
  }, [data.length, zoomRange])

  // Reset zoom if range changes (e.g. from 1D to 1M) or if new stock loaded
  const prevRangeRef = useRef(range)
  useEffect(() => {
    if (range !== prevRangeRef.current) {
      setZoomRange(null)
    }
    prevRangeRef.current = range
  }, [range])

  const handleZoomIn = useCallback(() => {
    const len = data.length
    if (len < 5) return
    const currentRange = zoomRange || [0, len - 1]
    const [start, end] = currentRange
    const count = end - start + 1
    const newCount = Math.max(5, Math.round(count * 0.7))
    if (newCount >= count) return

    const center = Math.round((start + end) / 2)
    const newStart = Math.max(0, Math.min(len - newCount, center - Math.round(newCount / 2)))
    const newEnd = newStart + newCount - 1
    setZoomRange([newStart, newEnd])
  }, [data.length, zoomRange])

  const handleZoomOut = useCallback(() => {
    const len = data.length
    if (!zoomRange) return
    const [start, end] = zoomRange
    const count = end - start + 1
    const newCount = Math.min(len, Math.round(count / 0.7))
    if (newCount <= count) {
      setZoomRange(null)
      return
    }

    const center = Math.round((start + end) / 2)
    const newStart = Math.max(0, Math.min(len - newCount, center - Math.round(newCount / 2)))
    const newEnd = newStart + newCount - 1
    if (newStart === 0 && newEnd === len - 1) {
      setZoomRange(null)
    } else {
      setZoomRange([newStart, newEnd])
    }
  }, [data.length, zoomRange])

  const handleZoomReset = useCallback(() => {
    setZoomRange(null)
  }, [])

  // Mouse wheel zoom
  const zoomInRef = useRef(handleZoomIn)
  const zoomOutRef = useRef(handleZoomOut)
  useEffect(() => {
    zoomInRef.current = handleZoomIn
    zoomOutRef.current = handleZoomOut
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY < 0) {
        zoomInRef.current()
      } else {
        zoomOutRef.current()
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  // Slice data based on zoom
  const visibleData = useMemo(() => {
    if (!zoomRange) return data
    const [start, end] = zoomRange
    const s = Math.max(0, Math.min(start, data.length - 1))
    const e = Math.max(s + 2, Math.min(end, data.length - 1))
    return data.slice(s, e + 1)
  }, [data, zoomRange])

  const layout = useMemo(() => {
    if (visibleData.length < 2 || size.w < 40) {
      return null
    }

    const prices = visibleData.map((d) => d.price)
    const refPrices =
      referencePrice != null ? [...prices, referencePrice] : prices
    const min = Math.min(...refPrices)
    const max = Math.max(...refPrices)
    const padY = Math.max((max - min) * 0.06, max * 0.008)
    const yMin = min - padY
    const yMax = max + padY
    const yRange = yMax - yMin || 1

    const innerW = size.w - pad.left - pad.right
    const innerH = chartH - pad.top - pad.bottom

    const pts = visibleData.map((d, i) => {
      const x = pad.left + (i / (visibleData.length - 1)) * innerW
      const y = pad.top + innerH - ((d.price - yMin) / yRange) * innerH
      return { x, y, price: d.price, time: d.time, i }
    })

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
    const baseY = pad.top + innerH
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${baseY} L ${pts[0].x.toFixed(2)} ${baseY} Z`

    const volMax = Math.max(
      ...visibleData.map((_, i) => Math.abs(visibleData[i].price - (visibleData[i - 1]?.price ?? visibleData[i].price)) + 0.01)
    )

    const volumes = visibleData.map((d, i) => {
      const delta = i === 0 ? 0 : Math.abs(d.price - visibleData[i - 1].price)
      const h = (delta / volMax) * (volH - 6)
      const x = pts[i].x
      const barW = size.w < 480 ? 2 : 4
      return { x, h: Math.max(1.5, h), up: i === 0 ? true : d.price >= visibleData[i - 1].price, barW }
    })

    const yTicks = [yMin, yMin + yRange * 0.5, yMax].map((tick) => ({
      tick,
      y: pad.top + innerH - ((tick - yMin) / yRange) * innerH,
    }))

    const xLabelCount = size.w < 400 ? 4 : Math.min(6, visibleData.length)
    const xLabels = Array.from({ length: xLabelCount }, (_, j) => {
      const idx = Math.round((j / (xLabelCount - 1)) * (visibleData.length - 1))
      return { x: pts[idx].x, label: formatChartTime(visibleData[idx].time, range), idx }
    })

    const refY =
      referencePrice != null
        ? pad.top + innerH - ((referencePrice - yMin) / yRange) * innerH
        : null

    return { pts, line, area, yTicks, xLabels, volumes, innerH, innerW, pad, refY, yMin, yRange }
  }, [visibleData, size.w, chartH, range, pad, volH, referencePrice])

  // Drag Panning
  const handlePanStart = useCallback((clientX: number) => {
    if (!zoomRange) return
    setIsPanning(true)
    panStartX.current = clientX
    panStartRange.current = [...zoomRange]
  }, [zoomRange])

  const handlePanMove = useCallback((clientX: number) => {
    if (!isPanning || !panStartRange.current || !layout) return
    const dx = clientX - panStartX.current
    const [start, end] = panStartRange.current
    const count = end - start + 1
    const di = Math.round((dx / layout.innerW) * count)
    if (di === 0) return

    const len = data.length
    const shift = -di
    let newStart = start + shift
    let newEnd = end + shift

    if (newStart < 0) {
      newStart = 0
      newEnd = count - 1
    }
    if (newEnd >= len) {
      newEnd = len - 1
      newStart = len - count
    }
    setZoomRange([newStart, newEnd])
  }, [isPanning, layout, data.length])

  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
  }, [])

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
      style={{ cursor: zoomRange ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
      onMouseDown={(e) => {
        if (zoomRange) {
          handlePanStart(e.clientX)
        }
      }}
      onMouseMove={(e) => {
        if (isPanning) {
          handlePanMove(e.clientX)
        } else {
          onMove(e.clientX)
        }
      }}
      onMouseUp={() => {
        if (isPanning) {
          handlePanEnd()
        }
      }}
      onMouseLeave={() => {
        if (isPanning) {
          handlePanEnd()
        }
        setHover(null)
      }}
      onTouchStart={(e) => {
        if (e.touches.length === 2) {
          e.preventDefault()
          const dist = getTouchDistance(e.touches[0], e.touches[1])
          pinchStartDistance.current = dist
          pinchStartRange.current = zoomRange || [0, data.length - 1]
          setIsPanning(false)
        } else if (e.touches.length === 1) {
          if (zoomRange) {
            handlePanStart(e.touches[0].clientX)
          }
        }
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 2 && pinchStartDistance.current && pinchStartRange.current) {
          e.preventDefault()
          const dist = getTouchDistance(e.touches[0], e.touches[1])
          const factor = dist / pinchStartDistance.current
          if (Math.abs(factor - 1) > 0.05) {
            const len = data.length
            const [start, end] = pinchStartRange.current
            const count = end - start + 1
            let newCount = Math.round(count / factor)
            newCount = Math.max(5, Math.min(len, newCount))
            
            const center = Math.round((start + end) / 2)
            const newStart = Math.max(0, Math.min(len - newCount, center - Math.round(newCount / 2)))
            const newEnd = newStart + newCount - 1
            if (newStart === 0 && newEnd === len - 1) {
              setZoomRange(null)
            } else {
              setZoomRange([newStart, newEnd])
            }
          }
        } else if (e.touches.length === 1) {
          if (isPanning) {
            e.preventDefault()
            handlePanMove(e.touches[0].clientX)
          } else {
            onMove(e.touches[0].clientX)
          }
        }
      }}
      onTouchEnd={() => {
        pinchStartDistance.current = null
        pinchStartRange.current = null
        if (isPanning) {
          handlePanEnd()
        }
        setHover(null)
      }}
    >
      {/* Floating Zoom Panel */}
      {((size.w >= 640 && window.innerWidth >= 768) || zoomRange) && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-surface-950/80 border border-white/[0.08] p-1 rounded-lg backdrop-blur-sm shadow-lg">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleZoomIn()
          }}
          className="p-1.5 rounded hover:bg-surface-850 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleZoomOut()
          }}
          className="p-1.5 rounded hover:bg-surface-850 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        {zoomRange && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleZoomReset()
            }}
            className="p-1.5 rounded hover:bg-surface-850 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>
      )}

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
                <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
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
            {layout.refY != null && referencePrice != null && (
              <g>
                <line
                  x1={layout.pad.left}
                  y1={layout.refY}
                  x2={size.w - layout.pad.right}
                  y2={layout.refY}
                  stroke="rgba(251, 191, 36, 0.55)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
                <text
                  x={size.w - layout.pad.right}
                  y={layout.refY - 4}
                  textAnchor="end"
                  fill="#fbbf24"
                  fontSize={fontSize - 1}
                  fontFamily="JetBrains Mono, ui-monospace, monospace"
                >
                  Strike ${referencePrice.toFixed(2)}
                </text>
              </g>
            )}
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

          {!compact && showVolume !== false && volH > 0 && (
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
          )}

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
