interface Props {
  size?: number;
  className?: string;
  /** Override the accent color of the progress ring (defaults to terracotta). */
  accent?: string;
}

/**
 * App brand mark — a "D" inside a 75%-filled progress ring on a squircle.
 *
 * Color strategy: every theme-dependent color uses CSS variables defined on
 * `:root` and `.dark` (`--fg`, `--bg`). We deliberately split the `rgb(...)`
 * fill/stroke from the alpha into a separate `*-opacity` SVG attribute,
 * because the modern `rgb(R G B / A)` slash-alpha CSS syntax doesn't parse
 * reliably as an SVG paint server in all WebKit/Electron versions. Using
 * `stroke="rgb(var(--bg))"` + `stroke-opacity="0.18"` is the safe combo.
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
      {/* Squircle — uses --fg so it inverts cleanly in dark mode. */}
      <rect width="64" height="64" rx="14" fill="rgb(var(--fg))" />

      {/* Track ring (faint). Color = bg, alpha via attribute, not slash syntax. */}
      <circle
        cx="32" cy="32" r="22"
        fill="none"
        stroke="rgb(var(--bg))"
        strokeOpacity="0.18"
        strokeWidth="4"
      />

      {/* Progress arc — accent. Constant across themes. */}
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

      {/* The "D" — uses --bg so it always contrasts with the squircle. */}
      <text
        x="32" y="42"
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
