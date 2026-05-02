interface Props {
  size?: number;
  className?: string;
  /** Override the accent color of the progress ring (defaults to terracotta). */
  accent?: string;
}

/**
 * App brand mark — a "D" inside a 75%-filled progress ring on a squircle.
 *
 * Color strategy: fixed dark-on-light palette so the icon looks identical in
 * both light and dark app themes — just like a real app icon would. The rect
 * is always near-black (#14120f), the D is always cream (#f5f1e8). Only the
 * accent arc picks up the user's chosen highlight color.
 */
export function BrandMark({ size = 22, className = '', accent = '#d97757' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      {/* Squircle — always dark so the logo looks the same in light and dark mode. */}
      <rect width="64" height="64" rx="14" fill="#14120f" />

      {/* Track ring (faint cream). */}
      <circle
        cx="32" cy="32" r="22"
        fill="none"
        stroke="#f5f1e8"
        strokeOpacity="0.18"
        strokeWidth="4"
      />

      {/* Progress arc — accent. */}
      <circle
        cx="32" cy="32" r="22"
        fill="none"
        stroke={accent}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="138.23"
        strokeDashoffset="34.5"
        transform="rotate(-90 32 32)"
      />

      {/* The "D" — always cream so it reads on the dark squircle. */}
      <text
        x="32" y="42"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, Inter, sans-serif"
        fontWeight="700"
        fontSize="22"
        letterSpacing="-1"
        fill="#f5f1e8"
      >
        D
      </text>
    </svg>
  );
}
