// Hand-drawn style botanical line art used as quiet decoration across the site.
// All purely decorative: hidden from screen readers.

type Props = { className?: string; color?: string };

export function LeafSprig({ className = "", color = "#5e7a4c" }: Props) {
  return (
    <svg
      viewBox="0 0 120 160"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M60 158C60 120 58 80 62 6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      {[
        [60, 128, -1],
        [60, 104, 1],
        [61, 80, -1],
        [61, 58, 1],
        [62, 36, -1],
      ].map(([x, y, dir], i) => (
        <g key={i}>
          <path
            d={`M${x} ${y}C${x + dir * 14} ${y - 6} ${x + dir * 34} ${y - 4} ${x + dir * 44} ${y - 20}C${x + dir * 30} ${y - 26} ${x + dir * 12} ${y - 18} ${x} ${y}Z`}
            fill={color}
            fillOpacity="0.14"
            stroke={color}
            strokeWidth="1.1"
          />
          <path
            d={`M${x} ${y}C${x + dir * 14} ${y - 8} ${x + dir * 28} ${y - 12} ${x + dir * 40} ${y - 19}`}
            stroke={color}
            strokeWidth="0.7"
            strokeOpacity="0.6"
          />
        </g>
      ))}
      <path d="M62 6C55 10 54 18 62 22C70 18 69 10 62 6Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1" />
    </svg>
  );
}

const PETALS = [0, 72, 144, 216, 288];

function Bloom({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  return (
    <g>
      {PETALS.map((a) => (
        <ellipse
          key={a}
          cx={cx}
          cy={cy - r}
          rx={r * 0.55}
          ry={r}
          transform={`rotate(${a} ${cx} ${cy})`}
          fill={color}
          fillOpacity="0.18"
          stroke={color}
          strokeWidth="1"
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.35} fill="#7a5a3c" fillOpacity="0.55" />
    </g>
  );
}

export function FlowerSprig({ className = "", color = "#b07a6e", stem = "#5e7a4c" }: Props & { stem?: string }) {
  return (
    <svg viewBox="0 0 140 160" fill="none" aria-hidden="true" className={className}>
      <path d="M70 158C66 120 50 90 36 52" stroke={stem} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M70 158C74 118 92 88 106 64" stroke={stem} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M68 130C56 126 46 128 40 136C50 142 60 140 68 130Z" fill={stem} fillOpacity="0.16" stroke={stem} strokeWidth="1" />
      <path d="M78 112C90 106 100 108 106 116C96 122 86 120 78 112Z" fill={stem} fillOpacity="0.16" stroke={stem} strokeWidth="1" />
      <Bloom cx={36} cy={44} r={12} color={color} />
      <Bloom cx={106} cy={56} r={10} color={color} />
      <circle cx="62" cy="70" r="3" fill={color} fillOpacity="0.35" />
      <circle cx="88" cy="40" r="2.5" fill={color} fillOpacity="0.35" />
    </svg>
  );
}

export function VineDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden="true">
      <div className="vine-rule flex-1" />
      <svg viewBox="0 0 64 20" width="64" height="20" fill="none">
        <path d="M2 10H62" stroke="#b3c3a2" strokeWidth="1" />
        <path d="M32 10C26 4 18 3 12 6C18 12 26 13 32 10Z" fill="#5e7a4c" fillOpacity="0.2" stroke="#5e7a4c" strokeWidth="0.9" />
        <path d="M32 10C38 16 46 17 52 14C46 8 38 7 32 10Z" fill="#5e7a4c" fillOpacity="0.2" stroke="#5e7a4c" strokeWidth="0.9" />
        <circle cx="32" cy="10" r="2.4" fill="#b07a6e" />
      </svg>
      <div className="vine-rule flex-1" />
    </div>
  );
}
