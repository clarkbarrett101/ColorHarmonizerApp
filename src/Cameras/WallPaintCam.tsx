import {
  Camera,
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
  fRGBToYUV,
} from "../utils/CLAcolor";
import { useRunOnJS, useSharedValue } from "react-native-worklets-core";
import { useBucketContext } from "../Buckets/BucketContext";
import { useIVerse } from "../utils/iVerse";
import { tTemp, kelvin_table } from "./KelvinTemp";
import PanManager from "../Contexts/PanManager";
import { ThermSelect } from "./ThermSelect";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { GlassView } from "expo-glass-effect";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function WallPaintCam() {
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
  const { vColorModel } = useUserContext();

  const [targetColor, setTargetColor] = useState({
    ar: 22 / 7,
    c: 0.5,
    l: 0.5,
  });
  const vPaint = useSharedValue<SkPaint>(Skia.Paint());

  const frameSize = useSharedValue([0, 0]);

  const vSourceTemp = useIVerse<tTemp>(kelvin_table[6000]);
  const vTargetTemp = useIVerse<tTemp>(kelvin_table[6000]);
  const vLightSample = useIVerse([1, 1, 1]);
  const vLightSampleBuffer = useIVerse([1, 1, 1]);
  function resetShader(dimensions?: [number, number]) {
    console.log(
      "Resetting shader with target color:",
      targetColor,
      "Light Sample:",
      vLightSample.state,
      "Target Temp:",
      vTargetTemp.state.k,
    );
    frameSize.value = dimensions ?? frameSize.value;
    const replacementYUV = fCLARColorToYUV(targetColor, vColorModel.state);
    const filter = Skia.RuntimeEffect.Make(shaderCode);
    const builder = Skia.RuntimeShaderBuilder(filter);
    builder.setUniform("replacementYUV", replacementYUV);
    builder.setUniform("center", [
      frameSize.value[0] / 2,
      frameSize.value[1] / 2,
    ]);
    builder.setUniform("lightSample", vLightSample.state);
    builder.setUniform("targetUV", [
      vTargetTemp.shared.value.u,
      vTargetTemp.shared.value.v,
    ]);
    builder.setUniform("threshold", [0.05]);
    const rtShader = Skia.ImageFilter.MakeRuntimeShader(builder, null, null);
    vPaint.value.setImageFilter(rtShader);
  }
  const runResetShader = useRunOnJS(resetShader, []);
  useEffect(() => {
    resetShader();
  }, [targetColor, vSourceTemp.state, vTargetTemp.state, vLightSample.state]);

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
    sample = sample.map((c) => c / 255);
    const yuv = fRGBToYUV(sample as [number, number, number]);
    vLightSampleBuffer.shared.value = sample as [number, number, number];
  }, []);

  if (!device) return <View />;
  const { registerBucket, unregisterBucket } = useBucketContext();
  useEffect(() => {
    registerBucket({
      origin: [SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2],
      radii: [150, 400],
      rotationR: 0,
      callback: (paint) => {
        setTargetColor(paint.clar);
      },
      targetLayerRange: [0, 1000],
      id: 20,
    });
    return () => unregisterBucket("" + 20);
  }, []);
  const fill = fCLARColorToString(
    {
      c: kelvin_table[vSourceTemp.state.k].c,
      l: 0.8,
      ar: kelvin_table[vSourceTemp.state.k].ar,
    },
    vColorModel.state,
  );
  return (
    <>
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
      <Camera
        device={device}
        isActive={true}
        style={{ flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
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
uniform vec3 replacementYUV;
uniform vec2 center;
uniform half threshold;
uniform vec3 lightSample;
uniform vec2 targetUV;
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
bool isSameYUV(vec3 yuv1, vec3 yuv2) {
  if(abs(yuv1.g - yuv2.g) < 0.1 && abs(yuv1.b - yuv2.b) < 0.1) {
    return true;
  }
  return false;
}
float boxAverage(vec2 pos, vec3 compYUV) {
  float minDist = 1000.0;
  for(int x = -1; x <= 1; x++) {
    for(int y = -1; y <= 1; y++) {
      vec2 offset = vec2(float(x), float(y)) ;
      vec4 color = image.eval(pos + offset);
      vec3 yuv = rgb2yuv(color.rgb);
      float dist = distance(compYUV.gb, yuv.gb); 
      if(abs(yuv.r - compYUV.r) > .5) {
          dist *=2.0;
      }
      minDist = min(minDist, dist);
    }
  }
  return minDist;
}
vec3 averageYUV(vec2 pos) {
  vec3 avgYUV = vec3(0,0,0);
  for(int x = -2; x <= 2; x++) {
    for(int y = -2; y <= 2; y++) {
      vec2 offset = vec2(float(x), float(y)) ;
      vec4 color = image.eval(pos + offset);
      vec3 yuv = rgb2yuv(color.rgb);
      avgYUV += yuv;
      }
    }
  return avgYUV / 25.0;
}
bool edgeDetect(vec2 pos) {
  vec3 yuv = rgb2yuv(image.eval(pos).rgb);
  for(int x = -1; x <= 1; x++) {
    for(int y = -1; y <= 1; y++) {
      vec2 offset = vec2(float(x), float(y)) ;
      vec4 color = image.eval(pos + offset);
      if(distance(yuv, rgb2yuv(color.rgb)) > threshold) {
        return true;
      }
    }
  }
  return false; 
}
  float stdDev(vec2 pos, vec3 avgYUV) {
    float sum = 0.0;
    for(int x = -2; x <= 2; x++) {
      for(int y = -2; y <= 2; y++) {
        vec2 offset = vec2(float(x), float(y)) ;
        vec4 color = image.eval(pos + offset);
        vec3 yuv = rgb2yuv(color.rgb);
        sum += distance(yuv, avgYUV);
      }
    }
    return sum / 25.0;
  }
    vec3 lightBalance(vec3 color) {
      vec3 balanced = vec3(
        color.r / lightSample.r,
        color.g / lightSample.g,
        color.b / lightSample.b
      );
      return balanced;
    }

half4 main(vec2 pos) {  
  if(distance(pos, center) < 10 ) {
    return image.eval(pos);
  }
  vec3 color = image.eval(pos).rgb;
  vec3 lightYUV = rgb2yuv(lightSample);
  vec3 adjColor = lightBalance(color);
  vec3 adjCenter = lightBalance(image.eval(center).rgb);
  vec3 centerYUV = rgb2yuv(adjCenter);
  vec3 yuv = rgb2yuv(color);
  adjColor +=  adjColor - color;
adjColor = mix(color, adjColor,  yuv.r);
//return half4(adjColor, 1.0);
 vec3 adjYUV = rgb2yuv(adjColor);
  vec3 avg = averageYUV(pos);
  float dist = boxAverage(pos, centerYUV);
  dist = distance(centerYUV.gb, adjYUV.gb);
  vec2 diff = yuv.gb - adjYUV.gb;
  diff *= 5;
 //return half4(yuv2rgb(vec3(yuv.r, diff)), 1.0);
  float std = stdDev(pos, avg)*5;
  dist *= 1.0 + std;
  float distVar = (threshold-dist) / threshold; 
  float lit = abs(yuv[0] - .5);
  distVar += lit*.25;
  distVar = clamp(distVar, 0, 1);
  if(distVar > 0) {
    yuv[0]  *= replacementYUV[0]*2;
    yuv[1] = mix(replacementYUV[1], yuv[1], floor((1-distVar)*(1-distVar)));
    yuv[2] = mix(replacementYUV[2], yuv[2], floor((1-distVar)*(1-distVar)));
  }
  if(pos.y > center.y) {
    return half4(yuv2rgb(yuv), 1.0);
  }
  return half4(yuv2rgb(yuv), 1.0);
}
`;
