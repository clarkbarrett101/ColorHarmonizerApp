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
  Canvas,
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

import { fCLARColorToYUV } from "./CLAcolor";
import { useRunOnJS, useSharedValue } from "react-native-worklets-core";
import { useBucketContext } from "./BucketContext";

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

  const [targetColor, setTargetColor] = useState({
    ar: 22 / 7,
    c: 0.5,
    l: 0.5,
  });
  const vPaint = useSharedValue<SkPaint>(Skia.Paint());

  const frameSize = useSharedValue([0, 0]);
  function resetShader(dimensions?: [number, number]) {
    frameSize.value = dimensions ?? frameSize.value;
    const replacementYUV = fCLARColorToYUV(targetColor);
    const filter = Skia.RuntimeEffect.Make(shaderCode);
    const builder = Skia.RuntimeShaderBuilder(filter);
    builder.setUniform("replacementYUV", replacementYUV);
    builder.setUniform("center", [
      frameSize.value[0] / 2,
      frameSize.value[1] / 2,
    ]);
    builder.setUniform("threshold", [0.025]);
    const rtShader = Skia.ImageFilter.MakeRuntimeShader(builder, null, null);
    vPaint.value.setImageFilter(rtShader);
  }
  const runResetShader = useRunOnJS(resetShader, []);
  useEffect(() => {
    resetShader();
  }, [targetColor]);
  const skfp = useSkiaFrameProcessor((frame) => {
    "worklet";
    if (frameSize.value[0] === 0) {
      runResetShader([frame.width, frame.height]);
    }
    frame.render(vPaint.value);
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
  return (
    <View style={{ flex: 1 }}>
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
    </View>
  );
}
const shaderCode = `
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
