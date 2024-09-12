import React from "react";
import { Hsluv } from "./hsluv";
import PaintFan from "./PaintFan";
import masterList from "./masterList.mjs";
import { View, Dimensions, Text } from "react-native";
export default function PaintSort({
  hue,
  saturation,
  lightness,
  startDrag,
  onDrop,
  width,
}) {
  const targetNumber = 3;
  function getPaintList() {
    let paintList = [];

    let searchRange = 5;
    while (paintList.length < targetNumber) {
      paintList = [];
      for (let i = 0; i < masterList.length; i++) {
        const paintColor = masterList[i];
        const distance =
          Math.abs(paintColor.hsluv[0] - hue) +
          Math.abs(paintColor.hsluv[1] - saturation) +
          Math.abs(paintColor.hsluv[2] - lightness);
        if (distance < searchRange) {
          paintList.push(paintColor);
        }
      }
      searchRange += 2;
    }
    const startModifier = 60 - 60 / paintList.length;
    const endModifier = 60 - 60 / paintList.length;
    return (
      <PaintFan
        colors={paintList}
        startAngle={90 - startModifier}
        endAngle={90 + endModifier}
        innerRadius={250}
        outerRadius={350}
        direction={-1}
        style={{
          position: "absolute",
          top: "50%",
          right: 0,
        }}
      />
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <Text
        adjustsFontSizeToFit={true}
        style={{ textAlign: "center", fontSize: 12 }}
      >
        Drag to add to palette
      </Text>
      {getPaintList()}
    </View>
  );
}
