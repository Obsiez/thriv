import { useState, useRef, useEffect } from 'react'
import { X, Copy, Download, Check, Award, ShieldCheck, Flame } from 'lucide-react'
import { getLevelInfo } from '../lib/progression'
import { formatCurrency } from '../lib/marketEngine'
import { useAuth } from '../contexts/AuthContext'
import type { PlayerProgress } from '../types'

interface ShareStatsModalProps {
  isOpen: boolean
  onClose: () => void
  progress: PlayerProgress
  totalValue: number
}

const TIER_COLOR_MAP = {
  associate: { text: '#94a3b8', glow: 'rgba(148, 163, 184, 0.08)', accent: '#64748b' },
  analyst: { text: '#34d3b0', glow: 'rgba(20, 184, 150, 0.08)', accent: '#14b896' },
  strategist: { text: '#a78bfa', glow: 'rgba(139, 92, 246, 0.08)', accent: '#8b5cf6' },
  principal: { text: '#fbbf24', glow: 'rgba(245, 158, 11, 0.08)', accent: '#f59e0b' },
}

export function ShareStatsModal({ isOpen, onClose, progress, totalValue }: ShareStatsModalProps) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const displayName = user?.displayName || 'Trader'
  const motto = progress.profile?.motto || 'Discipline over noise'
  
  const levelInfo = getLevelInfo(progress.level)
  const tierConfig = TIER_COLOR_MAP[levelInfo.tier] || TIER_COLOR_MAP.analyst
  const formattedNetWorth = formatCurrency(totalValue)

  // Share text template
  const shareText = `Check out my Thriv simulated trading stats!
Level ${progress.level} - ${levelInfo.title} [${levelInfo.rankCode}]
Current Streak: ${progress.streak} days
Net Worth: ${formattedNetWorth}
Completed Trades: ${progress.stats.totalTrades}
Join the academy and simulate markets at thriv.app!`

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleDownloadCard = () => {
    setDownloading(true)
    setTimeout(() => {
      try {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set dimensions (2x scale for high PPI rendering)
        canvas.width = 1200
        canvas.height = 760
        ctx.scale(2, 2)

        const w = 600
        const h = 380

        // 1. Sleek Gradient Background (matching Thriv Dark theme)
        const bgGrad = ctx.createLinearGradient(0, 0, w, h)
        bgGrad.addColorStop(0, '#0a0f14') // surface-900
        bgGrad.addColorStop(1, '#111921') // surface-800
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, w, h)

        // 2. High-Tech Glow based on Level Tier
        const glowGrad = ctx.createRadialGradient(w - 100, 100, 10, w - 100, 100, 250)
        glowGrad.addColorStop(0, tierConfig.glow)
        glowGrad.addColorStop(1, 'rgba(10, 15, 20, 0)')
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(w - 100, 100, 250, 0, Math.PI * 2)
        ctx.fill()

        // 3. Card Double Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
        ctx.lineWidth = 1.5
        ctx.strokeRect(10, 10, w - 20, h - 20)
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
        ctx.lineWidth = 1
        ctx.strokeRect(15, 15, w - 30, h - 30)

        // 4. Header Branding
        ctx.fillStyle = '#14b896' // Thriv green logo
        ctx.font = 'bold 22px Outfit, -apple-system, sans-serif'
        ctx.fillText('THRIV', 40, 55)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.font = '700 8px "DM Sans", -apple-system, sans-serif'
        ctx.fillText('SIMULATOR CREDENTIAL', 120, 52)

        // 5. User Details
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 24px Outfit, -apple-system, sans-serif'
        ctx.fillText(displayName, 40, 115)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.font = 'italic 12px "DM Sans", -apple-system, sans-serif'
        ctx.fillText(`"${motto}"`, 40, 137)

        // 6. Level Badge pill (width shortened to 255 for grid alignment)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
        ctx.fillRect(40, 160, 255, 30)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
        ctx.lineWidth = 1
        ctx.strokeRect(40, 160, 255, 30)

        // Colored status bar left edge
        ctx.fillStyle = tierConfig.accent
        ctx.fillRect(40, 160, 4, 30)

        ctx.fillStyle = tierConfig.text
        ctx.font = 'bold 11px "JetBrains Mono", monospace'
        ctx.fillText(`LVL ${progress.level} · ${levelInfo.title.toUpperCase()} [${levelInfo.rankCode}]`, 56, 179)

        // 7. Stats Grid (2x2)
        const drawGridItem = (x: number, y: number, label: string, value: string, isStreak?: boolean) => {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
          ctx.fillRect(x, y, 255, 60)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, 255, 60)

          // Label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
          ctx.font = '700 8.5px "DM Sans", -apple-system, sans-serif'
          ctx.fillText(label.toUpperCase(), x + 15, y + 22)

          if (isStreak) {
            // Draw Lucide Flame SVG path
            ctx.save()
            ctx.translate(x + 15, y + 28) // position of the icon
            ctx.scale(16 / 24, 16 / 24)   // scale 24x24 path to 16x16
            ctx.strokeStyle = '#f59e0b'   // amber-500
            ctx.lineWidth = 2
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            const flamePath = new Path2D("M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z")
            ctx.stroke(flamePath)
            ctx.restore()

            // Value text offset (aligned after 16px wide icon)
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 15px "JetBrains Mono", monospace'
            ctx.fillText(value, x + 36, y + 43)
          } else {
            // Value
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 15px "JetBrains Mono", monospace'
            ctx.fillText(value, x + 15, y + 43)
          }
        }

        drawGridItem(40, 208, 'Simulated Net Worth', formattedNetWorth)
        drawGridItem(305, 208, 'Trading Streak', `${progress.streak} Days`, true)
        drawGridItem(40, 280, 'Completed Trades', `${progress.stats.totalTrades} Executions`)
        drawGridItem(305, 280, 'Level Progress', `${progress.xp.toLocaleString()} XP`)

        // 8. Footer CTA
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.font = '400 9px "DM Sans", -apple-system, sans-serif'
        ctx.fillText('Simulate trading. Learn strategies. Build wealth at thriv.app', 40, 350)

        // 9. Download anchor trigger
        const dataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `${displayName.replace(/\s+/g, '_')}_thriv_card.png`
        link.href = dataUrl
        link.click()
      } catch (err) {
        console.error('Error drawing canvas: ', err)
      } finally {
        setDownloading(false)
      }
    }, 100)
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-surface-900 border border-white/[0.08] rounded-2xl shadow-2xl p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-lg text-white">Share Trading Stats</h3>
            <p className="text-xs text-slate-400">Show off your simulated milestones and trading streak</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Card Preview */}
        <div className="relative aspect-[1.58/1] w-full rounded-xl border border-white/[0.08] bg-gradient-to-br from-surface-900 to-surface-800 p-5 shadow-inner overflow-hidden select-none mb-6">
          {/* Accent glow in corner */}
          <div 
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: tierConfig.accent }}
          />

          {/* Card Content */}
          <div className="flex flex-col h-full justify-between relative z-10">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-extrabold text-xs text-thriv-400 tracking-wider">THRIV</span>
                  <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Simulator</span>
                </div>
                <div className="flex items-center gap-1 text-[8px] font-mono text-slate-400 uppercase">
                  <ShieldCheck className="h-3 w-3 text-thriv-400" />
                  <span>Practitioner</span>
                </div>
              </div>

              <div className="mt-3.5">
                <h4 className="font-display font-bold text-base text-white truncate">{displayName}</h4>
                <p className="text-[9px] text-slate-450 italic truncate">"{motto}"</p>
                <div 
                  className="inline-flex items-center gap-1 mt-2.5 px-2 py-0.5 rounded border text-[9px] font-semibold font-display"
                  style={{ 
                    borderColor: `${tierConfig.accent}30`, 
                    backgroundColor: `${tierConfig.accent}12`,
                    color: tierConfig.text 
                  }}
                >
                  <Award className="h-2.5 w-2.5" />
                  <span>Lvl {progress.level} · {levelInfo.title} [{levelInfo.rankCode}]</span>
                </div>
              </div>
            </div>

            {/* Micro Grid Stats */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 font-mono text-[9px]">
              <div>
                <span className="text-slate-500 text-[8px] uppercase block">Net Worth</span>
                <span className="text-white font-bold">{formattedNetWorth}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[8px] uppercase block">Streak</span>
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Flame className="h-3 w-3 text-amber-500 shrink-0" />
                  <span>{progress.streak} Days</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-semibold text-xs transition-all cursor-pointer animate-in"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Copied text!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-400" />
                <span>Copy Text Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadCard}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-thriv-600 hover:bg-thriv-500 disabled:bg-thriv-800 text-white font-semibold text-xs transition-all shadow-md shadow-thriv-600/15 cursor-pointer animate-in"
          >
            <Download className="h-4 w-4" />
            <span>{downloading ? 'Generating...' : 'Download PNG'}</span>
          </button>
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
