import { Dimensions, View } from "react-native";
import {
  fCLARColorToRGB,
  fClosestColors,
  fColorLerp,
  fGetRandomPaint,
  refColors,
  tBrand,
  tCLARColor,
  tColorMap,
  tPaint,
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
import { BrandFilter } from "./BrandFilter";
import { BGGradient } from "./BGGradient";

export function ColorMixer({
  radii = [0, 400],
  ring = 5,
  chord = 6,
  arcLength = 13 / 7,
  rotationR = 22 / 7,
}: tRadialObject) {
  const origin: [number, number] = [
    Dimensions.get("window").width,
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
  const colors = { ...refColors };
  const [brand, setBrand] = useState<tBrand>("All Brands");
  const randomPaint = useMemo(() => fGetRandomPaint(), []);
  const vTargetColor = useVerse<tPaint>(randomPaint);
  function colorMaptoArray(colorMap: tColorMap<tPaint>): tPaint[] {
    const arg = Array(6);
    for (let i = 0; i < 6; i++) {
      const colorKey = colorIndexes[i];
      arg[i] = colorMap[colorKey];
      console.log("Color map to array", colorMap[colorKey].name, colorKey);
    }
    arg.reverse();
    console.log(
      "Color map to array",
      arg.map((c) => c.name),
    );
    return arg;
  }
  const paintsA = useRef<tPaint[]>(
    colorMaptoArray(fClosestColors(vTargetColor.state, brand)),
  );
  const paintsB = useRef<tPaint[]>(
    colorMaptoArray(fClosestColors(vTargetColor.state, brand)),
  );
  const [sideA, setSideA] = useState(true);
  const rotationAnim = useSharedValue(0);
  useEffect(() => {
    rotationAnim.value = withTiming(1, { duration: 500 });
  }, []);
  useEffect(() => {
    if (sideA) {
      paintsB.current = colorMaptoArray(
        fClosestColors(vTargetColor.state, brand),
      );
      setSideA(false);
    } else {
      paintsA.current = colorMaptoArray(
        fClosestColors(vTargetColor.state, brand),
      );
      setSideA(true);
    }
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
        translateX: input.translateX + 50,
        shadowColor: input.chord,
        shadowRadius: 10,
      };
    },
  };
  const mColorModifier: tAttributeModifier = {
    modID: 1,
    deps: [vTargetColor.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let color = colors[colorIndexes[chord - input.chord - 1]];
      color = fColorLerp(
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
  /*
  const { registerModifier, unregisterModifier } = useUserContext();
  const chipMod: tAttributeModifier = {
    modID: 30,
    deps: [rotationAnim],
    modifier: (input: tAttributeMap) => {
      "worklet";
      if (input.id > eLayers.chipFan + 50 || input.id < eLayers.chipFan) {
        return input;
      }
      const r = fLerp(22 / 7, input.rotateZ, rotationAnim.value);
      return {
        ...input,
        rotateZ: r,
        translateY: Math.cos(r) * radii[1] + origin[1],
        translateX: Math.sin(r) * radii[1] + origin[0],
      };
    },
  };
*/
  const { registerBucket, unregisterBucket } = useBucketContext();
  useEffect(() => {
    //registerModifier(chipMod);
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
      //unregisterModifier(chipMod.modID);
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
        paintsA={paintsA.current}
        paintsB={paintsB.current}
        origin={origin}
        sideA={sideA}
        arcLength={arcLength}
        rotationR={rotationR}
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
        layer={eLayers.chipHand}
      />
    </>
  );
}
/*
   
      */
