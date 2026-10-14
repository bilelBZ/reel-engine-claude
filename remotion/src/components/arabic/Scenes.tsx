import { ARABIC_THEME as T } from "./arabicTheme";
import type { ArabicScene } from "./types";
import { KineticLine } from "./KineticText";
import { Sparkles, SpeedLines } from "./Particles";
import {
  Eye,
  RobotHead,
  StarburstBadge,
  OrbitWord,
  IconTiles,
  EditorMock,
  CardArt,
  DiamondQuestion,
  CommentBox,
  OrangeBar,
  GoldArrow,
} from "./graphics";

interface SceneProps {
  scene: ArabicScene;
}

/* ---------------------------------------------------------------- */
/* starburst — jagged red burst + glowing white hook text            */
/* ---------------------------------------------------------------- */
const StarburstScene: React.FC<SceneProps> = ({ scene }) => (
  <>
    <SpeedLines y={850} bandH={500} count={6} seed={31} />
    <StarburstBadge x={540} y={850} size={640} />
    <KineticLine text={scene.lines[0] ?? ""} size={150} color="white" y={850} delaySec={0.15} />
    {scene.lines[1] ? (
      <KineticLine text={scene.lines[1]} size={96} color="gold" y={1250} delaySec={0.5} />
    ) : null}
    <Sparkles count={26} seed={101} />
  </>
);

/* ---------------------------------------------------------------- */
/* ai-orbit — robot + giant word with orbiting ring + icon tiles     */
/* ---------------------------------------------------------------- */
const AiOrbitScene: React.FC<SceneProps> = ({ scene }) => (
  <>
    {scene.robot ? <RobotHead x={540} y={360} size={215} /> : null}
    <KineticLine text={scene.lines[0] ?? ""} size={95} color="white" y={scene.robot ? 560 : 380} delaySec={0.1} />
    <OrbitWord word={scene.word || "AI"} size={300} x={540} y={1000} />
    <IconTiles icons={scene.icons} layout="scatter" x={540} y={1000} tile={126} />
    {scene.lines[1] ? (
      <KineticLine text={scene.lines[1]} size={115} color="gold" y={1420} delaySec={0.45} />
    ) : null}
    <Sparkles count={22} seed={102} />
  </>
);

/* ---------------------------------------------------------------- */
/* editor — top line + video-editor window mockup + bottom line      */
/* ---------------------------------------------------------------- */
const EditorScene: React.FC<SceneProps> = ({ scene }) => (
  <>
    <KineticLine text={scene.lines[0] ?? ""} size={110} color="gold" y={400} delaySec={0.1} />
    <EditorMock x={540} y={1010} w={850} h={610} art={scene.cards[0] ?? "sunset"} />
    {scene.lines[1] ? (
      <KineticLine text={scene.lines[1]} size={92} color="white" y={1540} delaySec={0.5} />
    ) : null}
    <Sparkles count={18} seed={103} />
  </>
);

/* ---------------------------------------------------------------- */
/* eye — top line + animated eye with rings & speed lines + line     */
/* ---------------------------------------------------------------- */
const EyeScene: React.FC<SceneProps> = ({ scene }) => (
  <>
    <SpeedLines y={950} bandH={800} count={9} seed={33} />
    <KineticLine text={scene.lines[0] ?? ""} size={105} color="gold" y={400} delaySec={0.1} />
    <Eye size={580} x={540} y={950} />
    {scene.lines[1] ? (
      <KineticLine text={scene.lines[1]} size={105} color="white" y={1470} delaySec={0.45} />
    ) : null}
    <Sparkles count={20} seed={104} />
  </>
);

/* ---------------------------------------------------------------- */
/* title-cards — big gold title + small line + art cards + arrow     */
/* ---------------------------------------------------------------- */
const TitleCardsScene: React.FC<SceneProps> = ({ scene }) => {
  const cards = scene.cards.length ? scene.cards.slice(0, 2) : ["sunset", "city"];
  const cardW = 470;
  const cardH = 280;
  const gap = 36;
  const totalW = cards.length * cardW + (cards.length - 1) * gap;
  return (
    <>
      <SpeedLines y={700} bandH={420} count={6} seed={34} />
      <KineticLine text={scene.lines[0] ?? ""} size={175} color="gold" y={470} delaySec={0.1} />
      {scene.lines[1] ? (
        <KineticLine text={scene.lines[1]} size={105} color="white" y={730} delaySec={0.4} />
      ) : null}
      {scene.arrow ? <GoldArrow x={790} y={890} w={150} /> : null}
      <div
        style={{
          position: "absolute",
          left: 540 - totalW / 2,
          top: 1080 - cardH / 2,
          display: "flex",
          gap,
          pointerEvents: "none",
        }}
      >
        {cards.map((c, i) => (
          <div
            key={i}
            style={{
              width: cardW,
              height: cardH,
              borderRadius: 26,
              overflow: "hidden",
              border: "2px solid #3A2A20",
              boxShadow: "0 16px 50px rgba(0,0,0,0.55), 0 0 24px rgba(255,140,30,0.25)",
            }}
          >
            <CardArt name={c} />
          </div>
        ))}
      </div>
      <Sparkles count={18} seed={105} />
    </>
  );
};

