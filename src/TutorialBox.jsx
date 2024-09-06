import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import Svg, { Rect, Defs, RadialGradient, Stop } from "react-native-svg";
export default function TutorialBox({
  text,
  style,
  textStyle = { fontSize: 18 },
  width,
  height,
  isOpen,
  setOpen,
  close = true,
  selectedColor,
}) {
  const backgroundColor = `hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)`;
  if (isOpen) {
    return (
      <TouchableOpacity onPressIn={() => setOpen(!isOpen)} style={style}>
        <Svg width={width} height={height}>
          <RadialGradient
            id="grad"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor={backgroundColor} stopOpacity=".8" />
            <Stop offset="75%" stopColor={backgroundColor} stopOpacity=".7" />

            <Stop offset="100%" stopColor={backgroundColor} stopOpacity="0" />
          </RadialGradient>
          <Rect x="0" y="0" width={width} height={height} fill="url(#grad)" />
        </Svg>
        <Text
          style={[
            textStyle,
            { color: selectedColor[2] > 50 ? "black" : "white" },
          ]}
        >
          {text}
        </Text>
        {close ? (
          <Text
            style={{
              fontSize: textStyle.fontSize / 2,
              color: selectedColor[2] > 50 ? "black" : "white",
              position: "absolute",
              bottom: textStyle.fontSize,
              fontFamily: "Outlfit",
              textAlign: "center",
              width: "100%",
            }}
          >
            Tap to close
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  } else {
    return <></>;
  }
}
