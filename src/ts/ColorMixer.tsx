import { Dimensions } from "react-native";
import {
  fCLARColorToRGB,
  fClosestColors,
  fGetRandomPaint,
  refColors,
  tBrand,
  tCLARColor,
  tColorMap,
  tPaint,
} from "./CLAcolor";
import {
  RadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "./RadialContext";
import { RadialGraphic } from "./RadialGraphic";
import { useVerse } from "./Verse";
import { fMakePetalPath } from "./Sector";
import { tAttributeMap, tAttributeModifier } from "./Actor";
import { ChipFan } from "./ChipStack";
import { useEffect, useMemo, useRef, useState } from "react";
import { eLayers } from "./UserContext";
import { tRadialObject, tSectorGroup } from "./sectorTypes";
import { useBucketContext } from "./BucketContext";
import { eChipSizes, PaintChip } from "./PaintChip";
import {
  withTiming,
  useSharedValue,
  useDerivedValue,
} from "react-native-reanimated";
import BrandFilter from "./BrandFilter";
import PanManager from "./PanManager";
import { rotateZ, translate } from "@shopify/react-native-skia";
import { transform } from "@babel/core";
import { ColorWheel } from "./ColorWheel";

export function ColorMixer({
  radii = [0, 450],
  ring = 5,
  chord = 6,
  arcLength = 10 / 7,
  rotationR = 22 / 7,
}: tRadialObject) {
  const origin: [number, number] = [
    Dimensions.get("window").width / 2,
    Dimensions.get("window").height * 0.45,
  ];
  const colorIndexes = {
    0: "red",
    1: "yellow",
    2: "blue",
    3: "white",
    4: "grey",
    5: "black",
  };
  const [brand, setBrand] = useState<tBrand>(null);
  const randomPaint = useMemo(() => fGetRandomPaint(), []);
  const vTargetColor = useVerse<tPaint>(randomPaint);
  function colorMaptoArray(colorMap: tColorMap<tPaint>): tPaint[] {
    const arg = Array(6);
    for (let i = 0; i < 6; i++) {
      const colorKey = colorIndexes[i];
      arg[i] = colorMap[colorKey] || vTargetColor.state;
    }
    return arg;
  }
  const paints = useRef<tPaint[]>(
    colorMaptoArray(fClosestColors(vTargetColor.state)),
  );
  const [sideA, setSideA] = useState(true);
  const rotationAnim = useSharedValue(0);
  useEffect(() => {
    rotationAnim.value = withTiming(1, { duration: 500 });
  }, []);
  useEffect(() => {
    paints.current = colorMaptoArray(fClosestColors(vTargetColor.state));

    sideA ? setSideA(false) : setSideA(true);
    rotationAnim.value = 0;
    rotationAnim.value = withTiming(1, { duration: 500 });
  }, [vTargetColor.state]);
  const fSectorGroupModifier = (sectorGroup: tSectorGroup) => {
    return {
      ...sectorGroup,
      zIndex: eLayers.colorMixer,
    };
  };

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
  function fLerp(a: number, b: number, t: number): number {
    "worklet";
    return a * (1 - t) + b * t;
  }
  const mTransformModifier: tAttributeModifier = {
    modID: 0,
    deps: [rotationAnim],
    modifier: (input: tAttributeMap) => {
      "worklet";
      return {
        ...input,
        rotateZ: fLerp(11 / 7, input.rotateZ, rotationAnim.value),
        translateX: input.translateX + 50,
      };
    },
  };
  const mColorModifier: tAttributeModifier = {
    modID: 1,
    deps: [vTargetColor.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let color = refColors[colorIndexes[chord - input.chord - 1]];
      color = colorLerp(
        vTargetColor.shared.value.clar,
        color,
        input.ring / ring,
      );
      const [r, g, b] = fCLARColorToRGB(color);
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
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
      radii: [radii[1] * 0.2, radii[1] * 0.3],
      rotationR: -11 / 7,
      callback: (paint) => {
        vTargetColor.dispatch(paint);
      },
      targetLayerRange: [eLayers.chipFan - 10, eLayers.chipHand + 100],
      id: "colorMixerBucket",
    });
    return () => {
      unregisterBucket("colorMixerBucket");
    };
  }, []);
  const dC = useDerivedValue(() => vTargetColor.shared.value.clar.c);
  const dL = useDerivedValue(() => vTargetColor.shared.value.clar.l);
  const dAR = useDerivedValue(() => vTargetColor.shared.value.clar.ar);
  return (
    <>
      <PanManager drawSectors={true}>
        <RadialContext
          value={{
            origin,
            radii: [0, 200],
            mainRotationR: rotationR,
            totalArcLength: 3 / 7,
            dAR,
            dC,
            dL,
          }}
        >
          <BrandFilter
            brand={brand}
            setBrand={setBrand}
            height={50}
            width={(50 * (1 + Math.sqrt(5))) / 2}
          />
        </RadialContext>
      </PanManager>
    </>
  );
}
/*
   <RadialContext
        value={{
          origin,
          radii,
          direction: -1,
          mColorModifier,
          wAngleToChord: wDefaultAngleToChord,
          wChordToAngle: wDefaultChordToAngle,
          fPathFunction: fMakePetalPath,
          mTransformModifier,
        }}
      >
        <RadialGraphic
          ring={ring}
          chord={chord}
          arcLength={arcLength}
          rotationR={rotationR}
          fSectorGroupModifier={fSectorGroupModifier}
        />
      </RadialContext>
      <PaintChip
        paintA={vTargetColor.state}
        origin={{
          x: Dimensions.get("window").width - eChipSizes.grabbed[0] * 0.7,
          y: Dimensions.get("window").height / 2 - eChipSizes.grabbed[1],
        }}
        size="grabbed"
        chipID={[eLayers.chipFan - 25, 12]}
        startRotation={11 / 7}
      />
      <ChipFan
        paintsA={Object.values(paints.current)}
        paintsB={Object.values(paints.current)}
        origin={origin}
        sideA={true}
        arcLength={arcLength}
        rotationR={rotationR + 0.02}
        radius={radii[1] * 0.75}
        groupLayer={eLayers.chipFan}
      />
      */
