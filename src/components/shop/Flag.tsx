// Simplified flags drawn as round badges. Colors are softened toward the brand's earthy palette on purpose.

const C = {
  red: "#b5463a",
  blue: "#2f4a72",
  white: "#f6f1e6",
  gold: "#d8a93b",
  green: "#3f6b45",
  saffron: "#d9894a",
  navy: "#273b5c",
};

function Haiti() {
  return (
    <>
      <rect width="60" height="30" fill={C.blue} />
      <rect y="30" width="60" height="30" fill={C.red} />
      <rect x="21" y="22" width="18" height="16" rx="1.5" fill={C.white} />
      <path d="M30 25v8M26 33h8" stroke={C.green} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="30" cy="25" r="2.4" fill={C.green} />
    </>
  );
}

function Star({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36 - 90 + rot) * Math.PI) / 180;
    const rr = i % 2 ? r * 0.42 : r;
    return `${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return <polygon points={pts} fill={C.gold} />;
}

function China() {
  return (
    <>
      <rect width="60" height="60" fill={C.red} />
      <Star x={20} y={22} r={8} />
      <Star x={31} y={13} r={2.6} rot={20} />
      <Star x={36} y={19} r={2.6} rot={40} />
      <Star x={36} y={27} r={2.6} rot={0} />
      <Star x={31} y={33} r={2.6} rot={20} />
    </>
  );
}

function Japan() {
  return (
    <>
      <rect width="60" height="60" fill={C.white} />
      <circle cx="30" cy="30" r="12" fill={C.red} />
    </>
  );
}

function UK() {
  return (
    <>
      <rect width="60" height="60" fill={C.navy} />
      <path d="M0 0L60 60M60 0L0 60" stroke={C.white} strokeWidth="12" />
      <path d="M0 0L60 60M60 0L0 60" stroke={C.red} strokeWidth="4" />
      <path d="M30 0v60M0 30h60" stroke={C.white} strokeWidth="18" />
      <path d="M30 0v60M0 30h60" stroke={C.red} strokeWidth="10" />
    </>
  );
}

function USA() {
  return (
    <>
      <rect width="60" height="60" fill={C.white} />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} y={i * 8.6} width="60" height="4.3" fill={C.red} />
      ))}
      <rect width="30" height="30" fill={C.navy} />
      {[8, 16, 24].flatMap((y) => [8, 16, 24].map((x) => <circle key={`${x}-${y}`} cx={x + 1} cy={y - 1} r="1.4" fill={C.white} />))}
    </>
  );
}

function India() {
  return (
    <>
      <rect width="60" height="20" fill={C.saffron} />
      <rect y="20" width="60" height="20" fill={C.white} />
      <rect y="40" width="60" height="20" fill={C.green} />
      <circle cx="30" cy="30" r="6.5" fill="none" stroke={C.navy} strokeWidth="1.3" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <line key={i} x1="30" y1="30" x2={30 + 6.5 * Math.cos(a)} y2={30 + 6.5 * Math.sin(a)} stroke={C.navy} strokeWidth="0.7" />;
      })}
    </>
  );
}

function France() {
  return (
    <>
      <rect width="20" height="60" fill={C.blue} />
      <rect x="20" width="20" height="60" fill={C.white} />
      <rect x="40" width="20" height="60" fill={C.red} />
    </>
  );
}

function World() {
  return (
    <>
      <rect width="60" height="60" fill="#e7dcc7" />
      <circle cx="30" cy="30" r="15" fill="none" stroke="#5b4532" strokeWidth="1.6" />
      <ellipse cx="30" cy="30" rx="7" ry="15" fill="none" stroke="#5b4532" strokeWidth="1.3" />
      <path d="M15 30h30M17.5 22h25M17.5 38h25" stroke="#5b4532" strokeWidth="1.1" />
    </>
  );
}

const FLAGS: Record<string, () => React.ReactElement> = { Haiti, China, Japan, UK, USA, India, France };

export const FLAG_COUNTRIES = Object.keys(FLAGS);

export default function Flag({ country, size = 56, className = "" }: { country: string | null; size?: number; className?: string }) {
  const Draw = (country && FLAGS[country]) || World;
  const id = `flag-${(country || "all").replace(/\W/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" className={className} aria-hidden>
      <defs>
        <clipPath id={id}>
          <circle cx="30" cy="30" r="30" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`} style={{ filter: "saturate(0.8)" }}>
        <Draw />
        <rect width="60" height="60" fill="#f3e9d6" opacity="0.12" />
      </g>
    </svg>
  );
}
