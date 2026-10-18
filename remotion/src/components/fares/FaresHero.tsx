import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FARES, FARES_FONT } from "./faresTheme";
import type { FaresHeroKind } from "./types";

const RED = "#FF2E36";
const WHITE = "#FFFFFF";
const DIM = "#8A8F98";
const PANEL = "#101014";
const PANEL_EDGE = "#23262e";

/**
 * Fares hero stage: isolated floating graphic panel with crimson aura,
 * spring overshoot entrance, continuous sinusoidal float.
 */
export const FaresHero: React.FC<{ kind: FaresHeroKind; sceneStart: number }> = ({
  kind,
  sceneStart,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - sceneStart;

  // Entrance: spring overshoot (GSAP back.out feel)
  const enter = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 11, stiffness: 160, mass: 0.9 },
    durationInFrames: 22,
  });
  const eY = interpolate(enter, [0, 1], [90, 0]);
  const eS = interpolate(enter, [0, 1], [0.82, 1]);
  const eO = interpolate(enter, [0, 1], [0, 1]);
  const eR = interpolate(enter, [0, 1], [4, 0]);

  // Continuous float (never a dead frame)
  const fY = Math.sin(t * Math.PI * 0.9) * -14;
  const fR = Math.sin(t * Math.PI * 0.5) * 1.4;

  return (
    <div
      style={{
        position: "absolute",
        top: `${FARES.heroTop * 100}%`,
        left: "50%",
        width: FARES.heroW,
        height: FARES.heroH,
        transform: `translate(-50%, -50%) translateY(${eY + fY}px) scale(${eS}) rotate(${eR + fR}deg)`,
        opacity: eO,
      }}
    >
      {/* crimson aura */}
      <div
        style={{
          position: "absolute",
          inset: -90,
          background: FARES.heroAura,
          filter: "blur(60px)",
          opacity: 0.85,
        }}
      />
      {/* panel */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 32,
          background: `linear-gradient(160deg, #15151b 0%, ${PANEL} 55%, #0b0b0e 100%)`,
          border: `2px solid ${PANEL_EDGE}`,
          boxShadow: `${FARES.heroShadow}, inset 0 1px 0 rgba(255,255,255,0.07)`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HeroGraphic kind={kind} t={t} />
        {/* top sheen */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

/** Per-kind SVG illustration, animated with scene-local time t. */
const HeroGraphic: React.FC<{ kind: FaresHeroKind; t: number }> = ({ kind, t }) => {
  const W = 760;
  const H = 480;
  switch (kind) {
    case "hourglass":
      return <Hourglass t={t} W={W} H={H} />;
    case "film":
      return <FilmStrip t={t} W={W} H={H} />;
    case "textlines":
      return <TextLines t={t} W={W} H={H} />;
    case "eye":
      return <Eye t={t} W={W} H={H} />;
    case "wand":
      return <Wand t={t} W={W} H={H} />;
    case "robot":
      return <Robot t={t} W={W} H={H} />;
    case "rocket":
      return <Rocket t={t} W={W} H={H} />;
  }
};

/* ---------------- graphics ---------------- */

const Hourglass: React.FC<{ t: number; W: number; H: number }> = ({ t, W, H }) => {
  const cx = W / 2;
  const sandDrop = (t * 90) % 300;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* frame */}
      <rect x={cx - 130} y={40} width={260} height={26} rx={13} fill="#1d1f26" stroke={PANEL_EDGE} strokeWidth={2} />
      <rect x={cx - 130} y={414} width={260} height={26} rx={13} fill="#1d1f26" stroke={PANEL_EDGE} strokeWidth={2} />
      <rect x={cx - 118} y={60} width={14} height={360} fill="#262932" />
      <rect x={cx + 104} y={60} width={14} height={360} fill="#262932" />
      {/* glass */}
      <path d={`M ${cx - 100} 78 L ${cx + 100} 78 L ${cx + 18} 232 L ${cx - 18} 232 L ${cx - 100} 402 L ${cx + 100} 402 Z`}
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
      {/* top sand */}
      <path d={`M ${cx - 92} 86 L ${cx + 92} 86 L ${cx + 30} 200 L ${cx - 30} 200 Z`} fill={RED} opacity={0.85} />
      {/* falling stream */}
      <rect x={cx - 4} y={205} width={8} height={sandDrop * 0.5} fill={RED} opacity={0.9} />
      {/* bottom pile */}
      <path d={`M ${cx - 92} 394 L ${cx + 92} 394 L ${cx + 40} 300 Q ${cx} 285 ${cx - 40} 300 Z`} fill={RED} opacity={0.9} />
      {/* glow */}
      <circle cx={cx} cy={240} r={150} fill={RED} opacity={0.08} />
    </svg>
  );
};

const FilmStrip: React.FC<{ t: number; W: number; H: number }> = ({ t, W, H }) => {
  const shift = (t * 60) % 200;
  const holes = Array.from({ length: 8 }, (_, i) => i);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect x={60} y={150} width={640} height={180} rx={18} fill="#14161c" stroke={PANEL_EDGE} strokeWidth={3} />
      {holes.map((i) => (
        <g key={i}>
          <rect x={90 + i * 76 - (shift % 76)} y={162} width={34} height={24} rx={6} fill="#2a2e38" />
          <rect x={90 + i * 76 - (shift % 76)} y={294} width={34} height={24} rx={6} fill="#2a2e38" />
        </g>
      ))}
      {/* frames scrolling */}
      {[0, 1, 2].map((i) => {
        const x = 130 + i * 200 - (shift % 200);
        return (
          <rect key={i} x={x} y={200} width={150} height={80} rx={10}
            fill={i === 1 ? "rgba(255,46,54,0.25)" : "rgba(255,255,255,0.06)"}
            stroke={i === 1 ? RED : "#3a3e48"} strokeWidth={i === 1 ? 3 : 2} />
        );
      })}
      {/* play button */}
      <circle cx={W / 2} cy={H / 2 + 140} r={56} fill={RED} />
      <circle cx={W / 2} cy={H / 2 + 140} r={56} fill="none" stroke={WHITE} strokeWidth={3} opacity={0.4} />
      <path d={`M ${W / 2 - 16} ${H / 2 + 112} L ${W / 2 + 26} ${H / 2 + 140} L ${W / 2 - 16} ${H / 2 + 168} Z`} fill={WHITE} />
    </svg>
  );
};

