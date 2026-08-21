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
  fGetRandomPaint,
  fRGBToYUV,
  fYUVToRGB,
  tPaint,
} from "../utils/CLAcolor";
import { useRunOnJS, useSharedValue } from "react-native-worklets-core";
import { useBucketContext } from "../Buckets/BucketContext";
import { useIVerse } from "../utils/iVerse";
import { tTemp, kelvin_table, fGetTempFromUV } from "./KelvinTemp";
import PanManager, { ePanEvent } from "../Contexts/PanManager";
import { ThermSelect } from "./ThermSelect";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { GlassView } from "expo-glass-effect";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { PetalButton } from "../Buttons/PetalButton";
import { PaintChip } from "../Chips/PaintChip";
import { ReplacementMeter } from "./ReplacementMeter";

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

  const vTargetPaint = useIVerse<tPaint>(fGetRandomPaint());
  const vPaint = useSharedValue<SkPaint>(Skia.Paint());

  const frameSize = useSharedValue([0, 0]);
  const vSourceTemp = useIVerse<tTemp>(kelvin_table[6500]);
  const vTargetTemp = useIVerse<tTemp>(kelvin_table[6500]);
  const vWhiteSample = useIVerse([1, 1, 1]);
  const vWhiteSampleBuffer = useIVerse([1, 1, 1]);
  const vThreshold = useVerse(0.05);
  function resetShader(dimensions?: [number, number]) {
    let source = fYUVToRGB([1, vSourceTemp.state.u, vSourceTemp.state.v]);
    source = source.map((c) => c / 255) as [number, number, number];
    console.log(
      "Resetting shader with target color:",
      vTargetPaint.state.clar,
      "Source Temp:",
      source,
      "Target Temp:",
      vTargetTemp.state.k,
      "Threshold:",
      vThreshold.state,
    );
    frameSize.value = dimensions ?? frameSize.value;
    const replacementYUV = fCLARColorToYUV(
      vTargetPaint.state.clar,
      vColorModel.state,
    );
    const filter = Skia.RuntimeEffect.Make(shaderCode);
    const builder = Skia.RuntimeShaderBuilder(filter);
    builder.setUniform("replacementYUV", replacementYUV);
    builder.setUniform("center", [
      frameSize.value[0] / 2,
      frameSize.value[1] / 2,
    ]);
    builder.setUniform("whiteSample", source);
    builder.setUniform(
      "targetWhite",
      vTargetTemp.state.rgb.map((c) => c / 255) as [number, number, number],
    );
    builder.setUniform("threshold", [vThreshold.state]);
    const rtShader = Skia.ImageFilter.MakeRuntimeShader(builder, null, null);
    vPaint.value.setImageFilter(rtShader);
  }
  const runResetShader = useRunOnJS(resetShader, []);
  useEffect(() => {
    resetShader();
  }, [
    vTargetPaint.state.clar,
    vTargetTemp.state,
    vSourceTemp.state,
    vThreshold.state,
  ]);

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
    vWhiteSampleBuffer.shared.value = sample as [number, number, number];
  }, []);

  if (!device) return <View />;

  const { registerBucket, unregisterBucket, vDropScreen } = useBucketContext();
  useEffect(() => {
    registerBucket({
      origin: [SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2],
      radii: [150, 400],
      rotationR: 0,
      callback: (paint) => {
        vTargetPaint.dispatch(paint);
      },
      targetLayerRange: [0, 1000],
      icon: "search",
      id: 20,
    });
    return () => unregisterBucket("" + 20);
  }, []);

  const [camActive, setCamActive] = useState(true);
  const dropScreenRelay = useVerseRelay(vDropScreen);
  useEffect(() => {
    if (dropScreenRelay.state) {
      setCamActive(false); //Freeze cam when drop screen is active for performance
    } else {
      setCamActive(true);
    }
  }, [dropScreenRelay.state]);
  const { vAccentC, vAccentL, vAccentAR } = useUserContext();
  useEffect(() => {
    const { c, l, ar } = vTargetPaint.state.clar;
    vAccentC.dispatch(c);
    vAccentL.dispatch(l);
    vAccentAR.dispatch(ar);
  }, [vTargetPaint.state.clar]);
  function fAddThreshold(value: number) {
    "worklet";
    vThreshold.dispatch(vThreshold.shared.value + value);
  }

  return (
    <>
      <ThermSelect
        mainRotationR={11 / 7}
        size={40}
        tempK={vTargetTemp.state.k}
        setTemp={(temp) => vTargetTemp.dispatch(temp)}
        origin={[SCREEN_WIDTH - 50, SCREEN_HEIGHT / 2]}
      />
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
      <ReplacementMeter
        activePaint={vTargetPaint.state}
        layer={eLayers.colorMixer}
        origin={[SCREEN_WIDTH - 150, 150]}
        setThreshold={fAddThreshold}
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
export const shaderCode = /* glsl */ `
uniform shader image;
uniform vec3 replacementYUV;
uniform vec2 center;
uniform half threshold;
uniform vec3 whiteSample;
uniform vec3 targetWhite;
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
vec3 whiteBalance(vec3 color) {
      vec3 balanced = vec3(
        color.r / whiteSample.r,
        color.g / whiteSample.g,
        color.b / whiteSample.b
      );
    //  balanced = color + (color-balanced)*2;
      float y = rgb2yuv(color).r;
      balanced = mix(color, balanced, y);
      return balanced;
    }

vec4 UVRange(vec2 pos) {
  vec4 uvRange = vec4(0, 0, 0, 0);

  for(int x = -4; x <= 4; x++) {
    for(int y = -4; y <= 4; y++) {
      vec2 offset = vec2(float(x), float(y)) ;
      vec4 color = image.eval(pos + offset);
     // color.rgb = whiteBalance(color.rgb);
      vec3 yuv = rgb2yuv(color.rgb);
      uvRange.x = min(uvRange.x, yuv.g);
      uvRange.y = max(uvRange.y, yuv.g);
      uvRange.z = min(uvRange.z, yuv.b);
      uvRange.w = max(uvRange.w, yuv.b);
      }
    }
    uvRange.x -= threshold;
    uvRange.y += threshold;
    uvRange.z -= threshold;
    uvRange.w += threshold;
  return uvRange ;
}
vec3 posterize(vec3 color, float levels) {
  color = floor(color * levels) / levels;
  return color;
}
 

half4 main(vec2 pos) {  
  float centerDist = distance(pos, center)/center.y;
  if(centerDist < .02 ) {
    return image.eval(pos);
  }
  vec3 sampleRGB = image.eval(pos).rgb;
  vec3 sampleYUV = rgb2yuv(sampleRGB);
  vec3 bSampleRGB = whiteBalance(sampleRGB);
  vec3 bCenterRGB = whiteBalance(image.eval(center).rgb);
  vec3 bCenterYUV = rgb2yuv(bCenterRGB);
  vec3 bSampleYUV = rgb2yuv(bSampleRGB);
  float angle = atan(bSampleYUV.g, bSampleYUV.b);
  float centerAngle = atan(bCenterYUV.g, bCenterYUV.b);
  float dist = abs(angle - centerAngle) / 3.14;
  dist = min(dist, distance(sampleYUV.gb, bCenterYUV.gb));
  dist = clamp(dist, 0.0, 1.0);
  dist = (threshold) - dist;
  if(dist > 0) {
    bSampleYUV.r  *= replacementYUV[0]*(2);
    bSampleYUV.g = mix(bSampleYUV.g, replacementYUV[1], 1);
    bSampleYUV.b = mix(bSampleYUV.b, replacementYUV[2], 1);
}
  vec3 color = yuv2rgb(bSampleYUV);
  color.r *= targetWhite.r;
  color.g *= targetWhite.g;
  color.b *= targetWhite.b;
  return half4(color, 1.0);
}
`;
