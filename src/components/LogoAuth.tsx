interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

const sizes = { sm: 32, md: 36, lg: 48 }

export function LogoAuth({ size = 'md', showText = true }: LogoProps) {
  const px = sizes[size]
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={px}
        height={px}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0"
      >
        <defs>
          <linearGradient id="thriv-grad-auth" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#34d3b0" />
            <stop offset="100%" stopColor="#0d9478" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="url(#thriv-grad-auth)" />
        <path
          d="M10 34V14l6 8 6-6 6 8 6-12"
          stroke="#ecfdf8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="38" cy="12" r="4" fill="#ecfdf8" opacity="0.9" />
      </svg>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Thriv
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-thriv-400">
            Learn • Trade • Grow
          </span>
        </div>
      )}
    </div>
  )
}
