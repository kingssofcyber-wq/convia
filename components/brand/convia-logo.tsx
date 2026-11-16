import * as React from "react";
import type { CSSProperties } from "react";

type ConviaLogoProps = {
  variant?: "default" | "inverse";
  tagline?: boolean;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
};

type ConviaMarkProps = {
  className?: string;
  size?: number;
};

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

/** Lightweight inline SVG mark. It does not depend on an external PNG path. */
export function ConviaMark({ className = "", size = 28 }: ConviaMarkProps) {
  const id = safeId(React.useId());
  const gradientId = `convia-mark-gradient-${id}`;
  const accentId = `convia-mark-accent-${id}`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 72 72"
      role="img"
      aria-label="Convia mark"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="8" y1="8" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#19C7E8" />
          <stop offset=".48" stopColor="#3479E7" />
          <stop offset="1" stopColor="#783DE0" />
        </linearGradient>
        <linearGradient id={accentId} x1="19" y1="52" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#20B9E8" />
          <stop offset="1" stopColor="#7A3EE6" />
        </linearGradient>
      </defs>
      <path
        d="M55.2 17.2A25 25 0 1 0 55 54.9"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path d="M28 18.5h17.2L55 28.3v28.2H28a5 5 0 0 1-5-5V23.5a5 5 0 0 1 5-5Z" fill="#fff" stroke="#D8E4FA" strokeWidth="1.8" />
      <path d="M45.2 18.5v10H55" fill="#E9F1FF" stroke="#D8E4FA" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M31.5 36.5h15.5M31.5 43.5h17M31.5 50.5h11" stroke={`url(#${accentId})`} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="58.8" cy="13.5" r="3.2" fill="#19C7E8" />
      <circle cx="62.8" cy="58.5" r="2.4" fill="#783DE0" />
    </svg>
  );
}

/** Shared logo for the site header, footer, and all PDF workspace headers. */
export function ConviaLogo({
  variant = "default",
  tagline = false,
  compact = false,
  className = "",
  style,
}: ConviaLogoProps) {
  const id = safeId(React.useId());
  const markGradient = `convia-word-mark-${id}`;
  const wordGradient = `convia-word-gradient-${id}`;
  const inverse = variant === "inverse";
  const height = compact ? 44 : tagline ? 66 : 50;
  const viewBox = tagline ? "0 0 370 94" : "0 0 320 76";

  return (
    <span
      className={`convia-logo convia-logo-${variant} ${compact ? "convia-logo-compact" : ""} ${tagline ? "convia-logo-with-tagline" : ""} ${className}`.trim()}
      style={{ height, ...style }}
    >
      <svg viewBox={viewBox} role="img" aria-label="Convia — Every need, one place" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={markGradient} x1="5" y1="5" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#19C7E8" />
            <stop offset=".5" stopColor="#3479E7" />
            <stop offset="1" stopColor="#783DE0" />
          </linearGradient>
          <linearGradient id={wordGradient} x1="88" y1="0" x2="305" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#168DE6" />
            <stop offset=".55" stopColor="#4D5BE0" />
            <stop offset="1" stopColor="#803DE2" />
          </linearGradient>
        </defs>
        <g transform="translate(2 3)">
          <path d="M55.2 17.2A25 25 0 1 0 55 54.9" fill="none" stroke={`url(#${markGradient})`} strokeWidth="10" strokeLinecap="round" />
          <path d="M28 18.5h17.2L55 28.3v28.2H28a5 5 0 0 1-5-5V23.5a5 5 0 0 1 5-5Z" fill="#fff" stroke="#D8E4FA" strokeWidth="1.8" />
          <path d="M45.2 18.5v10H55" fill="#E9F1FF" stroke="#D8E4FA" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M31.5 36.5h15.5M31.5 43.5h17M31.5 50.5h11" stroke={`url(#${wordGradient})`} strokeWidth="3.4" strokeLinecap="round" />
          <path d="M14 52.5c7.5 11.5 24 14.8 37.5 7.4" fill="none" stroke={`url(#${markGradient})`} strokeWidth="4" strokeLinecap="round" />
          <circle cx="58.8" cy="13.5" r="3.2" fill="#19C7E8" />
        </g>
        <text x="82" y="54" fill={inverse ? "#FFFFFF" : `url(#${wordGradient})`} fontFamily="Inter, Manrope, Arial, sans-serif" fontSize="43" fontWeight="850" letterSpacing="-2.5">convia<tspan fill={inverse ? "#8EDFFF" : "#783DE0"}>.</tspan></text>
        {tagline && (
          <text x="86" y="79" fill={inverse ? "#C5D0EA" : "#6E7892"} fontFamily="Inter, Arial, sans-serif" fontSize="7.8" fontWeight="800" letterSpacing=".55">
            PDF TOOLS  •  SMART SOLUTIONS  •  ENDLESS POSSIBILITIES
          </text>
        )}
      </svg>
    </span>
  );
}

export default ConviaLogo;
