import { Dimensions, View } from "react-native";
import {
  fCLARColorToRGB,
  fCLARColorToString,
  fClosestColors,
  fColorLerp,
  fGetRandomPaint,
  fGetRandomPalette,
  fGetSeasonColors,
  tBrand,
  tCLARColor,
  tPaint,
  tSeasonMap,
} from "../utils/CLAcolor";
import { RadialContext } from "../Radials/RadialContext";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { ChipFan } from "../Chips/ChipStack";
import { useEffect, useMemo, useRef, useState } from "react";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import {
  fMakeSectorPath,
  tRadialObject,
  tSectorGroup,
} from "../Radials/SectorTypes";
import { useBucketContext } from "../Buckets/BucketContext";
import { eChipSizes, PaintChip } from "../Chips/PaintChip";
import { withTiming, useSharedValue } from "react-native-reanimated";
import { BrandFilter } from "../ColorWheels/BrandFilter";
import { useChipContext } from "../Chips/ChipContext";
import {
  Canvas,
  Group,
  Path,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import { CurvedText } from "../Buttons/CurvedText";
import { Text, TextProps } from "react-native-svg";
import { fTextWrapSVG, Tutorial } from "../Buttons/Tutorial";
import { cDimW, cDimH } from "../utils/ScreenDimensions";
import { useDemo } from "../Contexts/DemoContext";
import { Paths } from "../utils/Paths";
import React from "react";
import Button from "../Buttons/Button";
export default function ColorSeasons({
  radii = [0, 325],
  ring = 5,
  chord = 4,
  arcLength = 11 / 7,
  rotationR = 22 / 7,
}: tRadialObject) {
  ///ON MOUNT

  const origin: [number, number] = [cDimW(), cDimH(0.45)];
  const colors: tCLARColor[] = [
    { c: 0.8, l: 0.9, ar: 6 / 7 },
    { c: 0.2, l: 0.9, ar: 33 / 7 },
    { c: 0.4, l: 0.3, ar: 6 / 7 },
    { c: 0.6, l: 0.1, ar: 33 / 7 },
  ];
  const {
    vColorModel,
    vAccentAR,
    vAccentC,
    vAccentL,
    vUserPalette,
    pagesVisited,
  } = useUserContext();
  const vBrand = useVerse<tBrand>("All Brands");
  const randomPaint = useMemo(() => fGetRandomPaint(), []);
  const vTargetColor = useVerse<tPaint>(randomPaint);
  const [sideA, setSideA] = useState(false);
  const rotationAnim = useSharedValue(0);
  useEffect(() => {
    rotationAnim.value = withTiming(1, { duration: 500 });
  }, []);

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
  const paintsA = useRef<tPaint[]>([]);
  const paintsB = useRef<tPaint[]>([]);

  useEffect(() => {
    vAccentAR.dispatch(vTargetColor.state.clar.ar);
    vAccentC.dispatch(vTargetColor.state.clar.c);
    vAccentL.dispatch(vTargetColor.state.clar.l);
    if (sideA) {
      paintsB.current = colorMaptoArray(
        fGetSeasonColors(vTargetColor.state.clar, vBrand.state),
      );
      setSideA(false);
    } else {
      paintsA.current = colorMaptoArray(
        fGetSeasonColors(vTargetColor.state.clar, vBrand.state),
      );
      setSideA(true);
    }
  }, [vTargetColor.state, vBrand.state]);

  function fLerp(a: number, b: number, t: number): number {
    "worklet";
    return a * (1 - t) + b * t;
  }

  /// F A N  M O D S ///

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
      const [r, g, b] = fCLARColorToRGB(color, vColorModel.shared.value);
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  const fSectorGroupModifier = (sectorGroup: tSectorGroup) => {
    return {
      ...sectorGroup,
      layer: eLayers.colorMixer,
    };
  };

  /// C H I P  M O D S ///

  const { registerModifier, unregisterModifier } = useChipContext();
  const chipMod: tAttributeModifier = {
    modID: 30,
    deps: [rotationAnim],
    modifier: (input: tAttributeMap) => {
      "worklet";
      if (
        input.id > eLayers.chipFan + 50 ||
        input.id < eLayers.chipFan ||
        input.held > 0
      ) {
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
      origin: [origin[0] - 100, origin[1]],
      radii: [radii[1] * 0.3, radii[1] * 0.4],
      rotationR: 0,
      callback: (paint) => {
        vTargetColor.dispatch(paint);
      },
      targetLayerRange: [eLayers.chipFan - 10, eLayers.chipHand + 100],
      id: 20,
      path: Paths.search,
    });
    return () => {
      unregisterBucket("" + 20);
      unregisterModifier(chipMod.modID);
    };
  }, []);
  const firstChipPos: [number, number] = [
    origin[0] + Math.cos(rotationR + arcLength / 2) * radii[1] * 0.9,
    origin[1] + Math.sin(rotationR + arcLength / 2) * radii[1] * 0.9,
  ];

  const { fPlaySequence } = useDemo();
  const { holdChip } = useChipContext();

  const vPagesVisitedRelay = useVerseRelay(pagesVisited);
  useEffect(() => {
    if (!pagesVisited.shared.value["Color Seasons"]) {
      pagesVisited.dispatch({
        ...pagesVisited.shared.value,
        "Color Seasons": true,
      });

      if (!vUserPalette.shared.value.paints[0]) {
        vUserPalette.dispatch(fGetRandomPalette(1));
      }
      fPlaySequence([
        {
          touching: 0,
          toPos: [cDimW(0.05), cDimH(0.95)],
          duration: 2000,
          callback: () => {
            "worklet";
            if (vUserPalette.shared.value.paints[0]) {
              holdChip(eLayers.chipHand);
            }
          },
        },
        {
          touching: 1,
          toPos: [origin[0] - 100, origin[1]],
          duration: 2000,
          callback: () => {
            "worklet";
            holdChip();
          },
        },
        {
          touching: 0,
          toPos: firstChipPos,
          duration: 2000,
          callback: () => {
            "worklet";
            holdChip(eLayers.chipFan + 3);
          },
        },
        {
          touching: 1,
          toPos: [origin[0] - 100, origin[1]],
          duration: 2000,
          callback: () => {
            "worklet";
            holdChip();
          },
        },
        {
          touching: 0,
          toPos: [cDimW(1.5), cDimH(0.5)],
          duration: 300,
        },
      ]);
    } else {
      console.log("Color Seasons has already been visited.");
    }
  }, [vPagesVisitedRelay.state]);

  const colorsBySeason = {
    spring: [
      "rgba(255,95,162,0)",
      "#FF5FA2",
      "#CEB000",
      "#26E865",
      "rgba(38,232,101,0)",
    ],
    summer: [
      "rgba(129,218,195,0)",
      "#81DAC3",
      "#BAAAFF",
      "#F99EBE",
      "rgba(249,158,190,0)",
    ],
    autumn: [
      "rgba(0,91,49,0)",
      "#005B31",
      "#2C18B6",
      "#920028",
      "rgba(146,0,40,0)",
    ],
    winter: [
      "rgba(156,37,16,0)",
      "#9C2510",
      "#685200",
      "#067D00",
      "rgba(6,125,0,0)",
    ],
  };
  function sweepPath(
    rd: [number, number],
    arc: number,
    r: number,
    colors: string[],
  ) {
    return (
      <Path
        transform={[
          { translateX: rd[1] },
          { translateY: rd[1] },
          { rotate: r },
        ]}
        path={fMakeSectorPath(rd, arc, rd[1])}
      >
        <SweepGradient
          transform={[{ rotate: -arc / 2 }]}
          c={vec(0, 0)}
          start={0}
          end={(arc / 3.14) * 180}
          colors={colors}
        />
      </Path>
    );
  }
  const gradientRadii: [number, number] = [0, radii[1] + 100];

  /// R E N D E R ///

  return (
    <>
      <RadialContext
        value={{
          origin,
          radii,
          mColorModifier,
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
        rotationR={rotationR + 0.02}
        radius={radii[1] * 0.85}
        groupLayer={eLayers.chipFan}
      />
      <BrandFilter
        vBrand={vBrand}
        radius={55}
        origin={[origin[0] - radii[1] * 0.2, origin[1] - 250]}
        mainRotationR={11 / 7}
        totalArcLength={2 / 7}
        layer={eLayers.buckets}
      />

      <Canvas
        style={{
          width: gradientRadii[1] * 2,
          height: gradientRadii[1] * 2,
          zIndex: eLayers.background + 5,
          position: "absolute",
          top: origin[1] - gradientRadii[1] - 10,
          left: origin[0] - gradientRadii[1],
          opacity: 0.8,
        }}
      >
        {sweepPath(
          gradientRadii,
          arcLength / 4,
          rotationR + arcLength * 0.4,
          colorsBySeason.spring,
        )}
        {sweepPath(
          gradientRadii,
          arcLength / 4,
          rotationR + arcLength * 0.13,
          colorsBySeason.summer,
        )}
        {sweepPath(
          gradientRadii,
          arcLength / 4,
          rotationR - arcLength * 0.13,
          colorsBySeason.autumn,
        )}
        {sweepPath(
          gradientRadii,
          arcLength / 4,
          rotationR - arcLength * 0.4,
          colorsBySeason.winter,
        )}
      </Canvas>

      <CurvedText
        text="Winter"
        origin={[
          Dimensions.get("window").width + 40,
          Dimensions.get("window").height / 2 - 50,
        ]}
        layer={eLayers.chipFan}
        rotationR={-0.65}
        arcLength={2}
        radii={[100, 440]}
        fontSize={30}
        color="white"
        convex={true}
      />
      <CurvedText
        text="Autumn"
        origin={[
          Dimensions.get("window").width + 40,
          Dimensions.get("window").height / 2 - 50,
        ]}
        layer={eLayers.chipFan}
        rotationR={-0.3}
        arcLength={2}
        radii={[100, 440]}
        fontSize={30}
        color="white"
        convex={true}
      />
      <CurvedText
        text="Summer"
        origin={[
          Dimensions.get("window").width + 40,
          Dimensions.get("window").height / 2 - 50,
        ]}
        layer={eLayers.chipFan}
        rotationR={0.07}
        arcLength={2}
        radii={[100, 440]}
        fontSize={30}
        color="white"
        convex={true}
      />
      <CurvedText
        text="Spring"
        origin={[
          Dimensions.get("window").width + 40,
          Dimensions.get("window").height / 2 - 50,
        ]}
        layer={eLayers.chipFan}
        rotationR={0.47}
        arcLength={2}
        radii={[100, 445]}
        fontSize={30}
        color="white"
        convex={true}
      />
      <Button
        path={Paths.replay}
        layer={eLayers.superMax}
        origin={[cDimW(0.9), cDimH(0.65)]}
        viewRadius={30}
        onPress={() => {
          pagesVisited.dispatch({
            ...pagesVisited.shared.value,
            "Color Seasons": false,
          });
        }}
      />
    </>
  );
}
