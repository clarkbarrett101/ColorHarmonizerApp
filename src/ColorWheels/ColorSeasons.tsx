import { Dimensions, View } from "react-native";
import {
  fCLARColorToRGB,
  fCLARColorToString,
  fClosestColors,
  fColorLerp,
  fGetRandomPaint,
  fGetSeasonColors,
  tBrand,
  tCLARColor,
  tPaint,
  tSeasonMap,
} from "../utils/CLAcolor";
import { RadialContext } from "../Radials/RadialContext";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { useVerse } from "../utils/Verse";
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
export default function ColorSeasons({
  radii = [0, 300],
  ring = 5,
  chord = 4,
  arcLength = 11 / 7,
  rotationR = 22 / 7,
}: tRadialObject) {
  ///ON MOUNT

  const origin: [number, number] = [
    Dimensions.get("window").width,
    Dimensions.get("window").height * 0.45,
  ];
  const colors: tCLARColor[] = [
    { c: 0.8, l: 0.9, ar: 6 / 7 },
    { c: 0.2, l: 0.9, ar: 33 / 7 },
    { c: 0.4, l: 0.3, ar: 6 / 7 },
    { c: 0.6, l: 0.1, ar: 33 / 7 },
  ];
  const { vColorModel, vAccentAR, vAccentC, vAccentL } = useUserContext();
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
      origin: [Dimensions.get("window").width - 100, origin[1]],
      radii: [radii[1] * 0.3, radii[1] * 0.4],
      rotationR: 0,
      callback: (paint) => {
        vTargetColor.dispatch(paint);
      },
      targetLayerRange: [eLayers.chipFan - 10, eLayers.chipHand + 100],
      id: 20,
      icon: "search",
    });
    return () => {
      unregisterBucket("" + 20);
      unregisterModifier(chipMod.modID);
    };
  }, []);

  /// R E N D E R ///

  const textProps: TextProps = {
    x: 300,
    y: 200,
    textAnchor: "middle",
    alignmentBaseline: "middle",
    fill: "white",
    fontFamily: "Outfit",
    fontSize: 16,
  };

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
      <SeasonGradient
        arcLength={2.8}
        radii={[0, 450]}
        rotationR={22.1 / 7}
        origin={[origin[0] + 50, origin[1]]}
      />

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
      <Tutorial
        height={400}
        width={600}
        origin={[Dimensions.get("window").width / 2, origin[1]]}
        infoIconOrigin={[origin[0] - 50, origin[1] + 175]}
        infoIconSize={50}
      >
        <Text {...textProps} dy={-60}>
          Drag in a paint for colors that are more:
        </Text>
        <Text {...textProps} fill="rgb(255, 225, 0)" dy={-30} dx={-30}>
          Spring (warm and bright)
        </Text>
        <Text {...textProps} dy={-10} fill={"rgb(175, 255, 255)"} dx={-15}>
          Summer (cool and light)
        </Text>
        <Text {...textProps} dy={10} fill={"rgb(200, 125, 50)"} dx={15}>
          Autumn (warm and muted)
        </Text>
        <Text {...textProps} dy={30} fill={"rgb(100, 100, 255)"} dx={30}>
          Winter (cool and deep)
        </Text>
        <Text {...textProps} dy={60}>
          Then drag the new ones
        </Text>
        <Text {...textProps} dy={80}>
          back to repeat the process
        </Text>
      </Tutorial>
    </>
  );
}

function SeasonGradient({
  arcLength,
  radii,
  rotationR,
  origin,
}: tRadialObject) {
  const colorRange = 2.5;
  const winterAngle = 34 / 7;
  const autumnAngle = 11 / 7;
  const winterCLArs: tCLARColor[] = [
    { c: 0.8, l: 0.2, ar: winterAngle - colorRange / 2 },
    { c: 0.6, l: 0.25, ar: winterAngle },
    { c: 0.8, l: 0.2, ar: winterAngle + colorRange / 2 },
  ];
  const autumnCLArs: tCLARColor[] = [
    { c: 0.7, l: 0.35, ar: autumnAngle - colorRange / 2 },
    { c: 0.7, l: 0.35, ar: autumnAngle },
    { c: 0.7, l: 0.35, ar: autumnAngle + colorRange / 2 },
  ];
  const springCLArs: tCLARColor[] = [
    { c: 0.9, l: 0.7, ar: autumnAngle - colorRange * 0.7 },
    { c: 0.9, l: 0.7, ar: autumnAngle },
    { c: 0.9, l: 0.7, ar: autumnAngle + colorRange * 0.7 },
  ];
  const summerCLArs: tCLARColor[] = [
    { c: 0.5, l: 0.8, ar: winterAngle - colorRange / 2 },
    { c: 0.5, l: 0.8, ar: winterAngle },
    { c: 0.5, l: 0.8, ar: winterAngle + colorRange / 2 },
  ];
  function fGetColors(
    season: "winter" | "autumn" | "spring" | "summer",
  ): string[] {
    let colors: tCLARColor[] = [];
    switch (season) {
      case "winter":
        colors = winterCLArs;
        break;
      case "autumn":
        colors = autumnCLArs;
        break;
      case "spring":
        colors = springCLArs;
        break;
      case "summer":
        colors = summerCLArs;
        break;
    }
    const firstColorRGB = fCLARColorToRGB(colors[0], vColorModel.state);
    const stringFirst =
      "rgba(" +
      firstColorRGB[0] +
      "," +
      firstColorRGB[1] +
      "," +
      firstColorRGB[2] +
      "," +
      0 +
      ")";
    const lastColorRGB = fCLARColorToRGB(
      colors[colors.length - 1],
      vColorModel.state,
    );
    const stringLast =
      "rgba(" +
      lastColorRGB[0] +
      "," +
      lastColorRGB[1] +
      "," +
      lastColorRGB[2] +
      "," +
      0 +
      ")";
    return [
      stringFirst,
      ...colors.map((c) => fCLARColorToString(c, vColorModel.state)),
      stringLast,
    ];
  }

  const { vColorModel } = useUserContext();
  function sweepPath(
    rd: [number, number],
    arc: number,
    r: number,
    colors: string[],
  ) {
    return (
      <Path
        transform={[
          { translateX: radii[1] },
          { translateY: radii[1] },
          { rotate: r },
        ]}
        path={fMakeSectorPath(rd, arc, radii[1])}
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
  return (
    <Canvas
      style={{
        width: radii[1] * 2,
        height: radii[1] * 2,
        zIndex: eLayers.background + 1,
        position: "absolute",
        top: origin[1] - radii[1],
        left: origin[0] - radii[1],
        opacity: 0.8,
      }}
    >
      {sweepPath(
        radii,
        arcLength / 8,
        rotationR + arcLength / 5,
        fGetColors("spring"),
      )}
      {sweepPath(
        radii,
        arcLength / 8,
        rotationR + arcLength / 5 / 3,
        fGetColors("summer"),
      )}
      {sweepPath(
        radii,
        arcLength / 8,
        rotationR - arcLength / 5 / 3,
        fGetColors("autumn"),
      )}
      {sweepPath(
        radii,
        arcLength / 8,
        rotationR - arcLength / 5,
        fGetColors("winter"),
      )}
    </Canvas>
  );
}
