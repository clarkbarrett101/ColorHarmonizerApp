import { Dimensions } from "react-native";
import { fCLARColorToString, tCLARColor, tPaint } from "./CLAcolor";
import {
  RadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "./RadialContext";
import { RadialGraphic } from "./RadialGraphic";
import { useVerse } from "./Verse";
import { fMakePetalPath } from "./Sector";
import { tAttributeMap, tAttributeModifier } from "./Actor";
import {
  ChipFan,
  ColorChipFan,
  fClosestColors,
  tClosestColors,
} from "./ChipStack";
import { use, useEffect, useRef } from "react";
import { eLayers, useUserContext } from "./UserContext";
import { tSectorGroup } from "./sectorTypes";
import { useBucketContext } from "./BucketContext";
import { Paint } from "@shopify/react-native-skia";
import { eChipSizes, PaintChip } from "./PaintChip";
const clarColorsList: tPaint[] = require("./clarColors.json");
export type tColorMixer = {
  radii?: [number, number];
  rc?: { rings: number; chords: number };
  arcLength?: number;
  rotationR?: number;
};
export function ColorMixer({
  radii = [0, 450],
  rc = { rings: 5, chords: 6 },
  arcLength = 10 / 7,
  rotationR = 22 / 7,
}: tColorMixer) {
  const vTargetColor = useVerse<tPaint>(clarColorsList[500]);
  const paints = useRef<tPaint[]>(fClosestColors(vTargetColor.state));

  useEffect(() => {
    paints.current = fClosestColors(vTargetColor.state);
    console.log(
      "Updated closest colors:",
      paints.current.reduce(
        (acc, paint, index) => {
          acc[paint.name] = index;
          return acc;
        },
        {} as Record<string, number>,
      ),
    );
  }, [vTargetColor.state]);
  const fSectorGroupModifier = (sectorGroup: tSectorGroup) => {
    return {
      ...sectorGroup,
      zIndex: eLayers.colorMixer,
    };
  };
  const origin: [number, number] = [
    Dimensions.get("window").width + radii[1] * 0.1,
    Dimensions.get("window").height * 0.45,
  ];
  //YUV Yellow = .88,-.44,.1 Red = .3,-.15,.6 Blue = .11,.44,-.1
  const clarRed: tCLARColor = { c: 0.9, l: 0.6, ar: Math.atan2(0.6, -0.15) };
  const clarYellow: tCLARColor = { c: 0.9, l: 0.8, ar: Math.atan2(0.1, -0.44) };
  const clarBlue: tCLARColor = { c: 0.9, l: 0.6, ar: Math.atan2(-0.1, 0.44) };
  const clarWhite: tCLARColor = { c: 0, l: 1, ar: 0 };
  const clarBlack: tCLARColor = { c: 0, l: 0, ar: 0 };
  const clarGrey: tCLARColor = { c: 0, l: 0.5, ar: 0 };
  const colors = [
    clarGrey,
    clarBlack,
    clarWhite,
    clarBlue,
    clarYellow,
    clarRed,
  ];
  function colorLerp(
    colorA: tCLARColor,
    colorB: tCLARColor,
    t: number,
  ): tCLARColor {
    "worklet";
    const c = colorA.c + (colorB.c - colorA.c) * t;
    const l = colorA.l + (colorB.l - colorA.l) * t;
    const ar = colorA.ar + (colorB.ar - colorA.ar) * t;
    return { c, l, ar };
  }
  function wGetColor(src: { rings: number; chords: number }) {
    "worklet";
    const { rings, chords } = src;
    let color = colors[chords];
    color = colorLerp(vTargetColor.shared.value.clar, color, rings / rc.rings);
    return fCLARColorToString(color);
  }
  const wTransformMatrix: tAttributeModifier = {
    modID: 0,
    deps: [],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const z = eLayers.chipFan + input.chord * 2 + 1;
      console.log(
        "Modifying sectorGroup with chord",
        input.chord,
        "to have zIndex",
        z,
      );
      return {
        ...input,
        translateX: input.translateX + 50,
        zIndex: z,
      };
    },
  };
  const { registerBucket, unregisterBucket } = useBucketContext();
  useEffect(() => {
    registerBucket({
      origin: [
        Dimensions.get("window").width - 100,
        Dimensions.get("window").height / 2,
      ],
      radius: [radii[1] - 75, radii[1]],
      callback: (paint) => {
        vTargetColor.dispatch(paint);
      },
      targetLayer: eLayers.chipHand,
      id: "colorMixerBucket",
    });
    return () => {
      unregisterBucket("colorMixerBucket");
    };
  }, []);
  const chipModifier: tAttributeModifier = {
    modID: 30,
    deps: [],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const z =
        eLayers.chipFan + (rc.chords - (input.id - eLayers.chipFan)) * 2;
      return {
        ...input,
        zIndex: z,
      };
    },
  };
  const { registerModifier, unregisterModifier } = useUserContext();
  useEffect(() => {
    const id = registerModifier(chipModifier);
    return () => {
      unregisterModifier(id);
    };
  }, [chipModifier]);
  return (
    <>
      <RadialContext
        value={{
          origin,
          radii,
          wGetColor,
          wAngleToChord: wDefaultAngleToChord,
          wChordToAngle: wDefaultChordToAngle,
          fPathFunction: fMakePetalPath,
          transformModifier: wTransformMatrix,
        }}
      >
        <RadialGraphic
          rc={rc}
          arcLength={arcLength}
          rotationR={rotationR}
          fSectorGroupModifier={fSectorGroupModifier}
        />
      </RadialContext>
      <PaintChip
        paintA={vTargetColor.state}
        origin={{
          x: Dimensions.get("window").width - eChipSizes.grabbed[0] * 0.7,
          y: Dimensions.get("window").height * 0.4,
        }}
        size="grabbed"
        chipID={[eLayers.chipHand, 12]}
        startRotation={6 / 7}
      />
      <ChipFan
        paintsA={paints.current}
        origin={origin}
        sideA={true}
        arcLength={arcLength}
        rotationR={rotationR + 0.02}
        radius={radii[1] * 0.75}
        groupLayer={eLayers.chipFan}
      />
    </>
  );
}
