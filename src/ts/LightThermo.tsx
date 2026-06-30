import { GlassView } from "expo-glass-effect";
import { Dimensions, View } from "react-native";
import {
  Camera,
  Frame,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor,
  useSkiaFrameProcessor,
  runAsync,
} from "react-native-vision-camera";
import {
  AlphaType,
  Canvas,
  ColorType,
  Image,
  Paint,
  Skia,
  SkImage,
  SkPaint,
  SkSurface,
  useAnimatedImage,
  useCanvasRef,
} from "@shopify/react-native-skia";
import { use, useEffect, useRef, useState } from "react";

import { fCLARColorToYUV, fRGBToCLARColor, fRGBToYUV } from "./CLAcolor";
import { useRunOnJS, useSharedValue } from "react-native-worklets-core";
import { useBucketContext } from "./BucketContext";
import { useIVerse } from "./iVerse";
import Svg from "react-native-svg";
import { ThermSelect } from "./ThermSelect";
import PanManager from "./PanManager";
import { eLayers } from "./UserContext";
import { kelvin_table, tTemp } from "./KelvinTemp";
import { scheduleOnRN } from "react-native-worklets";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function LightThermo() {
  const { hasPermission, requestPermission } = useCameraPermission();
  if (!hasPermission) {
    requestPermission();
    return null;
  }
  const device = useCameraDevice("back");
  if (device == null) return null;
  const format = useCameraFormat(device, [
    {
      photoResolution: {
        width: 1280,
        height: 720,
      },
    },
  ]);
  const vPaint = useSharedValue<SkPaint>(Skia.Paint());
  const vSourceTemp = useIVerse<tTemp>(kelvin_table[6000]);
  const vTargetTemp = useIVerse<tTemp>(kelvin_table[6000]);
  const frameSize = useSharedValue([0, 0]);
  function resetShader(dimensions?: [number, number]) {
    frameSize.value = dimensions ?? frameSize.value;
    const filter = Skia.RuntimeEffect.Make(shaderCode);
    console.log("Source Temp:", vSourceTemp.shared.value);
    const builder = Skia.RuntimeShaderBuilder(filter);
    builder.setUniform("sourceUV", [
      vSourceTemp.shared.value.u,
      vSourceTemp.shared.value.v,
    ]);
    builder.setUniform("targetUV", [
      vTargetTemp.shared.value.u,
      vTargetTemp.shared.value.v,
    ]);
    builder.setUniform("center", [
      frameSize.value[0] / 2,
      frameSize.value[1] / 2,
    ]);
    const rtShader = Skia.ImageFilter.MakeRuntimeShader(builder, null, null);
    vPaint.value.setImageFilter(rtShader);
  }
  const runResetShader = useRunOnJS(resetShader, []);
  useEffect(() => {
    resetShader();
  }, [vSourceTemp.state, vTargetTemp.state]);
  const skfp = useSkiaFrameProcessor((frame) => {
    "worklet";
    if (frameSize.value[0] === 0) {
      runResetShader([frame.width, frame.height]);
    }

    frame.render(vPaint.value);
    const buffer = frame.readPixels(frame.height / 2 - 1, frame.width / 2 - 1, {
      width: 3,
      height: 3,
      alphaType: AlphaType.Opaque,
      colorType: ColorType.RGBA_8888,
    });
    let sample = [0, 0, 0];
    for (let i = 0; i < 9; i++) {
      sample[0] += buffer[i * 4];
      sample[1] += buffer[i * 4 + 1];
      sample[2] += buffer[i * 4 + 2];
    }
    sample = sample.map((c) => c / 9);
    const yuv = fRGBToYUV(sample as [number, number, number]);
    let minDist = 0.5;
    let uv = [100, 100];
    let k = 0;
    Object.keys(kelvin_table).forEach((key) => {
      const temp = kelvin_table[key];
      const tempUV = [temp.u, temp.v];
      const dist = Math.sqrt(
        Math.pow(yuv[1] - tempUV[0], 2) + Math.pow(yuv[2] - tempUV[1], 2),
      );
      if (dist < minDist) {
        k = temp.k;
        minDist = dist;
        uv = tempUV;
      }
    });
    if (minDist < 0.1 && vSourceTemp.shared.value.k !== k) {
      vSourceTemp.dispatch(kelvin_table[k]);
    }
  }, []);

  if (!device) return <View />;
  const { registerBucket, unregisterBucket } = useBucketContext();
  useEffect(() => {
    registerBucket({
      origin: [SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2],
      radii: [150, 400],
      rotationR: 0,
      targetLayerRange: [0, 1000],
      id: 20,
    });
    return () => unregisterBucket("" + 20);
  }, []);
  return (
    <>
      <PanManager zIndex={eLayers.chipHand}>
        <ThermSelect
          totalArcLength={2 / 7}
          mainRotationR={11 / 7}
          width={75}
          height={75}
          tempK={vTargetTemp.state.k}
          setTemp={(temp) => vTargetTemp.dispatch(temp)}
          origin={[SCREEN_WIDTH - 50, SCREEN_HEIGHT / 2 - 100]}
        />
        <ThermSelect
          totalArcLength={2 / 7}
          mainRotationR={11 / 7}
          width={75}
          height={75}
          tempK={vSourceTemp.state.k}
          setTemp={(temp) => vSourceTemp.dispatch(temp)}
          origin={[50, SCREEN_HEIGHT / 2 - 100]}
        />
      </PanManager>
      <Camera
        device={device}
        isActive={true}
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
        frameProcessor={skfp}
      />
      <GlassView
        style={{
          position: "absolute",
          top: SCREEN_HEIGHT / 2 - 20,
          left: SCREEN_WIDTH / 2 - 20,
          width: 40,
          height: 40,
          borderRadius: 20,
        }}
        glassEffectStyle={"clear"}
      />
    </>
  );
}
const shaderCode = `
uniform shader image;
uniform vec2 sourceUV;
uniform vec2 targetUV;
uniform vec2 center;
vec2 uRange = vec2(-0.2955, 0.0867);
vec2 vRange = vec2(-0.0538, 0.5019);
vec3 rgb2yuv(vec3 rgb) {
  float y = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  float u = -0.14713 * rgb.r - 0.28886 * rgb.g + 0.436 * rgb.b;
  float v = 0.615 * rgb.r - 0.51499 * rgb.g - 0.10001 * rgb.b;
  return vec3(y, u, v);
}
vec3 yuv2rgb(vec3 yuv) {
  float r = yuv.r + 1.13983 * yuv.b;
  float g = yuv.r - 0.39465 * yuv.g - 0.58060 * yuv.b;
  float b = yuv.r + 2.03211 * yuv.g;
  return vec3(r, g, b);
}

vec3 averageYUV(vec2 pos) {

  vec3 avgUV = vec3(0,0,0);
  for(int x = -3; x <= 3; x++) {
    for(int y = -3; y <= 3; y++) {
      vec2 offset = vec2(float(x), float(y)) ;
      vec4 color = image.eval(pos + offset);
      vec3 yuv = rgb2yuv(color.rgb);
      avgUV += yuv;
    }
  }
  return avgUV / 49.0;
}
half4 main(vec2 pos) {
  vec4 color = image.eval(pos);
  vec3 yuv = rgb2yuv(color.rgb);

if(distance(pos, center) < 5 || pos.y>center.y) {
return image.eval(pos);
}
  yuv.gb -= sourceUV*yuv.r;
  yuv.gb += targetUV*(yuv.r);
  vec3 rgb = yuv2rgb(yuv);
  return vec4(rgb, 1.0);
}
`;
