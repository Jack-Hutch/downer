interface Props {
  size?: number;
  className?: string;
  /** Override the accent color of the progress ring (defaults to terracotta). */
  accent?: string;
}

export function BrandMark({ size = 22, className = '', accent = '#d97757' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="rgb(var(--fg))" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="rgb(var(--bg) / 0.18)" strokeWidth="4" />
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="none"
        stroke={accent}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="138.23"
        strokeDashoffset="34.5"
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, Inter, sans-serif"
        fontWeight="700"
        fontSize="22"
        letterSpacing="-1"
        fill="rgb(var(--bg))"
      >
        D
      </text>
    </svg>
  );
}
