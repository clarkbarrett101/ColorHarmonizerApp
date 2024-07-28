import React, { useRef } from "react";
import Svg, { Path } from "react-native-svg";
import { Animated, Text, View, PanResponder, Dimensions } from "react-native";
export default function PaintChip({
  paintColor,
  startWidth = 100,
  startHeight = 100,
  startTop = 100,
  startLeft = 0,
  style = {},
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [screenPosition, setScreenPosition] = React.useState({
    x: startLeft,
    y: startTop,
  });
  const height = isDragging ? startHeight * 1.2 : startHeight;
  const width = isDragging ? startWidth * 1.2 : startWidth;
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      setScreenPosition({
        x: gestureState.moveX,
        y: gestureState.moveY,
      });
    },

    onPanResponderRelease: () => {
      console.log("touch end");
      setIsDragging(false);
    },
    onPanResponderTerminate: () => {
      console.log("touch end");
      setIsDragging(false);
    },
    onPanResponderGrant: (event, gestureState) => {
      setIsDragging(true);
      setScreenPosition({
        x: gestureState.x0,
        y: gestureState.y0,
      });
    },
  });
  return (
    <View
      style={{
        height: height,
        width: width,
        position: "absolute",
        top: screenPosition.y - height / 2,
        left: screenPosition.x - width / 2,
        ...style,
      }}
    >
      <Text
        style={{
          color: paintColor.hsluv[2] > 50 ? "black" : "white",
          textAlign: "center",
          fontSize: isDragging ? 12 : 10,
          margin: 5,
          zIndex: 10,
          bottom: "5%",
          left: "15%",
          position: "absolute",
          width: "60%",
        }}
      >
        {paintColor.name + " (" + paintColor.brand + ")"}
      </Text>
      <Svg
        id="Layer_1"
        data-name="Layer 1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 311.11 400.51"
        style={{
          top: 0,
          left: 0,
          position: "absolute",
          zIndex: 1,
        }}
        {...panResponder.panHandlers}
      >
        <Path
          d="M240.29 4.74l67.04 72.12c2.43 2.61 3.78 6.04 3.78 9.61V386.4c0 7.8-6.33 14.13-14.14 14.11L14.08 400c-7.78-.01-14.09-6.33-14.09-14.11V14.11C0 6.31 6.33 0 14.13 0l215.84.24c3.92 0 7.65 1.64 10.32 4.5z"
          fill={paintColor.hex}
          strokeWidth={0}
        />
        <Path
          d="M263.49 359.71H47.62c-5.9 0-10.68-4.78-10.68-10.68v-68.65c0-5.9 4.78-10.68 10.68-10.68h215.87c5.9 0 10.68 4.78 10.68 10.68v68.65c0 5.9-4.78 10.68-10.68 10.68z"
          strokeWidth={0}
          fill="#fff"
          opacity={0.5}
        />
      </Svg>
      <Svg
        viewBox="0 0 311.11 400.51"
        style={{
          top:
            (screenPosition.y / Dimensions.get("window").height - 0.2) *
            (isDragging ? 100 : 20),
          left:
            (screenPosition.x / Dimensions.get("window").width - 0.5) *
            (isDragging ? 100 : 20),
          position: "absolute",
        }}
      >
        <Path
          d="M240.29 4.74l67.04 72.12c2.43 2.61 3.78 6.04 3.78 9.61V386.4c0 7.8-6.33 14.13-14.14 14.11L14.08 400c-7.78-.01-14.09-6.33-14.09-14.11V14.11C0 6.31 6.33 0 14.13 0l215.84.24c3.92 0 7.65 1.64 10.32 4.5z"
          fill={"rgba(0,0,0,.5)"}
          strokeWidth={0}
        />
      </Svg>
    </View>
  );
}
