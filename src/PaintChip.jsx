import React, { useRef, useEffect, useState } from "react";
import Svg, { Path } from "react-native-svg";
import { Animated, Text, View, PanResponder, Dimensions } from "react-native";
export default function PaintChip({
  paintColor,
  startWidth = 100,
  startHeight = 100,
  startTop = 100,
  startLeft = 0,
  style = {},
  onDrop = () => {},
  isSaved,
  strokeWidth = 0,
  startDrag = () => {},
  setCanSrcoll = () => {},
}) {
  const longName = paintColor.name.length > 12;
  const [screenPosition, setScreenPosition] = React.useState({
    x: startLeft,
    y: startTop,
  });
  const [movePosition, setMovePosition] = React.useState({ x: 0, y: 0 });
  const [isThisDragging, setIsThisDragging] = React.useState(false);
  const height = isThisDragging ? startHeight * 1.2 : startHeight;
  const width = isThisDragging ? startWidth * 1.2 : startWidth;
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event, gestureState) => {
      startDrag(paintColor, isSaved);
      setIsThisDragging(true);
      setCanSrcoll(false);
    },
    onPanResponderMove: (event, gestureState) => {
      setScreenPosition({
        x: gestureState.dx + screenPosition.x,
        y: gestureState.dy + screenPosition.y,
      });
      setMovePosition({
        x: gestureState.moveX,
        y: gestureState.moveY,
      });
      setCanSrcoll(false);
    },
    onPanResponderRelease: (event, gestureState) => {
      setIsThisDragging(false);
      onDrop(movePosition, paintColor, isSaved);
      setScreenPosition({
        x: startLeft,
        y: startTop,
      });
      setCanSrcoll(true);
    },
    onPanResponderTerminate: (event, gestureState) => {
      setIsThisDragging(false);
      onDrop(movePosition, paintColor, isSaved);
      setScreenPosition({
        x: startLeft,
        y: startTop,
      });
      setCanSrcoll(true);
    },
  });
  useEffect(() => {
    if (!isThisDragging) {
      setScreenPosition({
        x: startLeft,
        y: startTop,
      });
    }
  }, [isThisDragging]);
  useEffect(() => {
    setScreenPosition({
      x: startLeft,
      y: startTop,
    });
  }, [startLeft, startTop]);
  return (
    <View
      style={{
        ...style,
        height: height,
        width: width,
        position: "absolute",
        top: screenPosition.y - height / 2,
        left: screenPosition.x - width / 2,
        zIndex: isThisDragging ? 100 : style.zIndex,
      }}
    >
      <Text
        style={{
          color: paintColor.hsluv[2] > 50 ? "black" : "white",
          textAlign: "center",
          fontSize: longName ? width / 16 : width / 12,
          margin: 5,
          zIndex: 10,
          bottom: "8%",
          left: "16%",
          position: "absolute",
          width: "60%",
        }}
      >
        {paintColor.name}
        <Text
          style={{
            color: paintColor.hsluv[2] > 50 ? "black" : "white",
            fontSize: width / 20,
            margin: 5,
            zIndex: 10,
            bottom: "5%",
            left: "15%",
            position: "absolute",
            width: "60%",
          }}
        >
          {"\n(" + paintColor.brand + ")"}
        </Text>
      </Text>
      <Svg
        id="Layer_1"
        data-name="Layer 1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 311.11 400.51"
        style={{
          position: "absolute",
          zIndex: 1,
        }}
        {...panResponder.panHandlers}
      >
        <Path
          d="M240.29 4.74l67.04 72.12c2.43 2.61 3.78 6.04 3.78 9.61V386.4c0 7.8-6.33 14.13-14.14 14.11L14.08 400c-7.78-.01-14.09-6.33-14.09-14.11V14.11C0 6.31 6.33 0 14.13 0l215.84.24c3.92 0 7.65 1.64 10.32 4.5z"
          fill={paintColor.hex}
          strokeWidth={strokeWidth / 2}
          stroke={paintColor.hsluv[2] > 50 ? "black" : "white"}
        />
        <Path
          d="M263.49 359.71H47.62c-5.9 0-10.68-4.78-10.68-10.68v-68.65c0-5.9 4.78-10.68 10.68-10.68h215.87c5.9 0 10.68 4.78 10.68 10.68v68.65c0 5.9-4.78 10.68-10.68 10.68z"
          strokeWidth={width / 50}
          stroke={paintColor.hsluv[2] > 50 ? "black" : "white"}
          fill="none"
        />
      </Svg>
      <Svg
        viewBox="0 0 311.11 400.51"
        style={{
          top:
            (screenPosition.y / Dimensions.get("window").height - 0.2) *
            (isThisDragging ? 100 : strokeWidth * 4),
          left:
            (screenPosition.x / Dimensions.get("window").width - 0.5) *
            (isThisDragging ? 100 : strokeWidth * 4),
          position: "absolute",
        }}
      >
        <Path
          d="M240.29 4.74l67.04 72.12c2.43 2.61 3.78 6.04 3.78 9.61V386.4c0 7.8-6.33 14.13-14.14 14.11L14.08 400c-7.78-.01-14.09-6.33-14.09-14.11V14.11C0 6.31 6.33 0 14.13 0l215.84.24c3.92 0 7.65 1.64 10.32 4.5z"
          fill={"rgba(0,0,0,.25)"}
          strokeWidth={0}
        />
      </Svg>
    </View>
  );
}
