import { useState, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Logo } from './Logo'

interface WelcomeModalProps {
  open: boolean
  displayName: string
  onClose: () => void
}

export function WelcomeModal({ open, displayName, onClose }: WelcomeModalProps) {
  const [accepted, setAccepted] = useState(false)
  const [legalPage, setLegalPage] = useState<'terms' | 'privacy' | null>(null)

  // Disable background scrolling when the modal is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [open])

  if (!open) return null

  const steps = [
    { title: 'Home', desc: 'Track rank, daily objectives, and market pulse.' },
    { title: 'Market & Trade', desc: 'Paper trade 20 major stocks with live-style prices.' },
    { title: 'Missions & Activities', desc: 'Earn XP through quests, quizzes, and drills.' },
  ]

  return (
    <>
      {/* Background backdrop - non-dismissible by clicking outside */}
      <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm" aria-hidden />
      
      <div className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.08] bg-surface-900 shadow-2xl">
        <div className="p-6 sm:p-8">
          <Logo size="md" />
          <h2 className="mt-6 font-display text-xl font-semibold tracking-tight">
            Welcome{displayName ? `, ${displayName}` : ''}
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Your analyst account is ready. You start with $100,000 in simulated capital.
          </p>
          <ul className="mt-6 space-y-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-thriv-700/40 bg-thriv-950/50 font-mono text-[10px] text-thriv-400">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-200">{s.title}</p>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Premium Custom Terms and Privacy Checkbox */}
          <div className="mt-6 flex items-start gap-3">
            <button
              type="button"
              id="welcome-tos-checkbox"
              onClick={() => setAccepted(!accepted)}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-thriv-500/50 ${
                accepted
                  ? 'border-thriv-600 bg-thriv-600 text-white shadow-[0_0_8px_rgba(20,184,166,0.35)]'
                  : 'border-white/[0.12] bg-surface-800 text-transparent hover:border-white/20'
              }`}
              aria-checked={accepted}
              role="checkbox"
            >
              <Check className={`h-3 w-3 transition-transform duration-200 ${accepted ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
            </button>
            <label htmlFor="welcome-tos-checkbox" className="text-xs text-slate-400 leading-normal select-none">
              By entering, you agree to our{' '}
              <button
                type="button"
                onClick={() => setLegalPage('terms')}
                className="font-medium text-thriv-400 hover:text-thriv-300 hover:underline cursor-pointer transition-colors"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setLegalPage('privacy')}
                className="font-medium text-thriv-400 hover:text-thriv-300 hover:underline cursor-pointer transition-colors"
              >
                Privacy Policy
              </button>
              .
            </label>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={!accepted}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-thriv-700 py-3.5 text-sm font-semibold hover:bg-thriv-600 touch-manipulation min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white cursor-pointer"
          >
            Enter platform
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* ── TERMS OF SERVICE MODAL OVERLAY ─────────────────── */}
      {legalPage === 'terms' && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-[#06080c] animate-in slide-in-from-right duration-250">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-thriv-500/25 to-transparent shrink-0" />
          
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-4 shrink-0 bg-[#06080c]/80 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setLegalPage(null)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors touch-manipulation cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-2">
              <div>
                <h2 className="font-display font-medium tracking-tight text-sm sm:text-lg text-slate-100">Terms of Service</h2>
                <p className="text-[10px] text-slate-500 font-mono">Last updated: May 26, 2026</p>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 scrollbar-thin bg-[#06080c]">
            <div className="mx-auto w-full max-w-3xl space-y-6 py-8 md:py-12">
              {/* Preamble */}
              <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-3.5 md:p-6">
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400">
                  By accessing or using <span className="text-thriv-400 font-medium">Thriv</span>, you agree to these Terms of Service in full. If you do not agree, please discontinue use of the platform immediately.
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">01</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Educational Simulation Only</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv is a <span className="text-slate-300 font-medium">strictly educational, paper-trading simulation platform</span>. It is designed solely to help users learn about financial markets, investing concepts, and trading mechanics in a risk-free environment. Nothing on this platform constitutes a real brokerage account, financial advisory service, or investment product of any kind.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  All market activity, transaction execution, portfolio tracking, and performance reports within Thriv are entirely simulated. No real securities, currencies, or commodities are bought, sold, or held on behalf of any user. Users representation of simulated holdings does not correspond to actual ownership of real-world assets.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  <span className="text-slate-300 font-medium">Age Requirement:</span> You represent and warrant that you are at least 18 years of age (or the age of majority in your jurisdiction) or possess legal parental or guardian consent to access and use the platform.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">02</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">No Real-World Monetary Value</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Virtual cash balances, simulated portfolio values, experience points (XP), player levels, achievements, streaks, and any other in-platform rewards or metrics possess <span className="text-slate-300 font-medium">absolutely no real-world monetary value</span>. They are proprietary gamified elements of the simulation and:
                </p>
                <ul className="pl-5 sm:pl-8 space-y-2">
                  {[
                    'Cannot be redeemed, liquidated, or cashed out for real currency, assets, or property.',
                    'Cannot be transferred, assigned, or gifted to other users, accounts, or external parties.',
                    'Do not constitute any form of compensation, entitlement, or legal asset.',
                    'Are subject to modification, reset, or deletion at the platform\'s sole discretion.'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[11px] sm:text-sm md:text-base text-slate-400">
                      <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">03</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">No Financial Advice or Regulation</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  <span className="text-slate-300 font-medium">No content, data feed, simulation feature, quiz question, or notification on Thriv constitutes financial, investment, tax, or legal advice.</span> All information is provided for educational and analytical purposes only.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv does not provide regulated financial services of any kind and is not registered, licensed, or regulated under any financial regulatory authority or commission in any jurisdiction. Users should consult a licensed, independent financial advisor before making any real-world investing or trading decisions.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded bg-amber-500/[0.03]">04</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Limitation of Liability</h3>
                </div>
                <div className="pl-5 sm:pl-8">
                  <div className="border-l-2 border-amber-500/30 bg-amber-500/[0.02] p-4 md:p-6 rounded-r-lg">
                    <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-300">
                      <span className="text-amber-300 font-semibold">Strict Liability Disclaimer:</span> The platform, its operators, developers, and affiliates are not responsible for any real-world financial losses, opportunity costs, damages, or adverse legal outcomes that a user may incur if they attempt to replicate, adapt, or apply simulation strategies, data points, or platform features to live real-world financial accounts.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Simulated trading performance does not correlate to real trading. Real-world trading involves financial risks, slippage, liquidity constraints, transaction fees, and emotional factors not present in this simulation.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  To the maximum extent permitted by applicable law, in no event shall the total liability of Thriv, its operators, or affiliates exceed USD $0.00.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">05</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Intellectual Property & Data Ownership</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  All real-world company names, brand logos, stock ticker symbols, indices, and financial market tickers referenced on the platform are utilized <span className="text-slate-300 font-medium">solely for educational simulation purposes</span>. All rights, title, and ownership of these marks remain the exclusive intellectual property of their respective owners.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv does not claim any affiliation with, sponsorship by, or ownership of any third-party corporate entities.
                </p>
              </div>

              {/* Section 6 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">06</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">User Conduct</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Users agree to access Thriv in good faith for personal learning. Any attempts to manipulate data feeds, reverse-engineer platform logic, launch automated scrapers, exploit bugs for virtual XP gains, or misrepresent simulated trading results as live trading results are strictly prohibited and may lead to account termination.
                </p>
              </div>

              {/* Section 7 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">07</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Changes to Terms</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv reserves the right to modify these Terms of Service at any time. Continued use of the platform following the publication of any updates constitutes complete acceptance of the revised Terms.
                </p>
              </div>

              {/* Section 8 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">08</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Disclaimer of Warranties</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8 uppercase font-mono tracking-wider text-[10px] sm:text-xs text-slate-300">
                  THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv disclaims all warranties to the fullest extent permitted by law, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, non-infringement, or accuracy of data feeds. We do not warrant that the simulation will be uninterrupted, error-free, or free of security vulnerabilities. Simulated pricing data may suffer from latencies or inaccuracies.
                </p>
              </div>

              {/* Section 9 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">09</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Indemnification</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  You agree to defend, indemnify, and hold harmless Thriv, its developers, operators, and affiliates from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable legal fees) arising out of or relating to your violation of these Terms of Service or your use of the platform.
                </p>
              </div>

              {/* Footer note */}
              <div className="pt-4 pb-2">
                <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed text-center font-mono">
                  These terms are governed by applicable law. If any provision is deemed unenforceable, the remaining terms shall survive in full force and effect.
                </p>
              </div>
            </div>
          </div>

          {/* Sticky close button */}
          <div className="border-t border-white/[0.04] p-4 shrink-0 bg-[#06080c]">
            <div className="mx-auto w-full max-w-3xl">
              <button
                type="button"
                onClick={() => setLegalPage(null)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white py-3 text-xs sm:text-sm font-semibold text-slate-300 transition-colors touch-manipulation min-h-[48px] cursor-pointer"
              >
                Acknowledge and Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRIVACY POLICY MODAL OVERLAY ───────────────────── */}
      {legalPage === 'privacy' && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-[#06080c] animate-in slide-in-from-right duration-250">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-thriv-500/25 to-transparent shrink-0" />
          
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-4 shrink-0 bg-[#06080c]/80 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setLegalPage(null)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors touch-manipulation cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-2">
              <div>
                <h2 className="font-display font-medium tracking-tight text-sm sm:text-lg text-slate-100">Privacy Policy</h2>
                <p className="text-[10px] text-slate-500 font-mono">Last updated: May 26, 2026</p>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 scrollbar-thin bg-[#06080c]">
            <div className="mx-auto w-full max-w-3xl space-y-6 py-8 md:py-12">
              {/* Preamble */}
              <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-3.5 md:p-6">
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400">
                  Your privacy is paramount. This policy clarifies what data <span className="text-thriv-400 font-medium">Thriv</span> processes, how it is secured, and the absolute control you retain.
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">01</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Information We Process</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8 mb-2">
                  We operate on a data-minimization framework, gathering only what is required to execute the simulation:
                </p>
                <ul className="pl-5 sm:pl-8 space-y-3.5">
                  {[
                    { label: 'Account Data', desc: 'Secure email addresses and customizable display names supplied during account registration.' },
                    { label: 'Simulation Progress', desc: 'Simulated cash balances, transaction logs, XP points, achievements, and custom preferences stored to keep your data synced across devices.' },
                    { label: 'System Telemetry', desc: 'Anonymized click events or tab selections used strictly to troubleshoot issues and optimize performance.' },
                    { label: 'Technical Details', desc: 'Browser footprints, device screen categories, and high-level region metrics gathered for firewalls.' }
                  ].map(({ label, desc }) => (
                    <li key={label} className="pl-0 text-[11px] sm:text-sm md:text-base">
                      <span className="font-semibold text-slate-300">{label} — </span>
                      <span className="text-slate-400">{desc}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8 mt-3">
                  <span className="text-slate-300 font-medium">Guest Mode isolation:</span> For users running as guest, all portfolio data, transactions, and settings remain isolated entirely inside your local browser storage and are never uploaded to our servers.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">02</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">How We Use Information</h3>
                </div>
                <ul className="pl-5 sm:pl-8 space-y-2">
                  {[
                    'To render and preserve your virtual portfolio and cash balance state.',
                    'To synchronize data securely across your authorized client terminals.',
                    'To distribute system critical notices (e.g., password recovery requests).',
                    'To isolate and repair bugs or refine the user interface layout.'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[11px] sm:text-sm md:text-base text-slate-400">
                      <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  We do <span className="text-slate-300 font-medium">not</span> sell, trade, or distribute your email addresses or telemetry logs to third-party ad exchanges or brokers.
                </p>
              </div>

              {/* Section 3 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">03</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Data Security & Encryption</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  We employ standard security protocols to safeguard your account. Access to account records is strictly controlled, and we use encryption methods to protect data in transit and at rest.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Please maintain a secure, unique password. You are responsible for ensuring the confidentiality of your account credentials.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">04</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Local Persistent Storage</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  The platform utilizes your browser's <span className="text-slate-300 font-medium">Local Storage</span> to maintain your profile selection and locally active widgets. Authenticated sessions rely on secure, encrypted tokens managed strictly by our authentication system. We do not place targeting or tracking pixels in your client.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">05</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Data Control & Portability</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  You retain complete sovereignty over your virtual profile details. You can:
                </p>
                <ul className="pl-5 sm:pl-8 space-y-2">
                  {[
                    'Export your entire database history at any time using the "Export Data" button in Settings.',
                    'Clear all local data records using the "Reset simulation data" function in Settings.',
                    'Request registered account deletion at any time by contacting us directly.'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[11px] sm:text-sm md:text-base text-slate-400">
                      <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 6 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">06</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Children's Privacy Protection</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv does not intentionally target, collect, or retain records on individuals under the age of 13. If it is discovered that a minor's information has been recorded, we will perform a total deletion from our active systems immediately.
                </p>
              </div>

              {/* Section 7 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">07</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Revisions</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  This Privacy Policy may be updated to match platform extensions. Updated terms are indicated by the timestamp on this page. Continuing to use Thriv implies consent to the revised telemetry rules.
                </p>
              </div>

              {/* Footer */}
              <div className="pt-4 pb-2">
                <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed text-center font-mono">
                  For questions concerning data usage or security policies, please contact us directly.
                </p>
              </div>
            </div>
          </div>

          {/* Sticky close button */}
          <div className="border-t border-white/[0.04] p-4 shrink-0 bg-[#06080c]">
            <div className="mx-auto w-full max-w-3xl">
              <button
                type="button"
                onClick={() => setLegalPage(null)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white py-3 text-xs sm:text-sm font-semibold text-slate-300 transition-colors touch-manipulation min-h-[48px] cursor-pointer"
              >
                Acknowledge and Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
