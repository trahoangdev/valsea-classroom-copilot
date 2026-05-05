import * as React from "react"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="64" height="64" rx="18" fill="url(#logo-bg)" />
      <path
        d="M47 18.5C43.2 14.5 37.9 12 32 12C20.4 12 11 21.4 11 33C11 44.6 20.4 54 32 54C38.1 54 43.6 51.4 47.4 47.2"
        stroke="url(#logo-ring)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M21 34V30" stroke="#EAFDFF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M27 39V25" stroke="#EAFDFF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M33 43V21" stroke="#EAFDFF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M39 38V26" stroke="#EAFDFF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M45 34V30" stroke="#EAFDFF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M49.2 11.2L51.1 16.2L56.1 18.1L51.1 20L49.2 25L47.3 20L42.3 18.1L47.3 16.2L49.2 11.2Z" fill="#FFE66D" />
      <path d="M16.5 13.5L17.7 16.6L20.8 17.8L17.7 19L16.5 22.1L15.3 19L12.2 17.8L15.3 16.6L16.5 13.5Z" fill="#7CFFCB" fillOpacity="0.95" />
      <defs>
        <linearGradient id="logo-bg" x1="7" y1="5" x2="58" y2="61" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06233F" />
          <stop offset="0.52" stopColor="#0B5667" />
          <stop offset="1" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="logo-ring" x1="12" y1="13" x2="51" y2="51" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7CFFCB" />
          <stop offset="0.45" stopColor="#2DE2E6" />
          <stop offset="1" stopColor="#5B8CFF" />
        </linearGradient>
      </defs>
    </svg>
  )
}
