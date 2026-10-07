import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useSkiaFrameProcessor,
} from "react-native-vision-camera";
import { View } from "react-native";
import { Skia, SkPaint } from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import {
  fCLARColorToYUV,
  fGetRandomPaint,
  fGetRandomPalette,
  tPaint,
} from "../utils/CLAcolor";
import { useRunOnJS, useSharedValue } from "react-native-worklets-core";
import { useBucketContext } from "../Buckets/BucketContext";
import { useIVerse } from "../utils/iVerse";
import { tTemp, kelvin_table, fGetTempFromUV } from "./KelvinTemp";
import { ThermSelect } from "./ThermSelect";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { GlassView } from "expo-glass-effect";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { ReplacementMeter } from "./ReplacementMeter";
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
import { PetalBoxSimple } from "../Buttons/PetalBox";
import { fTextWrapSVG, Tutorial } from "../Buttons/Tutorial";
import { useDerivedValue } from "react-native-reanimated";
import React from "react";
import { Paths } from "../utils/Paths";
import { cDimW, cDimH } from "../utils/ScreenDimensions";
import { useDemo } from "../Contexts/DemoContext";
import Button from "../Buttons/Button";
import { useChipContext } from "../Chips/ChipContext";

export default function ReColorCam() {
  const { hasPermission, requestPermission } = useCameraPermission();
  if (!hasPermission) {
    requestPermission();
    return null;
  }

  const device = useCameraDevice("back");

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

  //if (!device) return <View />;

  const { registerBucket, unregisterBucket, vDropScreen } = useBucketContext();
  useEffect(() => {
    registerBucket({
      origin: [cDimW(0.5), cDimH(0.5)],
      radii: [150, 400],
      rotationR: 0,
      callback: (paint) => {
        vTargetPaint.dispatch(paint);
      },
      targetLayerRange: [0, 1000],
      path: Paths.search,
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

  const { vAccentC, vAccentL, vAccentAR, pagesVisited, vUserPalette } =
    useUserContext();
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

  const vPagesVisitedRelay = useVerseRelay(pagesVisited);
  const { holdChip } = useChipContext();
  const { fPlaySequence } = useDemo();
  useEffect(() => {
    if (!pagesVisited.shared.value["ReColor Camera"]) {
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
          toPos: [cDimW(0.6), cDimH(0.5)],
          duration: 2000,
          callback: () => {
            "worklet";
            holdChip();
          },
        },
        {
          touching: 0,
          toPos: [cDimW(0.65) - 100, cDimH(0.65)],
          duration: 500,
        },
        {
          touching: 1,
          toPos: [cDimW(0.65) - 100, cDimH(0.65)],
          duration: 200,
        },
        {
          touching: 0,
          toPos: [cDimW(0.65) - 100, cDimH(0.65)],
          duration: 200,
        },
        {
          touching: 1,
          toPos: [cDimW(0.65) - 100, cDimH(0.65)],
          duration: 200,
        },

        {
          touching: 0,
          toPos: [cDimW(0.65) - 100, cDimH(0.65)],
          duration: 200,
        },
        {
          touching: 1,
          toPos: [cDimW(0.65) - 100, cDimH(0.65)],
          duration: 200,
        },
        {
          touching: 0,
          toPos: [cDimW(0.65) + 100, cDimH(0.65)],
          duration: 1000,
        },
        {
          touching: 1,
          toPos: [cDimW(0.65) + 100, cDimH(0.65)],
          duration: 200,
        },
        {
          touching: 0,
          toPos: [cDimW(0.65) + 100, cDimH(0.65)],
          duration: 200,
        },
        {
          touching: 1,
          toPos: [cDimW(0.65) + 100, cDimH(0.65)],
          duration: 200,
        },
        {
          touching: 0,
          toPos: [cDimW(0.65) + 100, cDimH(0.65)],
          duration: 200,
        },
        {
          touching: 1,
          toPos: [cDimW(0.65) + 100, cDimH(0.65)],
          duration: 200,
        },
        {
          touching: 0,
          toPos: [cDimW(0.65) + 100, cDimH(0.65)],
          duration: 200,
        },
        {
          touching: 1,
          toPos: [cDimW(0.65) + 100, cDimH(0.65)],
          duration: 200,
        },
        {
          touching: 0,
          toPos: [cDimW(0.65) + 100, cDimH(0.65)],
          duration: 1000,
        },
        {
          touching: 0,
          toPos: [50, cDimH(0.5) - 150],
          duration: 1000,
        },
        {
          touching: 1,
          toPos: [50, cDimH(0.65)],
          duration: 1000,
        },
        {
          touching: 1,
          toPos: [50, cDimH(0.5) - 100],
          duration: 1000,
        },
        {
          touching: 1,
          toPos: [50, cDimH(0.55)],
          duration: 1000,
        },
        {
          touching: 0,
          toPos: [50, cDimH(0.55)],
          duration: 300,
        },
        {
          touching: 0,
          toPos: [-100, cDimH(0.55)],
          duration: 300,
        },
      ]);
      pagesVisited.dispatch({
        ...pagesVisited.shared.value,
        "ReColor Camera": true,
      });
    }
  }, [vPagesVisitedRelay.state]);
  return (
    <>
      <Button
        path={Paths.replay}
        layer={eLayers.superMax}
        origin={[cDimW(0.1), cDimH(0.15)]}
        viewRadius={30}
        onPress={() => {
          pagesVisited.dispatch({
            ...pagesVisited.shared.value,
            "ReColor Camera": false,
          });
        }}
      />

      <ThermSelect
        mainRotationR={11 / 7}
        radius={cDimH(0.04)}
        tempK={vTargetTemp.state.k}
        setTemp={(temp) => vTargetTemp.dispatch(temp)}
        origin={[cDimH(0.05), cDimH(0.39)]}
        arcLength={2 / 7}
      />
      <PetalBoxSimple
        origin={[cDimH(0.05), cDimH(0.34)]}
        size={[cDimH(0.1), cDimH(0.1)]}
        viewBox={[75, 75]}
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
        <G>
          <Text
            x="-32"
            y="32"
            fontSize="15"
            opacity=".6"
            fill="black"
            fontFamily="Outfit"
            verticalAlign="middle"
          >
            Color Tint
          </Text>
          <Circle cx="0" cy="-10" r="40" fill="url(#radGrad)" opacity="0.5" />
          <Path
            transform={[{ translateY: -10 }]}
            fill="url(#grad)"
            stroke="black"
            strokeWidth={0.5}
            strokeOpacity={0.3}
            d={Paths.thermo}
          />
        </G>
      </PetalBoxSimple>
      {device != null && (
        <Camera
          device={device}
          isActive={device != null}
          style={{
            position: "absolute",
            width: cDimW(),
            height: cDimH(),
            zIndex: 0,
          }}
          frameProcessor={skfp}
          fps={12}
        />
      )}
      <ReplacementMeter
        activePaint={vTargetPaint.state}
        layer={eLayers.colorMixer}
        origin={[cDimW(0.65), cDimH(0.65)]}
        setThreshold={fAddThreshold}
      />

      <GlassView
        style={{
          position: "absolute",
          top: cDimH(0.5) - 20,
          left: cDimW(0.5) - 20,
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
