import { use, useCallback, useEffect, useMemo, useState } from "react";
import { fCLARColorToString, tCLARColor } from "./CLAcolor";
import { ColorWheel } from "./ColorWheel";
import { TintSelector } from "./TintSelector";
import { Dimensions, View } from "react-native";
import PanManager, { usePanManager } from "./PanManager";
import {
  RadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "./RadialContext";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { ColorChipFan } from "./ChipStack";
import { runOnJS } from "react-native-worklets";

type tColorMixer = {
  wheelCenter?: number;
  radii?: [number, number];
  arcLength?: number;
  direction?: 1 | -1;
  litDimensions?: [number, number];
  litRange?: [number, number];
  chromaRange?: [number, number];
  chromaDimensions?: [number, number];
  chromaArcRotation?: [number, number];
  lightnessArcRotation?: [number, number];
  origin?: [number, number];
};
export default function ColorMixer({
  wheelCenter = 22 / 7,
  radii = [50, 250],
  direction = -1,
  litDimensions = [4, 5],
  litRange = [0.15, 1],
  chromaRange = [0.1, 0.8],
  chromaDimensions = [4, 4],
  chromaArcRotation = [4.4 / 7, 16 / 7],
  lightnessArcRotation = [5.5 / 7, 28 / 7],
  origin = [
    Dimensions.get("window").width + radii[1] * 0.3,
    Dimensions.get("window").height / 2,
  ],
}: tColorMixer) {
  const vWheelRotation = useSharedValue(wheelCenter);
  const vChromaPanPos = useSharedValue({
    angle: chromaArcRotation[1] + chromaArcRotation[0] / 3,
    radius: radii[1],
  });
  const vLightnessPanPos = useSharedValue({
    angle: lightnessArcRotation[1],
    radius: radii[1],
  });
  const dC = useDerivedValue(() => {
    let c =
      (vChromaPanPos.value.angle -
        chromaArcRotation[1] +
        chromaArcRotation[0] / 2) /
      chromaArcRotation[0];
    c = (c - 0.5 / chromaDimensions[1]) / (1 - 1 / chromaDimensions[1]);
    c = chromaRange[0] + c * (chromaRange[1] - chromaRange[0]);
    c = Math.round(c * 100) / 100;
    return c;
  });
  const dL = useDerivedValue(() => {
    let l =
      1 -
      (vLightnessPanPos.value.angle -
        lightnessArcRotation[1] +
        lightnessArcRotation[0] / 2) /
        lightnessArcRotation[0];
    l = (l - 0.5 / litDimensions[1]) / (1 - 1 / litDimensions[1]);
    l = litRange[0] + l * (litRange[1] - litRange[0]);
    l = Math.round(l * 100) / 100;
    return l;
  });
  const dAR = useDerivedValue(() => {
    let ar = ((vWheelRotation.value % (44 / 7)) + 44 / 7) % (44 / 7);
    ar = Math.round(ar * 100) / 100;
    return ar;
  });
  const wGetChromaColor = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      const _ = vChromaPanPos.value;
      let chord = src.chords / (chromaDimensions[1] - 1);
      let r = src.rings / (chromaDimensions[0] - 1);
      let c = chromaRange[0] + chord * (chromaRange[1] - chromaRange[0]);
      r = 0.5 + r * 0.5;
      c *= r;
      const l = dL.value * r;
      const ar = dAR.value;

      return fCLARColorToString({
        c,
        l: l,
        ar: ar,
      });
    },
    [chromaDimensions, chromaRange],
  );
  const wGetLightnessColor = useCallback(
    (src: { rings: number; chords: number }) => {
      "worklet";
      const _ = vLightnessPanPos.value;
      let l = 1 - (src.chords + 0.5) / (litDimensions[1] - 1);
      l = litRange[0] + l * (litRange[1] - litRange[0]);
      let r = src.rings / (litDimensions[0] - 1);
      l *= r * 0.25 + 0.75;
      r = 0.5 + r * 0.5;
      return fCLARColorToString({
        c: dC.value * r,
        l,
        ar: dAR.value,
      });
    },
    [dC, dAR],
  );
  const [targetColor, setTargetColor] = useState<tCLARColor>({
    c: 0.5,
    l: 0.5,
    ar: 0,
  });
  const [collapsed, setCollapsed] = useState(false);

  const fUpdateState = () => {
    "worklet";
    const c = dC.value;
    const l = dL.value;
    const ar = dAR.value;
    runOnJS(setTargetColor)({
      c,
      l,
      ar,
    });
  };
  return (
    <>
      <RadialContext
        value={{
          radii,
          //origin: [dimensions.width + radii[1] * 0.3, dimensions.height / 2],
          origin,
          direction,
          wAngleToChord: wDefaultAngleToChord,
          wChordToAngle: wDefaultChordToAngle,
          dC,
          dL,
          dAR,
          fUpdateState,
          collapsed: collapsed,
          setCollapsed,
        }}
      >
        <PanManager>
          <View style={{ flex: 1, zIndex: 1 }}>
            <TintSelector
              key={`Lightness Selector`}
              arcLength={lightnessArcRotation[0]}
              rotationR={lightnessArcRotation[1]}
              rc={{ rings: litDimensions[0], chords: litDimensions[1] }}
              radii={[radii[1] - 50, radii[1] + 75]}
              vPanPos={vLightnessPanPos}
              wGetColor={wGetLightnessColor}
            />
            <TintSelector
              key={`Chroma Selector`}
              arcLength={chromaArcRotation[0]}
              rotationR={chromaArcRotation[1]}
              rc={{ rings: chromaDimensions[0], chords: chromaDimensions[1] }}
              radii={[radii[1] - 50, radii[1] + 75]}
              vPanPos={vChromaPanPos}
              wGetColor={wGetChromaColor}
            />
          </View>
          <ColorWheel
            radii={radii}
            rc={{ rings: 5, chords: 24 }}
            vRotationROffset={vWheelRotation}
            wheelCenter={wheelCenter}
          />
        </PanManager>
      </RadialContext>
      <ColorChipFan
        targetColor={targetColor}
        targetNumber={9}
        origin={origin}
        size={[150, 90]}
        rotationR={22 / 7}
        arcLength={11 / 7}
        radius={origin[0] * 0.8}
        direction={direction}
        collapsed={collapsed}
        firstIndex={1}
      />
    </>
  );
}
