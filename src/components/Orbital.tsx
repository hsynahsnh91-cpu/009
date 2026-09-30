export function Orbital() {
  return (
    <div className="orbital" aria-hidden="true">
      <svg viewBox="0 0 250 250">
        <defs>
          <radialGradient id="orb">
            <stop stopColor="#b6a4d9" stopOpacity=".16" />
            <stop offset="1" stopColor="#b6a4d9" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="125" cy="125" r="110" fill="url(#orb)" />
        <g fill="none" stroke="#8a789d" strokeWidth=".7">
          <ellipse
            cx="125"
            cy="125"
            rx="105"
            ry="39"
            transform="rotate(-32 125 125)"
          />
          <ellipse
            cx="125"
            cy="125"
            rx="105"
            ry="39"
            transform="rotate(32 125 125)"
          />
          <ellipse
            cx="125"
            cy="125"
            rx="105"
            ry="39"
            transform="rotate(90 125 125)"
          />
          <circle
            cx="125"
            cy="125"
            r="73"
            strokeDasharray="2 6"
            strokeOpacity=".3"
          />
        </g>
        <g fill="#d2b9f5">
          <circle cx="125" cy="125" r="8" />
          <circle cx="125" cy="21" r="3" />
          <circle cx="41" cy="177" r="3" />
          <circle cx="210" cy="176" r="3" />
        </g>
        <path d="M125 109v32m-16-16h32" stroke="#e1caff" strokeWidth="1" />
      </svg>
      <span className="orbit-label">EVERYTHING IS CONNECTED</span>
    </div>
  );
}
