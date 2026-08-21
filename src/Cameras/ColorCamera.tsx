import { Dimensions, View } from "react-native";
import {
  Camera,
  DrawableFrame,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import { useSharedValue as useCoreShared } from "react-native-worklets-core";
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue as useAnimShared,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import {
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "../Radials/RadialContext";
import { tRadialObject } from "../Radials/SectorTypes";
import { fRGBToCLARColor } from "../utils/CLAcolor";
import { GlassView } from "expo-glass-effect";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tVerse, useVerse } from "../utils/Verse";
import { ThermSelect } from "./ThermSelect";
import { tTemp, kelvin_table } from "./KelvinTemp";
import { SkiaCam } from "./SkiaCam";
import { useIVerse } from "../utils/iVerse";
import { AlphaType, ColorType } from "@shopify/react-native-skia";
import React from "react";
import { usePanHitBox } from "../Buttons/PanHitBox";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { ePages } from "../Driver";
import { HarmonizerWheel } from "../Harmonizer/HarmonizerWheel";

export function ColorCamera({
  radii = [160, 320],
  chord = 24,
  arcLength = 43.9 / 7,
  rotationR = 22 / 7,
  fSetHarmonizer,
}: tRadialObject & {
  fSetHarmonizer: () => void;
}) {
  const origin: [number, number] = [
    Dimensions.get("window").width + 50,
    Dimensions.get("window").height * 0.6,
  ];
  const { hasPermission, requestPermission } = useCameraPermission();
  if (!hasPermission) {
    requestPermission();
    return null;
  }
  const device = useCameraDevice("back");
  if (device == null) return null;
  const vTransition = useSharedValue(0);
  const vCamColor = useCoreShared({ ar: 0, c: 0, l: 0 });
  const vAnimAr = useAnimShared(0);
  const vTemp = useVerse<tTemp>(kelvin_table[6000]);
  const targetWhiteRGB = useIVerse(vTemp.state.rgb);
  const vSecondColor = useVerse<number | null>(null);
  const { vSelected, vColorModel, vAccentAR, vAccentC, vAccentL } =
    useUserContext();
  useEffect(() => {
    const interval = setInterval(() => {
      let angle = wDefaultChordToAngle(
        wDefaultAngleToChord(vCamColor.value.ar, arcLength, chord, rotationR),
        arcLength,
        chord,
        rotationR,
      );
      if (Math.abs(angle - vAnimAr.value) > 22 / 7) {
        angle = angle > vAnimAr.value ? angle - 44 / 7 : angle + 44 / 7;
      }
      vAnimAr.value = withSpring(angle, {
        duration: 0.9,
        dampingRatio: 0.2,
      });
      vAccentC.shared.value = vCamColor.value.c ** 0.5;
      vAccentAR.shared.value = angle;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function frameProcessor(frame: DrawableFrame) {
    "worklet";

    const imageInfo = frame.readPixels(
      frame.height / 2 - 2,
      frame.width / 2 - 2,
      {
        width: 5,
        height: 5,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Unpremul,
      },
    );
    let averageColor = [0, 0, 0];
    for (let i = 0; i < 25; i++) {
      averageColor[0] += imageInfo[i * 4];
      averageColor[1] += imageInfo[i * 4 + 1];
      averageColor[2] += imageInfo[i * 4 + 2];
    }
    averageColor = averageColor.map((c) => c / 25);
    const clar = fRGBToCLARColor(
      averageColor as [number, number, number],
      vColorModel.shared.value,
    );
    vCamColor.value = clar;
  }
  const mTransformModifier: tAttributeModifier = {
    modID: 0,
    deps: [vTransition],
    modifier: (input: tAttributeMap) => {
      "worklet";
      return {
        ...input,
        rotateZ: input.rotateZ - (vTransition.value * 2) / 7,
      };
    },
  };

  const dAR = useDerivedValue(() => {
    "worklet";
    if (vSecondColor.shared.value === null) {
      return vAnimAr.value;
    } else {
      return vSecondColor.shared.value;
    }
  });

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <SkiaCam
        postRenderProcessor={frameProcessor}
        shaderCode={shaderCode}
        uniforms={{ targetWhiteRGB: targetWhiteRGB.state.map((c) => c / 255) }}
      />
      <HarmonizerWheel
        origin={origin}
        draggable={false}
        radii={radii}
        fOnPhase={fSetHarmonizer}
      />
      <ThermSelect
        mainRotationR={11 / 7}
        tempK={vTemp.state.k}
        setTemp={(temp) => targetWhiteRGB.dispatch(temp.rgb)}
        origin={[50, Dimensions.get("window").height / 2 - 100]}
      />
    </View>
  );
}

const shaderCode = /* glsl */ `
uniform shader image;
uniform vec3 targetWhiteRGB;
half4 main(float2 pos) {
  half4 color = image.eval(pos);
  color.rgb = color.rgb / targetWhiteRGB;
  return color;
}
`;
