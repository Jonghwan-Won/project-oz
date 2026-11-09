export function MagicEffect() {
  return (
    <svg
      className="magicEffect"
      viewBox="0 0 180 180"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="var(--secondary)" strokeWidth="1" opacity=".65">
        <ellipse
          cx="90"
          cy="90"
          rx="71"
          ry="57"
          transform="rotate(-35 90 90)"
        />
        <ellipse cx="90" cy="90" rx="71" ry="57" transform="rotate(40 90 90)" />
      </g>
      <g stroke="var(--accent)" strokeWidth="4" transform="rotate(-12 90 90)">
        <path d="M90 52v76M52 90h76M63 63l54 54M63 117l54-54" />
      </g>
    </svg>
  );
}
