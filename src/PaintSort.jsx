import React from "react";
import { Hsluv } from "./hsluv";
import PaintChip from "./PaintChip";
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
    let paintChipList = [];
    const longList = paintList.length > 5;
    for (let i = 0; i < paintList.length; i++) {
      const paintColor = paintList[i];
      paintChipList.push(
        <PaintChip
          key={i}
          paintColor={paintColor}
          startWidth={100}
          startHeight={100}
          startTop={longList ? 75 + 50 * Math.floor(i / 5) : 75}
          startLeft={
            (width / (Math.min(paintList.length, 5) + 1)) *
            ((longList ? i % 5 : i) + 1)
          }
          isSaved={false}
          onDrop={onDrop}
          startDrag={startDrag}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: longList ? 7 - Math.floor(i / 5) : 5,
          }}
        />
      );
    }
    return paintChipList;
  }
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ textAlign: "center", fontSize: 12 }}>
        Drag to add to palette
      </Text>
      {getPaintList()}
    </View>
  );
}
