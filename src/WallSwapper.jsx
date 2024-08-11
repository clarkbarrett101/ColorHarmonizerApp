import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useSkiaFrameProcessor,
} from "react-native-vision-camera";
import { Skia } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-worklets-core";
function WallSwapper({ assignedColor }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);
  const invertColorsFilter = Skia.RuntimeEffect.Make(`
    uniform shader image;
    uniform vec3 replacementYUV;
    uniform vec2 center;
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
        vec4 color = image.eval(pos);
        vec3 yuv = rgb2yuv(color.rgb);
        vec2 uv = vec2(yuv[1], yuv[2]);
        vec3 targetColor = image.eval(pos-pos+center).rgb;
        vec3 targetYUV = rgb2yuv(targetColor);
        vec2 targetUV = vec2(targetYUV[1], targetYUV[2]);
        float dist = distance(targetUV, uv);
        if(dist < 0.05) {
          yuv[0] *= replacementYUV[0];
            yuv[1] = replacementYUV[1];
            yuv[2] = replacementYUV[2];

        }
       return half4(yuv2rgb(yuv), color.a);
        
    }
  `);

  const camera = useRef(null);
  const device = useCameraDevice("back");

  const shaderBuilder = Skia.RuntimeShaderBuilder(invertColorsFilter);
  shaderBuilder.setUniform("replacementYUV", [128, 0, 0]);
  shaderBuilder.setUniform("center", [300, 300]);
  const sharedCenter = useSharedValue([300, 300]);
  const imageFilter = Skia.ImageFilter.MakeRuntimeShader(
    shaderBuilder,
    null,
    null
  );
  const paint = useSharedValue(Skia.Paint());
  paint.value.setImageFilter(imageFilter);
  const skiaFrameProcessor = useSkiaFrameProcessor((frame) => {
    "worklet";
    frame.render(paint.value);
    const centerX = frame.width / 2;
    const centerY = frame.height / 2;
    sharedCenter.value = [centerX, centerY];
    const rect = Skia.XYWHRect(centerX - 10, centerY - 10, 20, 20);
    const newPaint = Skia.Paint();
    newPaint.setColor(Skia.Color("red"));
    frame.drawRect(rect, newPaint);
  }, []);
  useEffect(() => {
    if (assignedColor === null) {
      return;
    }
    console.log(assignedColor.yuv);
    const shaderBuilder = Skia.RuntimeShaderBuilder(invertColorsFilter);
    const yuvNormalized = assignedColor.yuv.map((v) => v / 255);
    shaderBuilder.setUniform("replacementYUV", yuvNormalized);
    shaderBuilder.setUniform("center", [...sharedCenter.value]);
    const imageFilter = Skia.ImageFilter.MakeRuntimeShader(
      shaderBuilder,
      null,
      null
    );
    const newPaint = Skia.Paint();
    newPaint.setImageFilter(imageFilter);
    paint.value = newPaint;
  }, [assignedColor, sharedCenter]);
  return (
    <Camera
      fps={30}
      ref={camera}
      device={device}
      frameProcessor={skiaFrameProcessor}
      pixelFormat="rgb"
      isActive={true}
      style={{ flex: 1 }}
    />
  );
}

export default WallSwapper;
