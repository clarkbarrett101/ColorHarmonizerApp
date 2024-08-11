import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  useFrameProcessor,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { useSharedValue } from "react-native-worklets-core";
import { Hsluv } from "./hsluv.mjs";
import { View, Image, TouchableOpacity, Text } from "react-native";
import Svg, { Line, Circle } from "react-native-svg";

export default function ChromaCamera({
  setCurrentPage,
  setAssignedColor,
  setAssignedColor2,
}) {
  const [savedHex, setSavedHex] = useState(null);
  const [hex, setHex] = useState("#000000");
  const [hue, setHue] = useState(0);
  const [savedHue, setSavedHue] = useState(0);
  const camera = useRef(null);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);
  const sharedRGB = useSharedValue([0, 0, 0]);
  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    if (frame.pixelFormat === "rgb") {
      const center = [frame.width / 2, frame.height / 2];

      const buffer = frame.toArrayBuffer();

      const pixels = new Uint8Array(buffer);

      let rgb = [0, 0, 0];
      rgb[2] = pixels[center[0] * 4 + center[1] * frame.width * 4];
      rgb[1] = pixels[center[0] * 4 + center[1] * frame.width * 4 + 1];
      rgb[0] = pixels[center[0] * 4 + center[1] * frame.width * 4 + 2];
      sharedRGB.value = rgb;
    }
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      const hsluv = new Hsluv();
      const rgb = sharedRGB.value;
      hsluv.rgb_r = rgb[0];
      hsluv.rgb_g = rgb[1];
      hsluv.rgb_b = rgb[2];
      hsluv.rgbToHsluv();
      hsluv.hsluv_s = 75;
      hsluv.hsluv_l = 75;
      hsluv.hsluvToHex();
      setHex(hsluv.hex);
      setHue(hsluv.hsluv_h);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  function gradientCirlce() {
    let circles = [];
    let hsluv = new Hsluv();
    hsluv.hsluv_l = 75;

    hsluv.hsluv_s = 100;
    for (let i = 0; i < 360; i += 1) {
      hsluv.hsluv_h = i;
      hsluv.hsluvToHex();
      circles.push(
        <Circle
          cx={128 + 100 * Math.cos((i * Math.PI) / 180)}
          cy={128 + 100 * Math.sin((i * Math.PI) / 180)}
          r={5}
          fill={hsluv.hex}
        />
      );
    }

    return circles;
  }
  function getSavedColor() {
    return (
      <>
        <Circle
          cx={128 + 100 * Math.cos((savedHue * Math.PI) / 180)}
          cy={128 + 100 * Math.sin((savedHue * Math.PI) / 180)}
          r={10}
          stroke="black"
          strokeWidth="1"
          fill={savedHex}
        />

        <Line
          x1={128 + 10 * Math.cos((savedHue * Math.PI) / 180)}
          y1={128 + 10 * Math.sin((savedHue * Math.PI) / 180)}
          x2={128 + 90 * Math.cos((savedHue * Math.PI) / 180)}
          y2={128 + 90 * Math.sin((savedHue * Math.PI) / 180)}
          stroke="black"
          strokeWidth="1"
        />
      </>
    );
  }

  return (
    <View
      style={{
        display: "flex",
        flex: 1,
      }}
    >
      <Camera
        ref={camera}
        device={device}
        frameProcessor={frameProcessor}
        style={{ flex: 1 }}
        pixelFormat="rgb"
        isActive={true}
      ></Camera>
      <Svg
        height={256}
        width={256}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: [{ translateX: -128 }, { translateY: -128 }],
        }}
      >
        {gradientCirlce()}
        <Circle
          cx={128 + 100 * Math.cos((hue * Math.PI) / 180)}
          cy={128 + 100 * Math.sin((hue * Math.PI) / 180)}
          r={10}
          stroke="black"
          strokeWidth="1"
          fill={hex}
        />
        <Circle
          cx={128}
          cy={128}
          r={10}
          stroke="black"
          strokeWidth="1"
          fill={"rgb(" + sharedRGB.value.join(",") + ")"}
        />
        <Line
          x1={128 + 10 * Math.cos((hue * Math.PI) / 180)}
          y1={128 + 10 * Math.sin((hue * Math.PI) / 180)}
          x2={128 + 90 * Math.cos((hue * Math.PI) / 180)}
          y2={128 + 90 * Math.sin((hue * Math.PI) / 180)}
          stroke="black"
          strokeWidth="1"
        />
        {savedHex == null ? null : getSavedColor()}
      </Svg>
      <TouchableOpacity
        style={{
          backgroundColor: "rgba(0, 125, 255, 1)",
          padding: 10,
          width: "100%",
          height: "5%",
          justifyContent: "center",
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          position: "absolute",
          top: 0,
        }}
        onPressIn={() => {
          if (savedHex == null) {
            setSavedHex(hex);
            setSavedHue(hue);
          } else {
            setAssignedColor({ hsluv: [hue, 75, 75], hex: hex });
            setAssignedColor2({ hsluv: [savedHue, 75, 75], hex: savedHex });
            setCurrentPage(1);
          }
        }}
      >
        <Text
          style={{
            textAlign: "center",
            color: "white",
            fontSize: 20,
            bottom: 0,
          }}
        >
          Save
        </Text>
      </TouchableOpacity>
    </View>
  );
}
