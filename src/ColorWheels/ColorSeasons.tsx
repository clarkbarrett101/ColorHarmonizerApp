import { Dimensions, View } from "react-native";
import {
  fCLARColorToRGB,
  fClosestColors,
  fColorLerp,
  fGetRandomPaint,
  fGetSeasonColors,
  refColors,
  tBrand,
  tCLARColor,
  tColorMap,
  tPaint,
  tSeasonMap,
} from "../utils/CLAcolor";
import {
  RadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "../Radials/RadialContext";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { useVerse } from "../utils/Verse";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { ChipFan } from "../Chips/ChipStack";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tRadialObject, tSectorGroup } from "../Radials/SectorTypes";
import { useBucketContext } from "../Buckets/BucketContext";
import { eChipSizes, PaintChip } from "../Chips/PaintChip";
import {
  withTiming,
  useSharedValue,
  useDerivedValue,
} from "react-native-reanimated";
import { BrandFilter } from "../ColorWheels/BrandFilter";
import { BGGradient } from "../ColorWheels/BGGradient";

export function ColorSeasons({
  radii = [0, 375],
  ring = 5,
  chord = 4,
  arcLength = 11 / 7,
  rotationR = 22 / 7,
}: tRadialObject) {
  const origin: [number, number] = [
    Dimensions.get("window").width,
    Dimensions.get("window").height * 0.45,
  ];
  const colors: tCLARColor[] = [
    { c: 0.8, l: 0.8, ar: 6 / 7 },
    { c: 0.2, l: 0.8, ar: 33 / 7 },
    { c: 0.2, l: 0.2, ar: 6 / 7 },
    { c: 0.6, l: 0.1, ar: 33 / 7 },
  ];

  const [brand, setBrand] = useState<tBrand>("All Brands");
  const randomPaint = useMemo(() => fGetRandomPaint(), []);
  const vTargetColor = useVerse<tPaint>(randomPaint);
  function colorMaptoArray(colorMap: tSeasonMap<tPaint>): tPaint[] {
    const arg = Array(4);
    const colorIndexes = ["spring", "summer", "autumn", "winter"];
    for (let i = 0; i < 4; i++) {
      const colorKey = colorIndexes[i];
      arg[i] = colorMap[colorKey];
    }
    arg.reverse();
    console.log(
      "Color map to array",
      arg.map((c) => c.name),
    );
    return arg;
  }
  const paints = useRef<tPaint[]>(
    colorMaptoArray(fGetSeasonColors(vTargetColor.state.clar, brand)),
  );
  const [sideA, setSideA] = useState(true);
  const rotationAnim = useSharedValue(0);
  useEffect(() => {
    rotationAnim.value = withTiming(1, { duration: 500 });
  }, []);
  useEffect(() => {
    paints.current = colorMaptoArray(
      fGetSeasonColors(vTargetColor.state.clar, brand),
    );

    sideA ? setSideA(false) : setSideA(true);
    rotationAnim.value = 0;
    rotationAnim.value = withTiming(1, { duration: 500 });
  }, [vTargetColor.state, brand]);
  const fSectorGroupModifier = (sectorGroup: tSectorGroup) => {
    return {
      ...sectorGroup,
      zIndex: eLayers.colorMixer,
    };
  };

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
        rotateZ: fLerp(22 / 7, input.rotateZ, rotationAnim.value),
        translateY:
          input.translateY + (0.5 - (input.chord + 0.5) / (chord - 1)) * 50,
        translateX: input.translateX + 50,
      };
    },
  };
  const mColorModifier: tAttributeModifier = {
    modID: 1,
    deps: [vTargetColor.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let color = colors[chord - input.chord - 1];
      color = fColorLerp(
        vTargetColor.shared.value.clar,
        color,
        (input.ring + 0.5) / ring,
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

  const { registerModifier, unregisterModifier } = useUserContext();
  const chipMod: tAttributeModifier = {
    modID: 30,
    deps: [rotationAnim],
    modifier: (input: tAttributeMap) => {
      "worklet";
      if (input.id > eLayers.chipFan + 50 || input.id < eLayers.chipFan) {
        return input;
      }
      const index = input.id - eLayers.chipFan;

      return {
        ...input,
        translateY: input.translateY + (0.5 - (index + 0.5) / (chord - 1)) * 50,
      };
    },
  };

  const { registerBucket, unregisterBucket } = useBucketContext();
  useEffect(() => {
    registerModifier(chipMod);
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
      id: 20,
    });
    return () => {
      unregisterBucket("" + 20);
      unregisterModifier(chipMod.modID);
    };
  }, []);
  const dC = useDerivedValue(() => vTargetColor.shared.value.clar.c);
  const dL = useDerivedValue(() => vTargetColor.shared.value.clar.l);
  const dAR = useDerivedValue(() => vTargetColor.shared.value.clar.ar);
  return (
    <>
      <RadialContext
        value={{
          origin,
          radii,
          mColorModifier,
          mTransformModifier,
          dAR,
          dC,
          dL,
        }}
      >
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 0,
          }}
        >
          <BGGradient />
        </View>
        <View
          style={{
            position: "absolute",
            shadowColor: "black",
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
          }}
        >
          <RadialGraphic
            ring={ring}
            chord={chord}
            arcLength={arcLength}
            rotationR={rotationR}
            fSectorGroupModifier={fSectorGroupModifier}
          />
        </View>
      </RadialContext>
      <PaintChip
        paintA={vTargetColor.state}
        origin={[origin[0] - eChipSizes.default[0] / 4, origin[1]]}
        size="grabbed"
        chipID={[eLayers.chipFan - 25, 12]}
        rotationR={11 / 7}
      />
      <ChipFan
        paintsA={paints.current}
        paintsB={paints.current}
        origin={origin}
        sideA={sideA}
        arcLength={arcLength}
        rotationR={rotationR + 0.02}
        radius={radii[1] * 0.75}
        groupLayer={eLayers.chipFan}
      />
      <BrandFilter
        brand={brand}
        setBrand={setBrand}
        height={50}
        width={(50 * (1 + Math.sqrt(5))) / 2}
        dAR={dAR}
        dC={dC}
        dL={dL}
        origin={[origin[0] - radii[1] * 0.1, origin[1] + 200]}
        mainRotationR={11 / 7}
        totalArcLength={3 / 7}
      />
    </>
  );
}
