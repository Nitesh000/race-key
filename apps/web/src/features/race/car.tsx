export function Car({ you }: { you?: boolean }) {
  const body = you ? "var(--accent)" : "var(--racer-tint)";
  return (
    <svg viewBox="0 0 48 24" className="racer-art h-full w-auto" aria-hidden>
      <g className="racer-body">
        <path
          d="M4 17 L6 11 Q7 9 10 9 L17 9 L22 4 Q23 3 25 3 L34 3 Q36 3 37 5 L40 10 L43 11 Q45 12 45 14 L45 17 Z"
          fill={body}
          stroke="var(--racer-outline)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M23 9 L26 5 L33 5 L35 9 Z" fill="var(--surface)" opacity="0.85" />
      </g>
      <g className="racer-wheels" fill="var(--racer-outline)">
        <circle cx="13" cy="18" r="4" />
        <circle cx="36" cy="18" r="4" />
      </g>
    </svg>
  );
}
