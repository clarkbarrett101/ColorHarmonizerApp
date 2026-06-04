import { GlassView } from "expo-glass-effect";
import { Dimensions, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useSkiaFrameProcessor,
} from "react-native-vision-camera";
import { ImageFilter, Paint, Skia } from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import { fCLARColorToYUV } from "./CLAcolor";

export function WallPaintCam() {
  const { hasPermission, requestPermission } = useCameraPermission();
  if (!hasPermission) {
    requestPermission();
    return null;
  }
  const device = useCameraDevice("back");
  if (device == null) return null;

  const [targetColor, setTargetColor] = useState({ ar: 0, c: 0.5, l: 0.5 });

  const paint = useSharedValue(Skia.Paint());
  const shaderEffect = Skia.RuntimeEffect.Make(shader);
  const [threshold, setThreshold] = useState(0.05);
  const sharedCenter = useSharedValue([960, 540]);
  useEffect(() => {
    resetShader();
  }, [targetColor, threshold, sharedCenter]);

  const skiaFrameProcessor = useSkiaFrameProcessor((frame) => {
    "worklet";
    console.log("Processing frame");
    frame.render(paint.value);
    const centerX = frame.width / 2;
    const centerY = frame.height / 2;
    sharedCenter.value = [centerX, centerY];
  }, []);
  function resetShader() {
    const replacementYUV = fCLARColorToYUV(targetColor);
    const shaderBuilder = Skia.RuntimeShaderBuilder(shaderEffect);
    shaderBuilder.setUniform("replacementYUV", [...replacementYUV]);
    shaderBuilder.setUniform("center", [...sharedCenter.value]);
    shaderBuilder.setUniform("threshold", [threshold]);
    const imageFilter = Skia.ImageFilter.MakeRuntimeShader(
      shaderBuilder,
      null,
      null,
    );
    const newPaint = Skia.Paint();
    newPaint.setImageFilter(imageFilter);
    paint.value = newPaint;
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: Dimensions.get("window").width,
          height: Dimensions.get("window").height,
        }}
      >
        <Camera
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: Dimensions.get("window").width,
            height: Dimensions.get("window").height,
          }}
          device={device}
          isActive={true}
          frameProcessor={skiaFrameProcessor}
        />
      </View>
      <GlassView
        style={{
          flex: 1,
          position: "absolute",
          top: Dimensions.get("window").height / 2 - 20,
          left: Dimensions.get("window").width / 2 - 20,
          width: 40,
          height: 40,
          borderRadius: 20,
        }}
        glassEffectStyle={"clear"}
      />
    </View>
  );
}
const shader = `
   uniform shader image;
    uniform vec3 replacementYUV;
    uniform vec2 center;
    uniform half threshold;
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

    half4 main(vec2 pos) {
    if(replacementYUV[0] > 100) {
    return image.eval(pos);
    }
        vec4 color = image.eval(pos);
        vec3 yuv = rgb2yuv(color.rgb);
        vec2 uv = vec2(yuv[1], yuv[2]);
        vec3 targetColor = image.eval(pos-pos+center).rgb;
        vec3 targetYUV = rgb2yuv(targetColor);
        vec2 targetUV = vec2(targetYUV[1], targetYUV[2]);
        float dist = distance(targetUV, uv);
        float lit = abs(yuv[0] - .5);
        float distVar = (threshold-dist) / threshold;
        distVar += lit*.25;
        if(distVar > 0) {
          yuv[0]*= yuv[0]/.5;
          yuv[0] *= replacementYUV[0];
        
            yuv[1] = replacementYUV[1];
            yuv[2] = replacementYUV[2];
  
        }
       return half4(yuv2rgb(yuv), color.a);
        
    }
`;
