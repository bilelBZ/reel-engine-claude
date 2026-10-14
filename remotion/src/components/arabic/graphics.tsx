import { useCurrentFrame, interpolate } from "remotion";
import { ARABIC_THEME as T } from "./arabicTheme";
import { mulberry32 } from "./Particles";

/* ------------------------------------------------------------------ */
/* Eye — white sclera, orange iris, black pupil, rotating dashed rings */
/* ------------------------------------------------------------------ */

export const Eye: React.FC<{ size?: number; x?: number; y?: number }> = ({
  size = 560,
  x = 540,
  y = 950,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const w = size;
  const h = size * 0.52;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        pointerEvents: "none",
      }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <radialGradient id="iris" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE36E" />
            <stop offset="38%" stopColor="#FF9E1B" />
            <stop offset="72%" stopColor="#E84E0C" />
            <stop offset="100%" stopColor="#8E0F0F" />
          </radialGradient>
          <radialGradient id="sclera" cx="50%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="80%" stopColor="#F2E4D8" />
            <stop offset="100%" stopColor="#D9C4B4" />
          </radialGradient>
        </defs>
        {/* rotating dashed rings */}
        {[0, 1, 2].map((i) => {
          const r = w * (0.42 + i * 0.075);
          const rot = (t * (i % 2 === 0 ? 26 : -18) + i * 70) % 360;
          return (
            <g key={i} transform={`rotate(${rot} ${w / 2} ${h / 2})`}>
              <circle
                cx={w / 2}
                cy={h / 2}
                r={r}
                fill="none"
                stroke={i === 1 ? "#FF9E2C" : "#E5392B"}
                strokeWidth={i === 1 ? 7 : 4}
                strokeDasharray={`${r * 0.55} ${r * 0.9}`}
                strokeLinecap="round"
                opacity={0.85 - i * 0.18}
              />
            </g>
          );
        })}
        {/* sclera */}
        <path
          d={`M ${w * 0.06} ${h / 2} Q ${w * 0.3} ${-h * 0.08} ${w / 2} ${h * 0.02} Q ${w * 0.7} ${-h * 0.08} ${w * 0.94} ${h / 2} Q ${w * 0.7} ${h * 1.08} ${w / 2} ${h * 0.98} Q ${w * 0.3} ${h * 1.08} ${w * 0.06} ${h / 2} Z`}
          fill="url(#sclera)"
          stroke="#3A1A12"
          strokeWidth={5}
        />
        {/* iris */}
        <circle cx={w / 2} cy={h / 2} r={h * 0.4} fill="url(#iris)" />
        <circle
          cx={w / 2}
          cy={h / 2}
          r={h * 0.4}
          fill="none"
          stroke="#5E0B06"
          strokeWidth={6}
        />
        {/* pupil */}
        <circle cx={w / 2} cy={h / 2} r={h * 0.19} fill="#0A0A0A" />
        <circle cx={w / 2 - h * 0.07} cy={h / 2 - h * 0.08} r={h * 0.05} fill="#FFF" opacity={0.95} />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* RobotHead — cute white robot, dark visor, cyan eyes, red antenna    */
/* ------------------------------------------------------------------ */

export const RobotHead: React.FC<{ size?: number; x?: number; y?: number }> = ({
  size = 230,
  x = 540,
  y = 640,
}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin((frame / 30) * Math.PI * 1.4) * 10;
  const blink = Math.abs(Math.sin((frame / 30) * Math.PI * 0.55)) < 0.06 ? 0.15 : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2 + bob,
        width: size,
        height: size,
        pointerEvents: "none",
        filter: "drop-shadow(0 10px 26px rgba(0,0,0,0.55))",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 230 230">
        {/* antenna */}
        <line x1="115" y1="34" x2="115" y2="8" stroke="#C9CCD4" strokeWidth="7" strokeLinecap="round" />
        <circle cx="115" cy="10" r="9" fill="#E5392B">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
        </circle>
        {/* ears */}
        <rect x="18" y="92" width="26" height="52" rx="13" fill="#DDE0E7" />
        <rect x="186" y="92" width="26" height="52" rx="13" fill="#DDE0E7" />
        {/* head */}
        <rect x="38" y="34" width="154" height="140" rx="62" fill="#F4F6FA" />
        <rect x="38" y="34" width="154" height="140" rx="62" fill="none" stroke="#C9CCD4" strokeWidth="5" />
        {/* visor */}
        <rect x="58" y="66" width="114" height="76" rx="38" fill="#101319" />
        {/* cyan eyes */}
        <ellipse cx="92" cy="104" rx="13" ry={15 * blink} fill="#37E5E5" />
        <ellipse cx="138" cy="104" rx="13" ry={15 * blink} fill="#37E5E5" />
        <ellipse cx="92" cy="104" rx="13" ry={15 * blink} fill="none" stroke="#0E7C7C" strokeWidth="3" />
        <ellipse cx="138" cy="104" rx="13" ry={15 * blink} fill="none" stroke="#0E7C7C" strokeWidth="3" />
        {/* mouth grill */}
        <rect x="96" y="182" width="38" height="10" rx="5" fill="#C9CCD4" />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* StarburstBadge — jagged red burst behind hook text                   */
/* ------------------------------------------------------------------ */

export const StarburstBadge: React.FC<{
  size?: number;
  x?: number;
  y?: number;
  seed?: number;
}> = ({ size = 620, x = 540, y = 800, seed = 5 }) => {
  const frame = useCurrentFrame();
  const rand = mulberry32(seed);
  const spikes = 16;
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = size / 2 * (i % 2 === 0 ? 1 : 0.72 + rand() * 0.08);
    const a = (i / (spikes * 2)) * Math.PI * 2;
    pts.push(`${size / 2 + r * Math.cos(a)},${size / 2 + r * Math.sin(a)}`);
  }
  const wobble = Math.sin((frame / 30) * Math.PI * 2) * 4;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        pointerEvents: "none",
        transform: `rotate(${wobble}deg)`,
        filter: "drop-shadow(0 0 44px rgba(229,57,43,0.65))",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id="burst" cx="50%" cy="42%" r="65%">
            <stop offset="0%" stopColor="#F0522F" />
            <stop offset="55%" stopColor="#C22015" />
            <stop offset="100%" stopColor="#7A0C08" />
          </radialGradient>
        </defs>
        <polygon points={pts.join(" ")} fill="url(#burst)" stroke="#5E0B06" strokeWidth={6} />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* OrbitWord — giant latin word with an orbiting golden ring + comet   */
/* ------------------------------------------------------------------ */

export const OrbitWord: React.FC<{
  word: string;
  size?: number;
  x?: number;
  y?: number;
  seed?: number;
}> = ({ word, size = 300, x = 540, y = 950, seed = 9 }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const boxW = size * word.length * 0.78 + 160;
  const boxH = size * 1.05 + 200;
  const cx = boxW / 2;
  const cy = boxH / 2;
  const a = boxW * 0.46; // ellipse radii
  const b = boxH * 0.30;
  const tilt = -16;
  const ang = t * 2.4 + seed;
  const px = cx + a * Math.cos(ang);
  const py = cy + b * Math.sin(ang);
  const dash = interpolate((t * 1.2) % 1, [0, 1], [0, 220]);
  return (
    <div
      style={{
        position: "absolute",
        left: x - boxW / 2,
        top: y - boxH / 2,
        width: boxW,
        height: boxH,
        pointerEvents: "none",
      }}
    >
      <svg width={boxW} height={boxH} viewBox={`0 0 ${boxW} ${boxH}`}>
        <g transform={`rotate(${tilt} ${cx} ${cy})`}>
          <ellipse
            cx={cx}
            cy={cy}
            rx={a}
            ry={b}
            fill="none"
            stroke="url(#ringGold)"
            strokeWidth={10}
            strokeDasharray={`70 ${Math.max(40, 340 - dash)}`}
            strokeLinecap="round"
            opacity={0.95}
          />
          <defs>
            <linearGradient id="ringGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFE9A8" />
              <stop offset="100%" stopColor="#FF8A1E" />
            </linearGradient>
          </defs>
          {/* comet head */}
          <circle cx={px} cy={py} r={13} fill="#FFE9A8" opacity={0.95} />
          <circle cx={px} cy={py} r={24} fill="#FFB52E" opacity={0.35} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: T.fontFamily,
          fontWeight: T.fontWeight,
          fontSize: size,
          letterSpacing: size * 0.04,
          background: T.goldGradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter:
            "drop-shadow(0 5px 0 rgba(120,40,0,0.9)) drop-shadow(0 0 34px rgba(255,170,40,0.65))",
        }}
      >
        {word}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Icon tiles — dark rounded squares with simple glyphs                */
/* ------------------------------------------------------------------ */

export const IconGlyph: React.FC<{ name: string; size?: number }> = ({
  name,
  size = 64,
}) => {
  const s = { width: size, height: size };
  switch (name) {
    case "image":
      return (
        <svg {...s} viewBox="0 0 64 64">
          <rect x="6" y="10" width="52" height="44" rx="8" fill="none" stroke="#fff" strokeWidth="5" />
          <circle cx="22" cy="24" r="6" fill="#FF9E2C" />
          <path d="M8 46 L24 30 L36 42 L44 34 L58 48 L58 50 Q58 54 54 54 L10 54 Q6 54 6 50 Z" fill="#fff" />
        </svg>
      );
    case "text":
      return (
        <div
          style={{
            fontFamily: T.fontFamily,
            fontWeight: T.fontWeight,
            fontSize: size * 0.85,
            color: "#fff",
            lineHeight: 1,
          }}
        >
          T
        </div>
      );
    case "audio": {
      const bars = [0.5, 0.9, 0.65, 1, 0.45, 0.8, 0.55];
      return (
        <svg {...s} viewBox="0 0 64 64">
          {bars.map((b, i) => (
            <rect
              key={i}
              x={10 + i * 7}
              y={32 - b * 20}
              width={4.5}
              height={b * 40}
              rx={2.2}
              fill="#fff"
            />
          ))}
        </svg>
      );
    }
    case "play":
      return (
        <svg {...s} viewBox="0 0 64 64">
          <path d="M22 14 L50 32 L22 50 Z" fill="#E5392B" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      );
    case "spark":
    default:
      return (
        <svg {...s} viewBox="0 0 64 64">
          <path
            d="M32 4 L38 26 L60 32 L38 38 L32 60 L26 38 L4 32 L26 26 Z"
            fill="#FFC93C"
          />
        </svg>
      );
  }
};

export const IconTiles: React.FC<{
  icons: string[];
  layout?: "scatter" | "row";
  x?: number;
  y?: number;
  tile?: number;
}> = ({ icons, layout = "scatter", x = 540, y = 1000, tile = 128 }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  // Reference constellation for 5 tiles around the center word
  const scatterPos = [
    { dx: -330, dy: -260 },
    { dx: 330, dy: -270 },
    { dx: -360, dy: 90 },
    { dx: 350, dy: 110 },
    { dx: -40, dy: 300 },
  ];
  const names = icons.length ? icons : ["image", "text", "audio", "play", "spark"];
  const gap = tile + 34;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {names.slice(0, 5).map((name, i) => {
        const pos =
          layout === "row"
            ? { dx: (i - (names.length - 1) / 2) * gap, dy: 0 }
            : scatterPos[i % scatterPos.length];
        const float = Math.sin(t * 1.8 + i * 1.3) * 14;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + pos.dx - tile / 2,
              top: y + pos.dy - tile / 2 + float,
              width: tile,
              height: tile,
              borderRadius: 30,
              background: T.tileBg,
              border: `2px solid ${T.tileBorder}`,
              boxShadow: T.tileGlow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconGlyph name={name} size={tile * 0.5} />
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Art cards — abstract CSS/SVG illustrations (no photos needed)        */
/* ------------------------------------------------------------------ */

function SunsetArt() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 440 260" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sunsetSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2B0A12" />
          <stop offset="45%" stopColor="#C22015" />
          <stop offset="100%" stopColor="#FF7A2E" />
        </linearGradient>
      </defs>
      <rect width="440" height="260" fill="url(#sunsetSky)" />
      <circle cx="290" cy="150" r="52" fill="#FFD766" />
      <polygon points="0,260 0,190 90,150 170,195 260,160 340,200 440,170 440,260" fill="#0A0A0A" />
      {/* runner silhouette */}
      <g transform="translate(120,118) scale(1.15)" stroke="#0A0A0A" strokeWidth="7" strokeLinecap="round" fill="none">
        <circle cx="0" cy="-22" r="9" fill="#0A0A0A" stroke="none" />
        <path d="M0 -12 L-3 12 M0 -12 L-18 4 M0 -12 L16 -2 M-3 12 L-16 34 M-3 12 L12 30" />
      </g>
    </svg>
  );
}

function CityArt() {
  const rand = mulberry32(21);
  const buildings = Array.from({ length: 9 }, (_, i) => {
    const w = 34 + rand() * 22;
    const h = 90 + rand() * 110;
    return { x: 8 + i * 48, w, h, lit: rand() };
  });
  return (
    <svg width="100%" height="100%" viewBox="0 0 440 260" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="citySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B0B1E" />
          <stop offset="100%" stopColor="#3A1B4E" />
        </linearGradient>
      </defs>
      <rect width="440" height="260" fill="url(#citySky)" />
      <circle cx="370" cy="46" r="16" fill="#F5F0E0" />
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={260 - b.h} width={b.w} height={b.h} fill="#101020" />
          {Array.from({ length: Math.floor(b.h / 26) }, (_, r) =>
            Array.from({ length: Math.floor(b.w / 18) }, (_, c) =>
              (i * 7 + r * 3 + c) % 3 === 0 ? (
                <rect
                  key={`${r}-${c}`}
                  x={b.x + 6 + c * 18}
                  y={260 - b.h + 10 + r * 26}
                  width={9}
                  height={12}
                  fill="#FFD766"
                  opacity={0.85}
                />
              ) : null
            )
          )}
        </g>
      ))}
    </svg>
  );
}

function WaveformArt() {
  const wave = (amp: number, phase: number, color: string, width: number) => {
    const pts: string[] = [];
    for (let x = 0; x <= 440; x += 8) {
      pts.push(`${x},${130 + amp * Math.sin((x / 440) * Math.PI * 4 + phase)}`);
    }
    return (
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        opacity={0.95}
      />
    );
  };
  return (
    <svg width="100%" height="100%" viewBox="0 0 440 260" preserveAspectRatio="xMidYMid slice">
      <rect width="440" height="260" fill="#14101E" />
      {wave(52, 0, "#FF5AA0", 9)}
      {wave(52, 1.2, "#FFFFFF", 7)}
      {wave(30, 2.4, "#B06BFF", 6)}
    </svg>
  );
}

export const EqualizerArt: React.FC<{ animated?: boolean }> = ({ animated = true }) => {
  const frame = animated ? useCurrentFrame() : 0;
  const t = frame / 30;
  const bars = 26;
  return (
    <svg width="100%" height="100%" viewBox="0 0 440 260" preserveAspectRatio="xMidYMid slice">
      <rect width="440" height="260" fill="#0A0A0A" />
      {Array.from({ length: bars }, (_, i) => {
        const h = animated
          ? 40 + 170 * Math.abs(Math.sin(t * 4 + i * 0.55))
          : 60 + 140 * Math.abs(Math.sin(i * 0.55));
        return (
          <rect
            key={i}
            x={10 + i * 16}
            y={240 - h}
            width={10}
            height={h}
            rx={5}
            fill={i % 5 === 0 ? "#FF8A5A" : "#E5392B"}
          />
        );
      })}
    </svg>
  );
};

export const CardArt: React.FC<{ name: string }> = ({ name }) => {
  switch (name) {
    case "sunset":
      return <SunsetArt />;
    case "city":
      return <CityArt />;
    case "waveform":
      return <WaveformArt />;
    case "equalizer":
      return <EqualizerArt />;
    default:
      return <SunsetArt />;
  }
};

/* ------------------------------------------------------------------ */
/* EditorMock — video-editor window: preview + timeline tracks          */
/* ------------------------------------------------------------------ */

export const EditorMock: React.FC<{
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  art?: string;
}> = ({ x = 540, y = 980, w = 840, h = 600, art = "sunset" }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const tracks = [
    { color: "#E5392B", x: 60, w: 200 },
    { color: "#FFC93C", x: 150, w: 260 },
    { color: "#FF5AA0", x: 100, w: 180 },
    { color: "#FFFFFF", x: 220, w: 220 },
  ];
  const playhead = 60 + ((t * 120) % 620);
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: 28,
        background: T.editorBg,
        border: "2px solid #2A2E38",
        boxShadow: "0 20px 70px rgba(0,0,0,0.6), 0 0 30px rgba(229,57,43,0.3)",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* title bar */}
      <div style={{ height: 52, background: T.editorBar, display: "flex", alignItems: "center", padding: "0 22px", gap: 12 }}>
        {["#E5392B", "#FFC93C", "#37C837"].map((c, i) => (
          <div key={i} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
        ))}
      </div>
      <div style={{ display: "flex", height: h - 52 - 190 }}>
        {/* left panel */}
        <div style={{ width: 130, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 56, borderRadius: 10, background: "#23262F" }} />
          ))}
        </div>
        {/* preview */}
        <div style={{ flex: 1, padding: "14px 6px", }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 14, overflow: "hidden" }}>
            <CardArt name={art} />
          </div>
        </div>
        {/* right panel */}
        <div style={{ width: 130, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 56, borderRadius: 10, background: "#23262F" }} />
          ))}
        </div>
      </div>
      {/* timeline */}
      <div style={{ height: 190, borderTop: "2px solid #23262F", padding: "18px 24px", position: "relative" }}>
        {tracks.map((tr, i) => (
          <div key={i} style={{ height: 26, marginBottom: 10, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: tr.x,
                top: 0,
                width: tr.w,
                height: 26,
                borderRadius: 6,
                background: tr.color,
                opacity: 0.9,
              }}
            />
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            top: 8,
            bottom: 8,
            left: 24 + playhead,
            width: 4,
            background: "#fff",
            borderRadius: 2,
            boxShadow: "0 0 10px rgba(255,255,255,0.8)",
          }}
        />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* DiamondQuestion — "?" built from gold diamond tiles (pixel look)    */
/* ------------------------------------------------------------------ */

export const DiamondQuestion: React.FC<{
  symbol?: string;
  size?: number;
  x?: number;
  y?: number;
}> = ({ symbol = "؟", size = 560, x = 540, y = 950 }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const d = 46; // diamond tile size
  const cols = Math.ceil(size / d) + 2;
  const rows = Math.ceil(size / d) + 2;
  const rand = mulberry32(99);
  const redSpots = new Set(
    Array.from({ length: 8 }, () => `${Math.floor(rand() * cols)},${Math.floor(rand() * rows)}`)
  );
  const pulse = 0.75 + 0.25 * Math.sin(t * Math.PI * 2.2);
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        pointerEvents: "none",
        opacity: pulse,
        filter: "drop-shadow(0 0 30px rgba(255,170,40,0.55))",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <pattern id="diamonds" width={d} height={d} patternUnits="userSpaceOnUse">
            <rect x={d * 0.18} y={d * 0.18} width={d * 0.64} height={d * 0.64}
              transform={`rotate(45 ${d / 2} ${d / 2})`} fill="#FFC93C" />
          </pattern>
          <mask id="qmask">
            <rect width={size} height={size} fill="black" />
            <text
              x={size / 2}
              y={size * 0.78}
              textAnchor="middle"
              fontFamily={T.fontFamily}
              fontWeight={T.fontWeight}
              fontSize={size * 0.95}
              fill="white"
            >
              {symbol}
            </text>
          </mask>
        </defs>
        <rect width={size} height={size} fill="url(#diamonds)" mask="url(#qmask)" />
        {/* a few red accent diamonds */}
        <g mask="url(#qmask)">
          {Array.from(redSpots).map((key) => {
            const [cx, cy] = (key as string).split(",").map(Number);
            return (
              <rect
                key={key}
                x={cx * d + d * 0.18}
                y={cy * d + d * 0.18}
                width={d * 0.64}
                height={d * 0.64}
                transform={`rotate(45 ${cx * d + d / 2} ${cy * d + d / 2})`}
                fill="#E5392B"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* CommentBox — dark pill with avatar, placeholder/typed text, send    */
/* ------------------------------------------------------------------ */

export const CommentBox: React.FC<{
  x?: number;
  y?: number;
  w?: number;
  placeholder?: string;
  typed?: string;
}> = ({ x = 540, y = 1290, w = 760, placeholder = "أضف تعليقا...", typed = "" }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const caret = Math.sin(t * Math.PI * 4) > 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - 62,
        width: w,
        height: 124,
        borderRadius: 62,
        background: "#14161D",
        border: "2px solid rgba(229,57,43,0.65)",
        boxShadow: "0 0 28px rgba(229,57,43,0.35)",
        display: "flex",
        alignItems: "center",
        padding: "0 18px 0 26px",
        direction: "rtl",
        pointerEvents: "none",
      }}
    >
      {/* avatar */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          background: "#E5392B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="18" r="10" fill="#fff" />
          <path d="M8 46 Q8 30 26 30 Q44 30 44 46 Z" fill="#fff" />
        </svg>
      </div>
      {/* text */}
      <div
        style={{
          flex: 1,
          fontFamily: T.fontFamily,
          fontWeight: T.fontWeight,
          fontSize: 44,
          color: typed ? "#fff" : "#6B7280",
          padding: "0 22px",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {typed || placeholder}
        {typed && caret ? <span style={{ color: "#FFC93C" }}>▍</span> : null}
      </div>
      {/* send */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          background: "#23262F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="44" height="44" viewBox="0 0 44 44">
          <path d="M10 22 L32 22 M24 12 L34 22 L24 32" stroke="#9AA0AE" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* OrangeBar — the glowing orange progress bar under the tiles         */
/* ------------------------------------------------------------------ */

export const OrangeBar: React.FC<{ x?: number; y?: number; w?: number }> = ({
  x = 540,
  y = 1130,
  w = 780,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - 18,
        width: w,
        height: 36,
        borderRadius: 18,
        background: "#23262F",
        overflow: "hidden",
        boxShadow: "0 0 24px rgba(255,140,30,0.45)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          background: "linear-gradient(90deg, #E5392B, #FF8A1E, #FFC93C)",
          borderRadius: 18,
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* GoldArrow — chunky gold arrow (points left, matching the reference) */
/* ------------------------------------------------------------------ */

export const GoldArrow: React.FC<{ x?: number; y?: number; w?: number }> = ({
  x = 770,
  y = 880,
  w = 150,
}) => {
  const frame = useCurrentFrame();
  const nudge = Math.sin((frame / 30) * Math.PI * 2.4) * 12;
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2 + nudge,
        top: y - 40,
        width: w,
        height: 80,
        pointerEvents: "none",
        filter: "drop-shadow(0 0 18px rgba(255,180,60,0.8))",
      }}
    >
      <svg width={w} height={80} viewBox="0 0 150 80">
        <defs>
          <linearGradient id="arrowGold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF8A1E" />
            <stop offset="100%" stopColor="#FFE9A8" />
          </linearGradient>
        </defs>
        {/* points left */}
        <polygon points="60,8 8,40 60,72 60,56 142,56 142,24 60,24" fill="url(#arrowGold)" />
      </svg>
    </div>
  );
};