/* ---------------------------------------------------------------- */
/* card-grid — top line + 2x2 art grid + big gold word + sparkles    */
/* ---------------------------------------------------------------- */
const CardGridScene: React.FC<SceneProps> = ({ scene }) => {
  const cards = (scene.cards.length ? scene.cards : ["sunset", "city", "waveform", "equalizer"]).slice(0, 4);
  const cardW = 460;
  const cardH = 270;
  const gap = 30;
  return (
    <>
      <KineticLine text={scene.lines[0] ?? ""} size={105} color="white" y={390} delaySec={0.1} />
      <div
        style={{
          position: "absolute",
          left: 540 - (cardW * 2 + gap) / 2,
          top: 950 - (cardH * 2 + gap) / 2,
          display: "grid",
          gridTemplateColumns: `${cardW}px ${cardW}px`,
          gap,
          pointerEvents: "none",
        }}
      >
        {cards.map((c, i) => (
          <div
            key={i}
            style={{
              width: cardW,
              height: cardH,
              borderRadius: 26,
              overflow: "hidden",
              border: "2px solid #3A2A20",
              boxShadow: "0 16px 50px rgba(0,0,0,0.55)",
            }}
          >
            <CardArt name={c} />
          </div>
        ))}
      </div>
      {scene.bigWord ? (
        <KineticLine text={scene.bigWord} size={160} color="gold" y={1490} delaySec={0.5} />
      ) : null}
      <Sparkles count={30} seed={106} />
    </>
  );
};

/* ---------------------------------------------------------------- */
/* robot-bar — robot head + icon row + orange bar + lines            */
/* ---------------------------------------------------------------- */
const RobotBarScene: React.FC<SceneProps> = ({ scene }) => (
  <>
    <KineticLine text={scene.lines[0] ?? ""} size={105} color="white" y={390} delaySec={0.1} />
    <RobotHead x={540} y={640} size={225} />
    <IconTiles icons={scene.icons} layout="row" x={540} y={1005} tile={128} />
    <OrangeBar x={540} y={1145} w={790} />
    {scene.lines[1] ? (
      <KineticLine text={scene.lines[1]} size={122} color="gold" y={1360} delaySec={0.5} />
    ) : null}
    <Sparkles count={20} seed={107} />
  </>
);

/* ---------------------------------------------------------------- */
/* question — top line + diamond-pixel "?" + bottom line            */
/* ---------------------------------------------------------------- */
const QuestionScene: React.FC<SceneProps> = ({ scene }) => (
  <>
    <KineticLine text={scene.lines[0] ?? ""} size={105} color="white" y={370} delaySec={0.1} />
    {scene.lines[1] ? (
      <KineticLine text={scene.lines[1]} size={100} color="gold" y={600} delaySec={0.3} />
    ) : null}
    <DiamondQuestion symbol={scene.word || "؟"} size={520} x={540} y={1020} />
    {scene.lines[2] ? (
      <KineticLine text={scene.lines[2]} size={115} color="gold" y={1520} delaySec={0.55} />
    ) : null}
    <Sparkles count={26} seed={108} />
  </>
);

/* ---------------------------------------------------------------- */
/* cta — line + giant word + line + comment box + final lines       */
/* ---------------------------------------------------------------- */
const CtaScene: React.FC<SceneProps> = ({ scene }) => (
  <>
    <KineticLine text={scene.lines[0] ?? ""} size={115} color="white" y={330} delaySec={0.05} />
    <OrbitWord word={scene.word || "AI"} size={250} x={540} y={770} seed={12} />
    {scene.lines[1] ? (
      <KineticLine text={scene.lines[1]} size={115} color="gold" y={1075} delaySec={0.4} />
    ) : null}
    <CommentBox x={540} y={1300} w={770} placeholder={scene.commentPlaceholder} typed={scene.comment} />
    {scene.lines[2] ? (
      <KineticLine text={scene.lines[2]} size={105} color="white" y={1530} delaySec={0.65} />
    ) : null}
    {scene.lines[3] ? (
      <KineticLine text={scene.lines[3]} size={105} color="gold" y={1680} delaySec={0.8} />
    ) : null}
    <Sparkles count={30} seed={109} />
  </>
);

/* ---------------------------------------------------------------- */
/* Dispatcher                                                        */
/* ---------------------------------------------------------------- */

export const ArabicSceneRenderer: React.FC<SceneProps> = ({ scene }) => {
  switch (scene.type) {
    case "starburst":
      return <StarburstScene scene={scene} />;
    case "ai-orbit":
      return <AiOrbitScene scene={scene} />;
    case "editor":
      return <EditorScene scene={scene} />;
    case "eye":
      return <EyeScene scene={scene} />;
    case "title-cards":
      return <TitleCardsScene scene={scene} />;
    case "card-grid":
      return <CardGridScene scene={scene} />;
    case "robot-bar":
      return <RobotBarScene scene={scene} />;
    case "question":
      return <QuestionScene scene={scene} />;
    case "cta":
      return <CtaScene scene={scene} />;
    default:
      return null;
  }
};
