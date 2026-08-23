/* Shared inline SVG icon set — stroke style, inherits currentColor. */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ size = 18, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...base}
      {...rest}
    >
      {children}
    </svg>
  )
}

export function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="sp-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#12604a" />
          <stop offset="1" stopColor="#052b20" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#sp-logo-g)" />
      <g transform="rotate(-38 23 27)">
        <rect x="14.5" y="13" width="17" height="21" rx="8.5" fill="#f2fbe9" />
        <rect x="21" y="32.5" width="4" height="9" rx="2" fill="#f2fbe9" />
        <circle cx="19.5" cy="20" r="1.3" fill="#0b4534" opacity="0.35" />
        <circle cx="26.5" cy="20" r="1.3" fill="#0b4534" opacity="0.35" />
        <circle cx="23" cy="25.5" r="1.3" fill="#0b4534" opacity="0.35" />
      </g>
      <circle cx="35.5" cy="12.5" r="4.2" fill="#c9ec4d" />
    </svg>
  )
}

export const IconBall = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <circle cx="10" cy="10" r="0.7" fill="currentColor" stroke="none" />
    <circle cx="14" cy="10" r="0.7" fill="currentColor" stroke="none" />
    <circle cx="12" cy="14.2" r="0.7" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconGrid = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="7" height="7" rx="2" />
    <rect x="13" y="4" width="7" height="7" rx="2" />
    <rect x="4" y="13" width="7" height="7" rx="2" />
    <rect x="13" y="13" width="7" height="7" rx="2" />
  </Svg>
)

export const IconCalendar = (p) => (
  <Svg {...p}>
    <rect x="4" y="5.5" width="16" height="15" rx="3" />
    <path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4" />
  </Svg>
)

export const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.8V12l3 2" />
  </Svg>
)

export const IconWallet = (p) => (
  <Svg {...p}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" />
    <path d="M14.5 12H20M4 9.5h16" />
  </Svg>
)

export const IconUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20c.8-3.4 3.6-5.2 7-5.2s6.2 1.8 7 5.2" />
  </Svg>
)

export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M14 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
    <path d="M17 8.5 20.5 12 17 15.5M20 12h-9" />
  </Svg>
)

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="m5.5 12.8 4 4L18.5 7.6" />
  </Svg>
)

export const IconX = (p) => (
  <Svg {...p}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Svg>
)

export const IconArrowRight = (p) => (
  <Svg {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Svg>
)

export const IconTrendingUp = (p) => (
  <Svg {...p}>
    <path d="m4 16.5 5-5 3.5 3.5L19 8.5" />
    <path d="M14.5 8.5H19V13" />
  </Svg>
)

export const IconActivity = (p) => (
  <Svg {...p}>
    <path d="M3.5 12h4l2.5-6 4 12 2.5-6h4" />
  </Svg>
)

export const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5c.7-3 3-4.6 5.5-4.6s4.8 1.6 5.5 4.6" />
    <path d="M15.5 5.7a3.2 3.2 0 0 1 0 5.6M17.6 15.3c1.6.7 2.6 2.1 3 4.2" />
  </Svg>
)

export const IconSun = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </Svg>
)

export const IconHome = (p) => (
  <Svg {...p}>
    <path d="m4 11 8-6.5L20 11v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
    <path d="M10 20.5v-6h4v6" />
  </Svg>
)

export const IconInfo = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 11v5" />
    <circle cx="12" cy="7.8" r="0.7" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconAlert = (p) => (
  <Svg {...p}>
    <path d="M12 4 2.8 20h18.4z" />
    <path d="M12 10v4.5" />
    <circle cx="12" cy="17.3" r="0.7" fill="currentColor" stroke="none" />
  </Svg>
)
