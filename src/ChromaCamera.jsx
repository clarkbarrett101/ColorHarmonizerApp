import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  useFrameProcessor,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { useSharedValue } from "react-native-worklets-core";
import { Hsluv } from "./hsluv.mjs";
import { View, Image, TouchableOpacity, Text, Dimensions } from "react-native";
import Svg, { Line, Circle, G } from "react-native-svg";
import ColorSector from "./ColorSector.jsx";
import SectorPath from "./SectorPath.jsx";
import SelectText from "./SelectText.jsx";
import TutorialBox from "./TutorialBox.jsx";
import InfoIcon from "./InfoIcon.jsx";

export default function ChromaCamera({
  setCurrentPage,
  setAssignedColor,
  setAssignedColor2,
  setSelectedColor,
  selectedColor,
}) {
  const [savedHex, setSavedHex] = useState(null);
  const [hex, setHex] = useState("#000000");
  const [hue, setHue] = useState(0);
  const [savedHue, setSavedHue] = useState(0);
  const camera = useRef(null);
  const device = useCameraDevice("back");
  const totalSectors = 48;
  const sectorStep = 360 / totalSectors;
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const { hasPermission, requestPermission } = useCameraPermission();
  const [tutorialOpen, setTutorialOpen] = useState(true);
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
  useEffect(() => {
    setSelectedColor([hue, 75, 40]);
  }, [hue]);

  function gradientCirlce() {
    let circles = [];
    let hsluv = new Hsluv();
    hsluv.hsluv_l = 75;
    hsluv.hsluv_s = 100;

    for (let i = 0; i < totalSectors; i += 1) {
      hsluv.hsluv_h = i * sectorStep;
      hsluv.hsluvToHex();
      circles.push(
        <SectorPath
          key={i}
          hue={hsluv.hsluv_h}
          saturation={100}
          lightness={75}
          startAngle={i * sectorStep}
          endAngle={(i + 1) * sectorStep}
          innerRadius={screenWidth * getSizeMod(i)}
          outerRadius={screenWidth * 0.3}
        />
      );
    }

    return circles;
  }
  function getSizeMod(index) {
    let hueDiff = Math.abs(hue - index * sectorStep);
    if (hueDiff > 180) {
      hueDiff = 360 - hueDiff;
    }
    hueDiff /= 360;
    hueDiff **= 0.5;
    hueDiff = Math.min(0.25, hueDiff);
    return hueDiff;
  }
  function getSavedColor() {
    return (
      <Svg
        height={screenWidth * 0.7}
        width={screenWidth * 0.7}
        style={{
          position: "absolute",
          top: screenHeight / 2 - screenWidth * 0.35,
          left: screenWidth / 2 - screenWidth * 0.35,
        }}
      >
        <SectorPath
          hue={savedHue}
          saturation={100}
          lightness={75}
          startAngle={savedHue - sectorStep}
          endAngle={savedHue + sectorStep}
          innerRadius={screenWidth * 0.2}
          outerRadius={screenWidth * 0.35}
          stroke={"white"}
          strokeWidth={2}
        />
      </Svg>
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
        height={screenWidth * 0.6}
        width={screenWidth * 0.6}
        style={{
          position: "absolute",
          top: screenHeight / 2 - screenWidth * 0.3,
          left: screenWidth / 2 - screenWidth * 0.3,
        }}
      >
        {gradientCirlce()}

        <Circle
          cx={screenWidth * 0.3}
          cy={screenWidth * 0.3}
          r={15}
          stroke={hex}
          strokeWidth="3"
          fill={"rgb(" + sharedRGB.value.join(",") + ")"}
        />
      </Svg>
      {savedHex == null ? null : getSavedColor()}

      <TutorialBox
        text={
          "Point the camera at a surface to find it's undertone and press Select Color.  Select 2 colors to see harmonious color schemes.."
        }
        style={{
          position: "absolute",
          top: screenHeight * 0.6,
          left: "-5%",
          zIndex: 100,
          width: screenHeight / 2,
          height: screenHeight / 4,
        }}
        width={screenHeight / 2}
        height={screenHeight / 4}
        textStyle={{
          fontSize: 20,
          textAlign: "center",
          top: (screenHeight / 2) * 0.12,
          left: (screenHeight / 2) * 0.12,
          width: (screenHeight / 2) * 0.75,
          height: (screenHeight / 2) * 0.3,
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
          top: -screenHeight / 12,
          left: 0,
          width: (screenHeight / 2) * 0.1,
          height: (screenHeight / 2) * 0.1,
        }}
        onPressIn={() => {
          setTutorialOpen(!tutorialOpen);
        }}
      >
        <InfoIcon
          width={(screenHeight / 2) * 0.1}
          height={screenHeight / 2}
          style={{
            left: 0,
            top: 0,
          }}
          selectedColor={selectedColor}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          padding: 10,
          width: screenWidth * 0.5,
          height: screenWidth * 0.5,
          top: screenHeight / 2 - screenWidth * 0.25,
          left: screenWidth / 2 - screenWidth * 0.25,
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "center",
          borderRadius: 10,
          position: "absolute",
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
        <Svg
          style={{
            position: "absolute",
            width: screenHeight / 2,
            height: screenHeight / 2,
            zIndex: 0,
            padding: 10,
            top: -screenWidth * 0.22,
            left: -screenWidth * 0.25,
          }}
        >
          <G>
            <SectorPath
              startAngle={-120}
              endAngle={-60}
              innerRadius={screenWidth * 0.4}
              outerRadius={screenWidth * 0.5}
              hue={hue}
              saturation={100}
              lightness={75}
            />
          </G>
        </Svg>
        <SelectText
          style={{
            top: -screenWidth * 0.4,
          }}
        ></SelectText>
      </TouchableOpacity>
    </View>
  );
}
