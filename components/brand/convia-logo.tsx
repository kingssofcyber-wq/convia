import type { CSSProperties } from "react";

type ConviaLogoProps = {
  variant?: "default" | "inverse";
  tagline?: boolean;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function ConviaLogo({
  variant = "default",
  tagline = false,
  compact = false,
  className = "",
  style,
}: ConviaLogoProps) {
  const wordColor = variant === "inverse" ? "#ffffff" : "#172447";
  const taglineColor = variant === "inverse" ? "#cbd5f4" : "#64708a";
  const height = compact ? 42 : tagline ? 68 : 48;
  return (
    <span className={`convia-logo convia-logo-${variant} ${className}`} style={{ height, ...style }}>
      <svg viewBox={tagline ? "0 0 520 108" : "0 0 520 74"} role="img" aria-label="Convia — PDF Tools, Smart Solutions, Endless Possibilities">
        <defs>
          <linearGradient id="conviaMark" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#18c7eb"/><stop offset=".52" stopColor="#2767e8"/><stop offset="1" stopColor="#7b3fe4"/></linearGradient>
          <linearGradient id="conviaWord" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#137edb"/><stop offset=".54" stopColor="#4d56d9"/><stop offset="1" stopColor="#803be2"/></linearGradient>
          <linearGradient id="conviaOrbit" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#ffc02a"/><stop offset="1" stopColor="#ff7429"/></linearGradient>
        </defs>
        <g transform="translate(5 4)">
          <path d="M50 10a28 28 0 1 0 0 52" fill="none" stroke="url(#conviaMark)" strokeWidth="13" strokeLinecap="round"/>
          <path d="M43 23h18l10 10v25H43z" fill="#fff" stroke="#cddcff" strokeWidth="1.8"/>
          <path d="M61 23v10h10" fill="#dceaff"/>
          <path d="M48 43c4-11 8 11 12 0 4-11 8 11 12 0" fill="none" stroke="#e3383a" strokeWidth="2.8" strokeLinecap="round"/>
          <ellipse cx="47" cy="48" rx="47" ry="14" transform="rotate(-18 47 48)" fill="none" stroke="url(#conviaOrbit)" strokeWidth="5.2"/>
        </g>
        <text x="105" y={tagline ? "55" : "54"} fill="url(#conviaWord)" fontSize={compact ? "48" : "52"} fontWeight="800" letterSpacing="-2.6" fontFamily="Inter,Arial,sans-serif">convia</text>
        {tagline && <text x="109" y="84" fill={taglineColor} fontSize="12.5" fontWeight="700" letterSpacing="1.05" fontFamily="Inter,Arial,sans-serif">PDF TOOLS  •  SMART SOLUTIONS  •  ENDLESS POSSIBILITIES</text>}
      </svg>
    </span>
  );
}
