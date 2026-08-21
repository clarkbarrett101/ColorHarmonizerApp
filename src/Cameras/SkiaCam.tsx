import {
  Camera,
  DrawableFrame,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useSkiaFrameProcessor,
} from "react-native-vision-camera";
import { Dimensions, View } from "react-native";
import {
  AlphaType,
  ColorType,
  Skia,
  SkPaint,
} from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import {
  fCLARColorToString,
  fCLARColorToYUV,
  fGetRandomPaint,
  fRGBToYUV,
  fYUVToRGB,
  tPaint,
} from "../utils/CLAcolor";
import { useRunOnJS, useSharedValue } from "react-native-worklets-core";
import { useBucketContext } from "../Buckets/BucketContext";
import { tIVerse, useIVerse } from "../utils/iVerse";
import { tTemp, kelvin_table, fGetTempFromUV } from "./KelvinTemp";
import { ThermSelect } from "./ThermSelect";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { GlassView } from "expo-glass-effect";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { ReplacementMeter } from "./ReplacementMeter";
import { SharedValue } from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
export type tSkiaCam = {
  shaderCode?: string;
  uniforms?: Record<string, number[]>;
  frameProcessor?: (frame: DrawableFrame) => void;
  postRenderProcessor?: (frame: DrawableFrame) => void;
  camActive?: boolean;
};
export function SkiaCam({
  shaderCode,
  uniforms,
  frameProcessor,
  camActive = true,
  postRenderProcessor,
}: tSkiaCam) {
  const { hasPermission, requestPermission } = useCameraPermission();
  if (!hasPermission) {
    requestPermission();
    return null;
  }
  const device = useCameraDevice("back");
  if (device == null) return null;
  const vPaint = useSharedValue<SkPaint>(Skia.Paint());
  const frameSize = useSharedValue([0, 0]);

  function resetShader(dimensions?: [number, number]) {
    if (!shaderCode || !uniforms) return;
    frameSize.value = dimensions ?? frameSize.value;
    console.log("resetShader", frameSize.value, uniforms);
    const filter = Skia.RuntimeEffect.Make(shaderCode);
    const builder = Skia.RuntimeShaderBuilder(filter);
    for (const [key, value] of Object.entries(uniforms)) {
      builder.setUniform(key, value);
    }
    const rtShader = Skia.ImageFilter.MakeRuntimeShader(builder, null, null);
    vPaint.value.setImageFilter(rtShader);
  }

  const runResetShader = useRunOnJS(resetShader, []);

  useEffect(() => {
    resetShader();
  }, [shaderCode, uniforms]);

  const skfp = useSkiaFrameProcessor(
    (frame) => {
      "worklet";

      if (frameSize.value[0] === 0) {
        runResetShader([frame.width, frame.height]);
      }
      frameProcessor?.(frame);
      frame.render(vPaint.value);
      postRenderProcessor?.(frame);
    },
    [frameProcessor, shaderCode, uniforms],
  );

  if (!device) return <View />;

  return (
    <>
      <Camera
        device={device}
        isActive={camActive}
        style={{
          position: "absolute",
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          zIndex: 0,
        }}
        frameProcessor={skfp}
        fps={12}
      />

      <GlassView
        style={{
          position: "absolute",
          top: SCREEN_HEIGHT / 2 - 20,
          left: SCREEN_WIDTH / 2 - 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          zIndex: eLayers.chipFan + 100,
        }}
        glassEffectStyle={"clear"}
      />
    </>
  );
}
