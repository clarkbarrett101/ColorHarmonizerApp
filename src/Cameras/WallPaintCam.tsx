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
import React from "react";
import {
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
  G,
  Circle,
  Path,
  Text,
} from "react-native-svg";
import { PetalBox } from "../Buttons/PetalBox";
import { fTextWrapSVG } from "../Buttons/Tutorial";
import { useDerivedValue } from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WallPaintCam() {
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
  const vTargetTemp = useIVerse<tTemp>(kelvin_table[6500]);
  const vThreshold = useVerse(0.05);
  function resetShader(dimensions?: [number, number]) {
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
  }, [vTargetPaint.state.clar, vTargetTemp.state, vThreshold.state]);

  const skfp = useSkiaFrameProcessor((frame) => {
    "worklet";

    if (frameSize.value[0] === 0) {
      runResetShader([frame.width, frame.height]);
    }
    frame.render(vPaint.value);
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
      setCamActive(false);
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
    console.log("Adding threshold:", vThreshold.shared.value * (1 + value));
    vThreshold.dispatch(vThreshold.shared.value * (1 + value));
  }
  const dAR = useDerivedValue(() => vTargetTemp.shared.value.ar);
  const dC = useDerivedValue(() => vTargetTemp.shared.value.c);
  const dL = useDerivedValue(() => 1);

  return (
    <>
      <ThermSelect
        mainRotationR={11 / 7}
        radius={35}
        tempK={vTargetTemp.state.k}
        setTemp={(temp) => vTargetTemp.dispatch(temp)}
        origin={[50, SCREEN_HEIGHT / 2 - 100]}
        arcLength={2 / 7}
      />
      <PetalBox
        origin={[50, SCREEN_HEIGHT / 2 - 105]}
        radii={[0, 80]}
        arcLength={3 / 7}
        rotationR={-11 / 7}
        dAR={dAR}
        dC={dC}
        dL={dL}
        layer={eLayers.colorMixer}
      >
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="rgb(255,200,0)" stopOpacity="1" />
            <Stop offset="55%" stopColor="rgb(255,255,200)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgb(175,255,255)" stopOpacity="1" />
          </LinearGradient>
          <RadialGradient id="radGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="30%" stopColor="black" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgb(150,150,150)" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <G transform={[{ rotate: 11 / 7 + "rad" }]}>
          <Text
            x="-32"
            y="-0"
            fontSize="15"
            opacity=".6"
            fill="black"
            fontFamily="Outfit"
            baselineShift="middle"
            verticalAlign="middle"
          >
            Color Tint
          </Text>
          <Circle cx="0" cy="-50" r="40" fill="url(#radGrad)" opacity="0.5" />
          <Path
            transform={[{ translateX: 0 }, { translateY: -50 }]}
            fill="url(#grad)"
            stroke="black"
            strokeWidth={0.5}
            strokeOpacity={0.3}
            d="M-13-28C-15-28-16-27-16-25V-21H-14V-25H-12V18A4 4 90 01-9 22 4 4 90 01-13 26 4 4 90 01-17 22 4 4 90 01-14 18V-21H-16V17H-16C-18 18-19 20-19 22-19 26-16 28-13 28S-7 26-7 22C-7 20-8 18-10 17H-10V-25C-10-27-11-28-13-28ZM0-26C-2-24-4-21-6-19A74 74 90 01-8-20V-17C-5-18-3-18 0-18 10-18 18-11 18 0 18 10 10 18 0 18-2 18-3 18-5 18A9 9 90 01-4 21 77 77 90 010 26C0 26 5 18 5 18 5 18 13 22 13 22 13 22 14 14 14 14A76 76 90 0122 13C22 13 18 5 18 5 18 5 26 0 26 0 26 0 18-6 18-6 18-6 22-13 22-13 14-14 22-13 14-14A76 76 90 0113-23C13-23 5-19 5-19 5-19 0-26 0-26ZM-16-20V-18H-12V-16H-16ZM0-16C-3-16-5-16-8-15V15C-5 16-4 16 0 16 9 16 16 9 16 0 16-9 9-16 0-16ZM-18-14A77 77 90 01-23-13C-23-13-19-6-19-6-19-6-26 0-26 0-26 0-19 5-19 5-19 5-23 13-23 13-21 13-19 13-18 13V6A18 18 90 01-19 0 18 18 90 01-18-6V-14ZM-16-10V-10H-12V-8H-16ZV-1H-12V1H-16ZV8H-12V10H-16ZM-13 19C-15 18-17 21-16 23-16 21-14 19-13 19Z"
          />
        </G>
      </PetalBox>
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
        origin={[SCREEN_WIDTH - 125, SCREEN_HEIGHT / 2 + 150]}
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
  float compAngle = atan(compYUV.g, compYUV.b);
  for(int x = -1; x <= 1; x++) {
    for(int y = -1; y <= 1; y++) {
      vec2 offset = vec2(float(x), float(y)) ;
      vec4 color = image.eval(pos + offset);
      vec3 yuv = rgb2yuv(color.rgb);
float sampleAngle = atan(yuv.g, yuv.b);
      //float dist = distance(compYUV.gb, yuv.gb); 
      float dist = abs(compAngle - sampleAngle);
      if(abs(yuv.r - compYUV.r) > .5) {
          dist *=2.0;
      }
      minDist = min(minDist, dist);
    }
  }
  return minDist;
}    

vec4 UVRange(vec2 pos) {
  vec4 uvRange = vec4(1, -1, 1, -1);

  for(int x = -4; x <= 4; x++) {
    for(int y = -4; y <= 4; y++) {
      vec2 offset = vec2(float(x), float(y)) ;
      vec4 color = image.eval(pos + offset);
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
  float centerDist = distance(pos, center);
  if(centerDist < 40 ) {
    return image.eval(pos);
  }
  vec3 sampleRGB = image.eval(pos).rgb;
  vec3 sampleYUV = rgb2yuv(sampleRGB);
  float angle = atan(sampleYUV.g, sampleYUV.b);
  vec3 centerYUV = rgb2yuv(image.eval(center).rgb);
 vec4 yuvRange = UVRange(center);
  /*
  float centerAngle = atan(centerYUV.g, centerYUV.b);
  float dist = abs(angle - centerAngle) / 3.14;
  dist = boxAverage(pos, centerYUV);
  dist = clamp(dist, 0.0, 1.0);
  dist = (threshold) - dist;
  if(dist > 0) {
    */
   if(sampleYUV.g > yuvRange.x && sampleYUV.g < yuvRange.y && sampleYUV.b > yuvRange.z && sampleYUV.b < yuvRange.w){
    sampleYUV.r  *= replacementYUV[0]*(2);
    sampleYUV.g = mix(sampleYUV.g, replacementYUV[1], 1);
    sampleYUV.b = mix(sampleYUV.b, replacementYUV[2], 1);
}
  vec3 color = yuv2rgb(sampleYUV);
  color.r *= targetWhite.r;
  color.g *= targetWhite.g;
  color.b *= targetWhite.b;
  return half4(color, 1.0);
}
`;
