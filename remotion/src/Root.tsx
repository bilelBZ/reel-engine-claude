import { Composition } from "remotion";
import { ShortVideo } from "./ShortVideo";
import { ShortVideoPropsSchema } from "./types";
import { FaresKinetic } from "./components/fares/FaresKinetic";
import { FaresKineticPropsSchema } from "./components/fares/types";
import { FaresWordByWord } from "./components/fares/FaresWordByWord";
import { FaresWordByWordPropsSchema } from "./components/fares/types";

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
        id="FaresKinetic"
        component={FaresKinetic}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={30 * 30}
        schema={FaresKineticPropsSchema}
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
        id="FaresWordByWord"
        component={FaresWordByWord}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={30 * 10}
        schema={FaresWordByWordPropsSchema}
        defaultProps={{
          clipSrc: "",
          lines: [],
          durationInSeconds: 10,
          darkGrade: 0.5,
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
