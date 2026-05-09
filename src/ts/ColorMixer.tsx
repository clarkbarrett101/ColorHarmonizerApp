import { useCallback, useEffect, useState } from "react";
import { fCLARColorToString, tCLARColor, tPaint } from "./CLAcolor";
import { ColorWheel } from "./ColorWheel";
import { TintSelector } from "./TintSelector";
import { Dimensions, View } from "react-native";
import PanManager from "./PanManager";
import {
  RadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "./RadialContext";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { ColorChipFan } from "./ChipStack";
import { scheduleOnRN } from "react-native-worklets";
import UserContext, { eLayers, useUserContext } from "./UserContext";
import { eChipMap, eChipSizes } from "./PaintChip";
import { useVerse } from "./Verse";
import { useBucketContext } from "./BucketContext";
import { BGGradient } from "./BGGradient";
const clarColorsList: tPaint[] = require("./clarColors.json");

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
    Dimensions.get("window").height * 0.45,
  ],
}: tColorMixer) {
  /// O N  M O U N T ///

  const vSideA = useVerse(true);
  const vTargetColor = useVerse<tCLARColor>({
    c: 0.5,
    l: 0.5,
    ar: 0,
  });
  const vWheelRotation = useSharedValue(wheelCenter);
  const vChromaPanPos = useSharedValue({
    angle: chromaArcRotation[1] + chromaArcRotation[0] / 3,
    radius: radii[1],
  });
  const vLightnessPanPos = useSharedValue({
    angle: lightnessArcRotation[1],
    radius: radii[1],
  });
  const { registerBucket, unregisterBucket } = useBucketContext();

  useEffect(() => {
    registerBucket({
      origin: [
        Dimensions.get("window").width - eChipSizes.default[0] / 3,
        Dimensions.get("window").height / 2,
      ],
      radius: [radii[1], radii[1] + 75],
      callback: fOnDrop,
      statusTrigger: ["grabbed", "pushed"],
      id: "colorMixerBucket",
    });
    return () => {
      unregisterBucket("colorMixerBucket");
    };
  }, []);

  /// C L AR  C O L O R ///

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

  /// C A L L B A C K S ///

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

  const wUpdateState = useCallback(
    (pc?, pl?, par?) => {
      "worklet";
      const c = pc !== undefined ? pc : dC.value;
      const l = pl !== undefined ? pl : dL.value;
      const ar = par !== undefined ? par : dAR.value;
      scheduleOnRN(vTargetColor.dispatch, {
        c,
        l,
        ar,
      });
      scheduleOnRN(vSideA.dispatch, !vSideA.shared.value);
    },
    [dC, dL, dAR, vTargetColor, vSideA],
  );

  const fOnDrop = useCallback((paint: tPaint) => {
    console.log("Dropped paint", paint);
    const c = paint.clar.c;
    const l = paint.clar.l;
    let pAR = wDefaultAngleToChord(paint.clar.ar, 44 / 7, 24, 0);
    pAR = wDefaultChordToAngle(pAR, 44 / 7, 24, 0);
    vWheelRotation.value = pAR;
    let pL =
      lightnessArcRotation[1] -
      lightnessArcRotation[0] / 2 +
      lightnessArcRotation[0] * (1 - l);
    pL = wDefaultAngleToChord(
      pL,
      lightnessArcRotation[0],
      litDimensions[1],
      lightnessArcRotation[1],
    );
    pL = wDefaultChordToAngle(
      pL,
      lightnessArcRotation[0],
      litDimensions[1],
      lightnessArcRotation[1],
    );
    vLightnessPanPos.value = { angle: pL, radius: radii[1] };
    let pC =
      chromaArcRotation[1] -
      chromaArcRotation[0] / 2 +
      chromaArcRotation[0] * c;
    pC = wDefaultAngleToChord(
      pC,
      chromaArcRotation[0],
      chromaDimensions[1],
      chromaArcRotation[1],
    );
    pC = wDefaultChordToAngle(
      pC,
      chromaArcRotation[0],
      chromaDimensions[1],
      chromaArcRotation[1],
    );
    vChromaPanPos.value = { angle: pC, radius: radii[1] };
    wUpdateState(paint.clar.c, paint.clar.l, paint.clar.ar);
  }, []);

  /// R E N D E R ///

  return (
    <>
      <View
        style={{
          flex: 1,
          zIndex: 0,
        }}
      >
        <RadialContext
          value={{
            radii,

            origin,
            direction,
            wAngleToChord: wDefaultAngleToChord,
            wChordToAngle: wDefaultChordToAngle,
            dC,
            dL,
            dAR,
            wUpdateState,
          }}
        >
          <BGGradient />
          <PanManager>
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
            <ColorWheel
              radii={radii}
              rc={{ rings: 5, chords: 24 }}
              vRotationROffset={vWheelRotation}
              wheelCenter={wheelCenter}
            />
          </PanManager>
        </RadialContext>
      </View>
      <ColorChipFan
        targetColor={vTargetColor.state}
        targetNumber={9}
        origin={origin}
        size={"default"}
        rotationR={22 / 7}
        arcLength={13 / 7}
        radius={origin[0] * 0.8}
        direction={direction}
        firstIndex={0}
        sideA={vSideA.state}
        cSteps={chromaDimensions[1]}
        lSteps={litDimensions[1]}
        arSteps={24}
        groupLayer={eLayers.chipFan}
      />
    </>
  );
}
