import {
  Skia,
  Canvas,
  Shader,
  Fill,
  vec,
  useClock,
  ImageShader,
  useTexture,
  SkImage,
  Image,
  Group,
  RadialGradient,
  Rect,
} from "@shopify/react-native-skia";
import { use, useEffect, useRef } from "react";
import { Dimensions } from "react-native";
import {
  useDerivedValue,
  withRepeat,
  withTiming,
  useSharedValue,
  SharedValue,
  runOnUI,
  useAnimatedReaction,
} from "react-native-reanimated";
import { useRadialContext } from "./RadialContext";
import { fCLARColorToRGB, fCLARColorToString } from "./CLAcolor";

const source = Skia.RuntimeEffect.Make(`
  uniform float2 iResolution;
  uniform float iTime;
  uniform float iAR;
float3 fCLARToRGB(float c, float l) {
    float u = cos(iAR)*.5 * c;
    float v = sin(iAR)*.5 * c;
    float y = l;
    float r =max(0., y + 1.13983 * v);
    float g = max(0., y - 0.39465 * u - 0.58060 * v);
    float b = max(0., y + 2.03211 * u);
    return float3(r, g, b);
  }
  half4 main(float2 pos) {
    float2 uv = pos / iResolution.y;
    float dist = distance(uv, float2(1, 0.5));
    float wave = sin(dist*10 + iTime * -.010) * 0.25 + cos(dist * 20 + iTime * -.10) * 0.25 + 0.5;
    return half4(mix(fCLARToRGB(0.1, 0.9), fCLARToRGB(0.3, 0.8), wave), 1.0);
  }
`)!;

export function BGGradient() {
  const time = useClock();
  const { dAR, dC, dL } = useRadialContext();
  const density = 1;
  const dimensions = useSharedValue({
    width: Dimensions.get("window").width / density,
    height: Dimensions.get("window").height / density,
  });
  const dimensionsRef = useRef(dimensions.value);
  const colors = useDerivedValue(() => {
    const color1 = fCLARColorToString({
      c: 0.2 * dC.value,
      l: 0.5 + 0.3 * dL.value,
      ar: dAR.value,
    });
    const color2 = fCLARColorToString({
      c: 0.3 * dC.value,
      l: 0.4 + 0.3 * dL.value,
      ar: dAR.value,
    });
    return [color1, color2, color1];
  });
  return (
    <Canvas
      style={{
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
        position: "absolute",
        left: 0,
        top: 0,
      }}
    >
      <Rect
        x={0}
        y={0}
        width={dimensionsRef.current.width}
        height={dimensionsRef.current.height}
      >
        <RadialGradient
          c={vec(dimensionsRef.current.width, dimensionsRef.current.height / 2)}
          r={dimensionsRef.current.width}
          colors={colors}
        />
      </Rect>
    </Canvas>
  );
}
