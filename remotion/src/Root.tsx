import { Composition } from "remotion";
import { ShortVideo } from "./ShortVideo";
import { ShortVideoPropsSchema } from "./types";
import { ArabicKinetic } from "./components/arabic/ArabicKinetic";
import { ArabicKineticPropsSchema } from "./components/arabic/types";
import { ScriptCards } from "./components/script/ScriptCards";
import { ScriptCardsPropsSchema } from "./components/script/types";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ShortVideo"
        component={ShortVideo}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={30 * 30}
        schema={ShortVideoPropsSchema}
        defaultProps={{
          clipSrc: "",
          sourceWidth: 1920,
          sourceHeight: 1080,
          crop: { x: 0, y: 0, w: 607, h: 1080 },
          cropKeyframes: [],
          captions: [],
          captionStyle: "bold" as const,
          hookLine1: "",
          hookLine2: "",
          showProgressBar: true,
          durationInSeconds: 30,
          ctaText: "",
          badgeText: "",
          badgeAtSec: 0,
          teaserEndSec: 0,
        }}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: Math.ceil(props.durationInSeconds * 30),
            fps: 30,
            width: 1080,
            height: 1920,
          };
        }}
      />
      <Composition
        id="ArabicKinetic"
        component={ArabicKinetic}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={30 * 30}
        schema={ArabicKineticPropsSchema}
        defaultProps={{
          script: [],
          durationInSeconds: 30,
          audioSrc: "",
        }}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: Math.ceil(props.durationInSeconds * 30),
            fps: 30,
            width: 1080,
            height: 1920,
          };
        }}
      />
      <Composition
        id="ScriptCards"
        component={ScriptCards}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={30 * 30}
        schema={ScriptCardsPropsSchema}
        defaultProps={{
          script: [],
          durationInSeconds: 30,
          brand: "SAY IT SAVE IT",
          audioSrc: "",
        }}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: Math.ceil(props.durationInSeconds * 30),
            fps: 30,
            width: 1080,
            height: 1920,
          };
        }}
      />
    </>
  );
};