const TextLines: React.FC<{ t: number; W: number; H: number }> = ({ t, W, H }) => {
  const rows = [
    { w: 560, c: WHITE, y: 120 },
    { w: 420, c: RED, y: 200 },
    { w: 600, c: WHITE, y: 280 },
    { w: 340, c: RED, y: 360 },
  ];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {rows.map((r, i) => {
        const slide = Math.sin(t * 2 + i * 1.3) * 14;
        const glow = i % 2 === 1;
        return (
          <g key={i}>
            <rect x={W / 2 - r.w / 2 + slide} y={r.y} width={r.w} height={34} rx={17}
              fill={r.c} opacity={glow ? 0.95 : 0.9}
              style={glow ? { filter: `drop-shadow(0 0 18px ${RED})` } : undefined} />
            {/* word ticks */}
            {[0.15, 0.4, 0.65, 0.88].map((f, j) => (
              <circle key={j} cx={W / 2 - r.w / 2 + slide + r.w * f} cy={r.y + 17} r={5}
                fill={glow ? WHITE : "#0b0b0e"} opacity={0.85} />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

const Eye: React.FC<{ t: number; W: number; H: number }> = ({ t, W, H }) => {
  const cx = W / 2, cy = H / 2;
  const blink = Math.max(0.12, Math.abs(Math.sin(t * 1.4)));
  const lookX = Math.sin(t * 0.9) * 26;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <circle cx={cx} cy={cy} r={200} fill="none" stroke={RED} strokeWidth={3} opacity={0.35 + 0.2 * Math.sin(t * 2)} />
      <circle cx={cx} cy={cy} r={150} fill="none" stroke={RED} strokeWidth={2} opacity={0.25} />
      {/* eye shape */}
      <path d={`M ${cx - 190} ${cy} Q ${cx} ${cy - 150 * blink} ${cx + 190} ${cy} Q ${cx} ${cy + 150 * blink} ${cx - 190} ${cy} Z`}
        fill={WHITE} />
      {/* iris */}
      <circle cx={cx + lookX} cy={cy} r={62 * blink + 8} fill={RED} />
      <circle cx={cx + lookX} cy={cy} r={30 * blink + 4} fill="#0b0b0e" />
      <circle cx={cx + lookX - 18} cy={cy - 18} r={12} fill={WHITE} opacity={0.9} />
    </svg>
  );
};

const Wand: React.FC<{ t: number; W: number; H: number }> = ({ t, W, H }) => {
  const cx = W / 2, cy = H / 2;
  const sparks = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + t * 0.7;
    const r = 120 + 40 * Math.sin(t * 2 + i);
    return { x: cx + 60 + Math.cos(a) * r, y: cy - 60 + Math.sin(a) * r, s: 6 + (i % 3) * 5, o: 0.5 + 0.5 * Math.sin(t * 3 + i * 2) };
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* pen */}
      <g transform={`rotate(${-18 + Math.sin(t * 1.2) * 4} ${cx - 40} ${cy + 40})`}>
        <rect x={cx - 160} y={cy + 20} width={260} height={44} rx={22} fill="#1d1f26" stroke={PANEL_EDGE} strokeWidth={3} />
        <path d={`M ${cx + 100} ${cy + 20} L ${cx + 170} ${cy + 42} L ${cx + 100} ${cy + 64} Z`} fill={RED} />
        <rect x={cx - 140} y={cy + 34} width={60} height={16} rx={8} fill={RED} opacity={0.7} />
      </g>
      {/* spark burst */}
      <circle cx={cx + 190} cy={cy - 40} r={90} fill={RED} opacity={0.1 + 0.06 * Math.sin(t * 3)} />
      {sparks.map((s, i) => (
        <path key={i} d={`M ${s.x} ${s.y - s.s} L ${s.x + s.s * 0.28} ${s.y - s.s * 0.28} L ${s.x + s.s} ${s.y} L ${s.x + s.s * 0.28} ${s.y + s.s * 0.28} L ${s.x} ${s.y + s.s} L ${s.x - s.s * 0.28} ${s.y + s.s * 0.28} L ${s.x - s.s} ${s.y} L ${s.x - s.s * 0.28} ${s.y - s.s * 0.28} Z`}
          fill={i % 2 ? WHITE : RED} opacity={Math.max(0.15, s.o)} />
      ))}
    </svg>
  );
};

const Robot: React.FC<{ t: number; W: number; H: number }> = ({ t, W, H }) => {
  const cx = W / 2, cy = H / 2 - 30;
  const bob = Math.sin(t * 1.6) * 8;
  const eyePulse = 0.7 + 0.3 * Math.sin(t * 3);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* antenna */}
      <line x1={cx} y1={cy - 130 + bob} x2={cx} y2={cy - 170 + bob} stroke={DIM} strokeWidth={8} strokeLinecap="round" />
      <circle cx={cx} cy={cy - 182 + bob} r={14} fill={RED} opacity={eyePulse} />
      {/* head */}
      <rect x={cx - 130} y={cy - 130 + bob} width={260} height={210} rx={56} fill="#1d1f26" stroke={PANEL_EDGE} strokeWidth={3} />
      <rect x={cx - 130} y={cy - 130 + bob} width={260} height={210} rx={56} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
      {/* eyes */}
      <rect x={cx - 92} y={cy - 62 + bob} width={64} height={44} rx={22} fill={RED} opacity={eyePulse} />
      <rect x={cx + 28} y={cy - 62 + bob} width={64} height={44} rx={22} fill={RED} opacity={eyePulse} />
      {/* mouth grill */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={cx - 60 + i * 34} y={cy + 28 + bob} width={18} height={34} rx={9} fill="#3a3e48" />
      ))}
      {/* ears */}
      <rect x={cx - 162} y={cy - 60 + bob} width={32} height={70} rx={16} fill="#262932" />
      <rect x={cx + 130} y={cy - 60 + bob} width={32} height={70} rx={16} fill="#262932" />
      {/* label */}
      <text x={cx} y={cy + 170} textAnchor="middle" fill={WHITE} fontSize={44} fontWeight={900}
        fontFamily={FARES_FONT} letterSpacing={2}>claude-shorts</text>
      <rect x={cx - 200} y={cy + 196} width={400} height={8} rx={4} fill={RED} opacity={0.8} />
    </svg>
  );
};

const Rocket: React.FC<{ t: number; W: number; H: number }> = ({ t, W, H }) => {
  const cx = W / 2, cy = H / 2;
  const lift = Math.sin(t * 2.2) * -12;
  const flames = [0, 1, 2].map((i) => 60 + 26 * Math.abs(Math.sin(t * 9 + i * 2)));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* motion streaks */}
      {[-120, -60, 60, 120].map((dx, i) => (
        <rect key={i} x={cx + dx - 6} y={cy - 200 + ((t * 300 + i * 90) % 420)} width={12} height={90} rx={6}
          fill={WHITE} opacity={0.14} />
      ))}
      <g transform={`translate(0 ${lift})`}>
        {/* fins */}
        <path d={`M ${cx - 70} ${cy + 60} L ${cx - 120} ${cy + 170} L ${cx - 40} ${cy + 140} Z`} fill={RED} />
        <path d={`M ${cx + 70} ${cy + 60} L ${cx + 120} ${cy + 170} L ${cx + 40} ${cy + 140} Z`} fill={RED} />
        {/* body */}
        <path d={`M ${cx} ${cy - 190} C ${cx + 78} ${cy - 110} ${cx + 72} ${cy + 20} ${cx + 70} ${cy + 130} L ${cx - 70} ${cy + 130} C ${cx - 72} ${cy + 20} ${cx - 78} ${cy - 110} ${cx} ${cy - 190} Z`}
          fill="#e8eaee" />
        <path d={`M ${cx} ${cy - 190} C ${cx + 78} ${cy - 110} ${cx + 72} ${cy + 20} ${cx + 70} ${cy + 130} L ${cx + 18} ${cy + 130} C ${cx + 20} ${cy + 20} ${cx + 22} ${cy - 110} ${cx} ${cy - 190} Z`}
          fill="#c6c9d2" opacity={0.7} />
        {/* window */}
        <circle cx={cx} cy={cy - 60} r={42} fill="#101014" stroke={RED} strokeWidth={6} />
        <circle cx={cx - 12} cy={cy - 74} r={12} fill={WHITE} opacity={0.85} />
        {/* flames */}
        {flames.map((h, i) => (
          <path key={i} d={`M ${cx - 34 + i * 34} ${cy + 132} Q ${cx - 17 + i * 34} ${cy + 132 + h} ${cx - 34 + i * 34} ${cy + 132} Q ${cx - 51 + i * 34} ${cy + 132 + h} ${cx - 34 + i * 34} ${cy + 132} Z`}
            fill={i === 1 ? "#ffb63d" : RED} opacity={0.9} />
        ))}
      </g>
    </svg>
  );
};
