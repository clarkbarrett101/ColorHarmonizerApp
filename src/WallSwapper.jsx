import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useSkiaFrameProcessor,
  useFrameProcessor,
} from "react-native-vision-camera";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from "react-native";
import { Skia, float } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-worklets-core";
import TutorialBox from "./TutorialBox";
import InfoIcon from "./InfoIcon";
import {
  Svg,
  LinearGradient,
  Rect,
  Stop,
  Path,
  Defs,
  Circle,
} from "react-native-svg";

function WallSwapper({
  assignedColor,
  setAssignedColor,
  swatches,
  selectedColor = [0, 49, 50],
  setSelectedColor,
  isDragging,
}) {
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
  `);

  const camera = useRef(null);
  const device = useCameraDevice("back");
  const shaderBuilder = Skia.RuntimeShaderBuilder(invertColorsFilter);
  const [replacementYUV, setReplacementYUV] = useState([128, 0, 0]);
  shaderBuilder.setUniform("replacementYUV", [...replacementYUV]);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  let sizeMod = 1;
  if (screenHeight > screenWidth * 2) {
    sizeMod = screenWidth;
  } else {
    sizeMod = screenHeight;
  }
  const fontMod = sizeMod / 400;
  const startThreshold = 0.05;
  shaderBuilder.setUniform("threshold", [0.05]);
  const [threshold, setThreshold] = useState(0.05);
  const sharedCenter = useSharedValue([960, 540]);
  shaderBuilder.setUniform("center", [...sharedCenter.value]);
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
  }, []);

  useEffect(() => {
    resetShader();
  }, [replacementYUV, sharedCenter, threshold]);
  useEffect(() => {
    if (!assignedColor && swatches.length > 0) {
      setAssignedColor(swatches[0]);
    }
  }, []);
  useEffect(() => {
    if (assignedColor) {
      setReplacementYUV(assignedColor.yuv.map((v) => v / 255));
      setSelectedColor(assignedColor.hsluv);
    }
  }, [assignedColor]);

  function resetShader() {
    const shaderBuilder = Skia.RuntimeShaderBuilder(invertColorsFilter);
    shaderBuilder.setUniform("replacementYUV", [...replacementYUV]);
    shaderBuilder.setUniform("center", [...sharedCenter.value]);
    shaderBuilder.setUniform("threshold", [threshold]);
    const imageFilter = Skia.ImageFilter.MakeRuntimeShader(
      shaderBuilder,
      null,
      null
    );
    const newPaint = Skia.Paint();
    newPaint.setImageFilter(imageFilter);
    paint.value = newPaint;
  }
  const textStyles = {
    color: "black",
    fontSize: 16 * fontMod,
    textAlign: "center",
    fontFamily: "-",
  };
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return true;
    },
    onPanResponderMove: (evt, gestureState) => {
      setThreshold(
        Math.max(0.001, Math.min(0.5, threshold - gestureState.dy / sizeMod))
      );
    },
  });
  return (
    <View
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Camera
        fps={30}
        ref={camera}
        device={device}
        frameProcessor={skiaFrameProcessor}
        pixelFormat="rgb"
        isActive={true}
        style={{
          flex: 1,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <View
        style={{
          borderRadius: 100,
          width: screenWidth / 10,
          height: screenWidth / 10,
          borderColor: assignedColor ? assignedColor.hex : "black",
          borderWidth: 5,
          position: "absolute",
          top: screenHeight / 2 - screenWidth / 20,
          left: screenWidth / 2 - screenWidth / 20,
        }}
      />
      {assignedColor && assignedColor.name ? (
        <View
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            top: 0,
            right: 0,
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            borderRadius: 30,
            padding: screenWidth / 30,
            margin: screenWidth / 10,
          }}
        >
          <Text
            adjustsFontSizeToFit={true}
            numberOfLines={1}
            style={[
              textStyles,
              {
                fontSize: (16 * screenWidth) / 400,
              },
            ]}
          >
            {"Replacement Color:"}
          </Text>
          <View
            style={{
              backgroundColor: assignedColor.hex,
              padding: 20,
              borderRadius: 20,
              shadowColor: "black",
              shadowOffset: {
                width: 0,
                height: 5,
              },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              margin: 10,
            }}
          >
            <Text
              adjustsFontSizeToFit={true}
              numberOfLines={1}
              style={[
                textStyles,
                {
                  color: assignedColor.hsluv[2] > 50 ? "black" : "white",
                },
              ]}
            >
              {assignedColor.name}
            </Text>
            <Text
              adjustsFontSizeToFit={true}
              numberOfLines={1}
              style={[
                textStyles,
                {
                  color: assignedColor.hsluv[2] > 50 ? "black" : "white",
                  fontSize: 10 * fontMod,
                  fontFamily: "Outfit",
                },
              ]}
            >
              {"(" + assignedColor.brand + ")"}
            </Text>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPressIn={() => setThreshold(threshold / 1.1)}
              style={{
                padding: 10,
                borderRadius: 30,
                paddingLeft: 15,
                paddingRight: 15,
                backgroundColor: assignedColor
                  ? assignedColor.hex
                  : "hsl{${selectedColor}, 60%, 65%}",
                shadowColor: "black",
                shadowOffset: {
                  width: 0,
                  height: 0,
                },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
            >
              <Text
                adjustsFontSizeToFit={true}
                numberOfLines={2}
                style={[
                  textStyles,
                  {
                    fontSize: 12 * fontMod,
                    color: assignedColor.hsluv[2] > 50 ? "black" : "white",
                  },
                ]}
              >
                {"Replace \nLess"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPressIn={() => setThreshold(threshold * 1.1)}
              style={{
                padding: 10,
                borderRadius: 30,
                paddingLeft: 15,
                paddingRight: 15,
                marginLeft: 10,
                backgroundColor: assignedColor.hex,
                shadowColor: "black",
                shadowOffset: {
                  width: 0,
                  height: 0,
                },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
            >
              <Text
                adjustsFontSizeToFit={true}
                numberOfLines={2}
                style={[
                  textStyles,
                  {
                    fontSize: 12 * fontMod,
                    color: assignedColor.hsluv[2] > 50 ? "black" : "white",
                  },
                ]}
              >
                {"Replace \nMore"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
      <TutorialBox
        text={
          swatches.length > 0
            ? "Drag a paint swatch from your palette and point the camera at a surface to see what it would look like in that color."
            : "Add paint swatch to your palette to get started."
        }
        style={{
          position: "absolute",
          top: screenHeight / 5,
          left: screenWidth / 2 - sizeMod * 0.5,
          zIndex: 100,
          width: sizeMod,
          height: sizeMod / 2,
        }}
        width={sizeMod}
        height={sizeMod / 2}
        textStyle={{
          fontSize: 20 * fontMod,
          textAlign: "center",
          top: 0,
          width: sizeMod,
          height: sizeMod * 0.5,
          padding: sizeMod * 0.1,
          paddingVertical: sizeMod * 0.12,
          zIndex: 100,
          fontFamily: "-",
          position: "absolute",
        }}
        isOpen={tutorialOpen}
        setOpen={setTutorialOpen}
        selectedColor={selectedColor}
      />
      <TouchableOpacity
        style={{
          position: "absolute",
          zIndex: 100,
          padding: 10,
          borderRadius: 100,
          top: screenHeight * 0.2 - sizeMod * 0.1,
          left: 0,
          width: sizeMod * 0.1,
          height: sizeMod * 0.1,
        }}
        onPressIn={() => {
          setTutorialOpen(!tutorialOpen);
        }}
      >
        <InfoIcon
          width={sizeMod * 0.1}
          height={sizeMod * 0.1}
          style={{
            left: 0,
            top: 0,
          }}
          selectedColor={selectedColor}
        />
      </TouchableOpacity>
    </View>
  );
}

export default WallSwapper;
