import { Dimensions, View } from "react-native";
import {
  fCLARColorToRGB,
  fClosestColors,
  fColorLerp,
  fGetRandomPaint,
  refColors,
  tBrand,
  tColorMap,
  tPaint,
} from "../utils/CLAcolor";
import { RadialContext } from "../Radials/RadialContext";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { useVerse } from "../utils/Verse";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { ChipFan } from "../Chips/ChipStack";
import { useEffect, useMemo, useRef, useState } from "react";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tRadialObject, tSectorGroup } from "../Radials/SectorTypes";
import { useBucketContext } from "../Buckets/BucketContext";
import { eChipSizes, PaintChip } from "../Chips/PaintChip";
import { withTiming, useSharedValue } from "react-native-reanimated";
import { BrandFilter } from "./BrandFilter";
import { Text, TextProps, TSpan } from "react-native-svg";
import { Tutorial } from "../Buttons/Tutorial";

export default function ColorMixer({
  radii = [0, Dimensions.get("window").width * 0.9],
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
  const colorHex = [
    "#000000",
    "#888888",
    "#ffffff",
    "#0000ff",
    "#ffff00",
    "#ff0000",
  ];

  const { vColorModel, vAccentAR, vAccentL, vAccentC } = useUserContext();
  const colors = { ...refColors };
  const vBrand = useVerse<tBrand>("All Brands");
  const vTargetColor = useVerse<tPaint>(fGetRandomPaint());
  function colorMaptoArray(colorMap: tColorMap<tPaint>): tPaint[] {
    const arg = Array(6);
    for (let i = 0; i < 6; i++) {
      const colorKey = colorIndexes[i];
      arg[i] = colorMap[colorKey];
    }
    arg.reverse();
    return arg;
  }
  const closestColors = useMemo(
    () => colorMaptoArray(fClosestColors(vTargetColor.state, vBrand.state)),
    [],
  );
  const paintsA = useRef<tPaint[]>([]);
  const paintsB = useRef<tPaint[]>([]);
  const [sideA, setSideA] = useState(true);
  const rotationAnim = useSharedValue(0);
  useEffect(() => {
    rotationAnim.value = withTiming(1, { duration: 500 });
  }, []);
  useEffect(() => {
    vAccentAR.dispatch(vTargetColor.state.clar.ar);
    vAccentL.dispatch(vTargetColor.state.clar.l);
    vAccentC.dispatch(vTargetColor.state.clar.c);
    if (sideA) {
      paintsB.current = colorMaptoArray(
        fClosestColors(vTargetColor.state, vBrand.state),
      );
      setSideA(false);
    } else {
      paintsA.current = colorMaptoArray(
        fClosestColors(vTargetColor.state, vBrand.state),
      );
      setSideA(true);
    }
    rotationAnim.value = 0;
    rotationAnim.value = withTiming(1, { duration: 500 });
  }, [vTargetColor.state, vBrand.state]);
  const fSectorGroupModifier = (sectorGroup: tSectorGroup) => {
    return {
      ...sectorGroup,
      layer: eLayers.colorMixer,
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
        shadowColor: parseInt(colorHex[input.chord].replace("#", ""), 16),
        shadowRadius: 10,
      };
    },
  };
  const mColorModifier: tAttributeModifier = {
    modID: 1,
    deps: [vTargetColor.shared, vColorModel.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let color = colors[colorIndexes[chord - input.chord - 1]];
      color = fColorLerp(
        vTargetColor.shared.value.clar,
        color,
        input.ring / ring,
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
      id: 20,
    });
    return () => {
      unregisterBucket("" + 20);
    };
  }, []);
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
        <View
          style={{
            position: "absolute",
            shadowColor: "black",
            shadowOffset: { width: -5, height: 5 },
            shadowOpacity: 0.75,
            shadowRadius: 5,
            zIndex: eLayers.colorMixer,
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
        radius={radii[1] * 0.8}
        groupLayer={eLayers.chipFan}
      />
      <BrandFilter
        vBrand={vBrand}
        radius={50}
        origin={[origin[0] - radii[1] * 0.15, origin[1] - 250]}
        mainRotationR={11 / 7}
        totalArcLength={2.5 / 7}
        layer={eLayers.chipHand}
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
        <Text {...textProps} dy={-30} dx={-30}>
          <TSpan fill={"rgb(255, 100, 100)"}>Red </TSpan>
          <TSpan fill={"rgb(255, 255, 100)"}> Yellow</TSpan>
          <TSpan fill={"rgb(100, 100, 255)"}>Blue</TSpan>
        </Text>
        <Text {...textProps} fill={"rgb(255, 255, 255)"} dy={30}>
          <TSpan fill={"rgb(255, 255, 255)"} dx={-20}>
            White
          </TSpan>
          <TSpan fill={"rgb(150, 150, 150)"} dx={5}>
            Gray
          </TSpan>
          <TSpan fill={"rgb(0, 0, 0)"} dx={10}>
            Black
          </TSpan>
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
