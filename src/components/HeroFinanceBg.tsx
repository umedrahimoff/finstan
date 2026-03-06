export function HeroFinanceBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.12]">
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          animation: "hero-grid-pulse 8s ease-in-out infinite",
        }}
      />
      {/* Animated chart lines */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,60 Q10%,50 20%,55 T40%,45 T60%,60 T80%,40 T100%,50"
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth="1"
          className="hero-line"
        />
        <path
          d="M0,70 Q15%,65 30%,75 T50%,55 T70%,70 T90%,60 T100%,65"
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth="1"
          className="hero-line hero-line-delay-1"
        />
        <path
          d="M0,80 Q20%,75 40%,85 T60%,70 T80%,80 T100%,75"
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth="1"
          className="hero-line hero-line-delay-2"
        />
        <path
          d="M0,40 Q25%,35 50%,45 T75%,30 T100%,40"
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth="1"
          className="hero-line hero-line-delay-3"
        />
      </svg>
      {/* Floating data points */}
      <div className="absolute inset-0">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <span
            key={i}
            className="hero-float absolute font-mono text-[10px] tabular-nums"
            style={{
              left: `${10 + i * 9}%`,
              top: `${15 + (i % 4) * 20}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {["1.2", "0.8", "2.4", "1.5", "0.9", "3.1", "1.7", "2.0", "0.5", "1.9"][i]}
          </span>
        ))}
      </div>
    </div>
  )
}
