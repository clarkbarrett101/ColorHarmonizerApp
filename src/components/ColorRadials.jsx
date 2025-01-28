import React, { useEffect } from "react";
import { Dimensions, PanResponder, View, TouchableOpacity } from "react-native";
import ColorSector from "../ColorSector";
import HueWheel from "../HueWheel";
import PaintFan from "./PaintFan";
import TutorialBox from "./TutorialBox";
import InfoIcon from "../InfoIcon";
export default function ColorRadials({
  onDragStart,
  onDrop,
  isDragging,
  assignedColor,
  setSelectedColor,
  selectedColor,
}) {
  const components = ["none", "hue", "sat", "lit"];
  const [touchedComponent, setTouchedComponent] = React.useState(components[0]);
  const [isTouching, setIsTouching] = React.useState(false);
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  let sizeMod = 1;
  if (screenHeight > screenWidth * 2) {
    sizeMod = screenWidth;
  } else {
    sizeMod = screenHeight * 0.6;
  }
  const fontMod = sizeMod / 400;
  const [hue, setHue] = React.useState(0);
  const [sat, setSat] = React.useState(75);
  const [lit, setLit] = React.useState(50);
  let lits = [];
  for (let i = 0; i < 7; i++) {
    lits.push(20 + (90 / 7) * i);
  }
  const [rotationModifier, setRotationModifier] = React.useState(0);
  const hueRadius = sizeMod * 0.45;
  const innerRadius = sizeMod * 0.47;
  const outerRadius = sizeMod * 0.58;
  const satAngles = [23, 79];
  const litAngles = [97, 168];
  const sats = [100, 75, 50, 35, 15];
  const totalHueSectors = 36;
  const [tutorialOpen, setTutorialOpen] = React.useState(true);
  useEffect(() => {
    setSelectedColor([hue, sat, lit]);
  }, [hue, sat, lit]);
  useEffect(() => {
    if (assignedColor) {
      let targetCenter = assignedColor.hsluv[0];
      targetCenter = 180 - targetCenter;
      setRotationModifier(targetCenter);
      setHue(assignedColor.hsluv[0]);
      setSat(assignedColor.hsluv[1]);
      setLit(assignedColor.hsluv[2]);
    }
  }, [assignedColor]);
  useEffect(() => {
    if (assignedColor) {
      let targetCenter = assignedColor.hsluv[0];
      targetCenter = 180 - targetCenter;
      setRotationModifier(targetCenter);
      setHue(assignedColor.hsluv[0]);
      setSat(assignedColor.hsluv[1]);
      setLit(assignedColor.hsluv[2]);
    } else {
      setRotationModifier(180);
      setHue(0);
    }
  }, []);
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => true,
    onMoveShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: () => false,
    onStartShouldSetPanResponderCapture: () => false,
    onPanResponderGrant: (e, gestureState) => {
      setTouchedComponent(
        getTouchedComponent(e.nativeEvent.pageX, e.nativeEvent.pageY)
      );
    },
    onPanResponderMove: (e, gestureState) => {
      const angle = getTouchAngle(e.nativeEvent.pageX, e.nativeEvent.pageY);
      if (touchedComponent === components[1]) {
        const dy = gestureState.dy;
        const newRotationModifier =
          rotationModifier - (dy * 360) / screenHeight;
        setRotationModifier(
          (newRotationModifier / (360 / totalHueSectors)) *
            (360 / totalHueSectors)
        );
        handleEndHueRotation();
      } else if (touchedComponent === components[2]) {
        if (angle > satAngles[0] && angle < satAngles[1]) {
          setSat(
            Math.round(
              ((angle - satAngles[0]) / (satAngles[1] - satAngles[0])) *
                (sats[sats.length - 1] - sats[0])
            ) + sats[0]
          );
        }
      } else if (touchedComponent === components[3]) {
        if (angle > litAngles[0] && angle < litAngles[1]) {
          setLit(
            Math.round(
              ((angle - litAngles[0]) / (litAngles[1] - litAngles[0])) *
                (lits[lits.length - 1] - lits[0])
            ) + lits[0]
          );
        }
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      if (touchedComponent === components[1]) {
        setRotationModifier(
          Math.round(rotationModifier / (360 / totalHueSectors)) *
            (360 / totalHueSectors)
        );
        handleEndHueRotation();
      }
      setTouchedComponent(components[0]);
    },
    onPanResponderTerminate: (e, gestureState) => {
      if (touchedComponent === components[1]) {
        setRotationModifier(
          Math.round(rotationModifier / (360 / totalHueSectors)) *
            (360 / totalHueSectors)
        );
        handleEndHueRotation();
      }
      setTouchedComponent(components[0]);
    },
  });
  function handleEndHueRotation() {
    let currentCenter = 360 - rotationModifier - 180;
    currentCenter = currentCenter % 360;
    if (currentCenter < 0) {
      currentCenter += 360;
    }
    setHue(currentCenter);
  }
  function getTouchAngle(x, y) {
    let relativeX = screenWidth - x;
    let relativeY = y - screenHeight / 2;
    let angle = Math.atan2(relativeY, relativeX) * (180 / Math.PI);
    angle += 90;
    if (angle < 0) {
      angle += 360;
    }
    return angle;
  }
  function getTouchedComponent(x, y) {
    let relativeX = screenWidth - x;
    let relativeY = y - screenHeight / 2;
    let distance = Math.sqrt(relativeX ** 2 + relativeY ** 2);
    if (distance < hueRadius - sizeMod * 0.1) {
      return components[1];
    }
    if (distance > outerRadius) {
      return components[0];
    }
    if (relativeY > 0) {
      return components[3];
    }
    return components[2];
  }
  useEffect(() => {
    setIsTouching(touchedComponent === components[1]);
  }, [touchedComponent]);
  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
      {...panResponder.panHandlers}
    >
      <ColorSector
        hues={[hue]}
        sats={sats}
        lits={[lit]}
        innerRadius={innerRadius}
        outerRadius={
          outerRadius * (touchedComponent === components[2] ? 1.1 : 1)
        }
        startAngle={satAngles[0]}
        endAngle={satAngles[1]}
        direction={-1}
        strokeWidth={2}
        style={{
          position: "absolute",
          right: "-10%",
          top: screenHeight / 2,
          zIndex: 1,
        }}
        sat={sat}
      />
      <ColorSector
        hues={[hue]}
        sats={[sat]}
        lits={lits}
        innerRadius={innerRadius}
        outerRadius={
          outerRadius * (touchedComponent === components[3] ? 1.1 : 1)
        }
        startAngle={litAngles[0]}
        endAngle={litAngles[1]}
        direction={-1}
        strokeWidth={2}
        style={{
          position: "absolute",
          right: "-10%",
          top: screenHeight / 2,
          zIndex: 1,
        }}
        lit={lit}
      />
      <HueWheel
        totalSectors={totalHueSectors}
        innerRadius={sizeMod * 0.15}
        outerRadius={
          hueRadius * (touchedComponent === components[1] ? 1 : 0.95)
        }
        direction={1}
        style={{
          position: "absolute",
          right: "-10%",
          top: screenHeight / 2,
          zIndex: 1,
        }}
        isTouching={isTouching}
        subSectors={1}
        satRange={[sat, sat]}
        litRange={[lit, lit]}
        rotationModifier={rotationModifier}
      />
      {touchedComponent === components[0] ? (
        <PaintFan
          style={{
            position: "absolute",
            right: "-10%",
            top: screenHeight / 2 - sizeMod * 0.1,
            zIndex: 10,
          }}
          direction={-1}
          colors={null}
          hsl={[hue, sat, lit]}
          startAngle={-30}
          endAngle={30}
          outerRadius={sizeMod}
          innerRadius={sizeMod * 0.65}
          isSaved={false}
          onDragStart={onDragStart}
          onDrop={onDrop}
          isDragging={isDragging}
        />
      ) : null}
      <TutorialBox
        text={
          "Drag the color wheel and the chrominance and luminance meters to pick from a list of paint colors."
        }
        style={{
          position: "absolute",
          top: screenHeight / 7,
          right: screenWidth / 2 - sizeMod * 0.5,
          zIndex: 100,
          width: sizeMod,
          height: sizeMod / 2,
        }}
        width={sizeMod}
        height={sizeMod / 2}
        textStyle={{
          fontSize: 24 * fontMod,
          color: "white",
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
          left: sizeMod * 0.01,
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
