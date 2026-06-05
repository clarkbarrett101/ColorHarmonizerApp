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
} from "react-native-vision-camera";
import {
  Canvas,
  Image,
  Paint,
  Skia,
  SkImage,
  SkSurface,
  useAnimatedImage,
  useCanvasRef,
} from "@shopify/react-native-skia";
import { useEffect, useRef, useState } from "react";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";
import { fCLARColorToYUV } from "./CLAcolor";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
export function useMinimalDrawingFrameProcessor() {
  const skiaTexture = useSharedValue<SkImage | null>(null);
  const pendingTexture = useSharedValue<SkSurface>(
    Skia.Surface.MakeOffscreen(SCREEN_WIDTH, SCREEN_HEIGHT)!,
  );
  const frameCount = useSharedValue(0);

  const frameProcessor = useFrameProcessor((frame: Frame) => {
    "worklet";

    try {
      frameCount.value++;
      if (frameCount.value % 3 !== 0) return;

      const nativeBuffer = frame.getNativeBuffer();
      if (!nativeBuffer?.pointer) return;

      // Create image from frame buffer first
      const frameImage = Skia.Image.MakeImageFromNativeBuffer(
        nativeBuffer.pointer,
      );
      nativeBuffer.delete(); // Important: delete the native buffer after creating the image
      if (!frameImage) return;

      const copy = frameImage.makeNonTextureImage();
      pendingTexture.value.getCanvas().drawImage(copy, 0, 0);
      frameImage.dispose(); // Important: dispose the copy too
    } catch (error) {
      // Ignore
    }
  }, []);

  useFrameCallback(() => {
    "worklet";

    const pending = pendingTexture.value;
    if (!pending) return;

    pendingTexture.value = null;

    if (skiaTexture.value) {
      skiaTexture.value.dispose();
    }

    skiaTexture.value = pending.makeImageSnapshot();
  });

  return { frameProcessor, skiaTexture };
}
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

  const [targetColor, setTargetColor] = useState({ ar: 0, c: 0.5, l: 0.5 });
  const { frameProcessor, skiaTexture } = useMinimalDrawingFrameProcessor();

  const skfp = useSkiaFrameProcessor((frame) => {
    "worklet";
    // Here you can process the frame and update skiaTexture with a new SkImage
    // For example, you could apply a shader that replaces colors close to targetColor
  }, []);

  if (!device) return <View />;

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        frameProcessor={skfp}
        preview={false} // Hide camera preview since we're drawing with Skia
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
