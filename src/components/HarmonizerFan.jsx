import PaintSector from "./PaintSector";
import React, { useEffect, useRef } from "react";
import { Dimensions, View, Animated, Text } from "react-native";
import masterList from "./masterList";
import { Svg, Path, G } from "react-native-svg";
import { Hsluv } from "./hsluv";
import PaintCapsule from "../PaintCapsule";

export default function HarmonizerFan({
  hsl,
  colors,
  startAngle,
  endAngle,
  innerRadius,
  outerRadius,
  style,
  direction,
  onDragStart,
  onDrop,
  isSaved,
  isDragging,
  chipPosition,
  setChipPosition,
}) {
  const [trueStartAngle, setTrueStartAngle] = React.useState(startAngle);
  const [trueEndAngle, setTrueEndAngle] = React.useState(endAngle);
  const [colorList, setColorList] = React.useState(findColors());
  React.useEffect(() => {
    if (hsl) {
      let paintList = findColors();
      setColorList([...paintList]);
    }
  }, [hsl, colors]);
  function findColors() {
    if (hsl) {
      let paintList = [];
      const targetNumber = 3;
      let searchRange = 5;
      while (paintList.length < targetNumber) {
        paintList = [];
        for (let i = 0; i < masterList.length; i++) {
          const paintColor = masterList[i];
          const distance =
            Math.abs(paintColor.hsluv[0] - hsl[0]) +
            Math.abs(paintColor.hsluv[1] - hsl[1]) +
            Math.abs(paintColor.hsluv[2] - hsl[2]);
          if (distance < searchRange) {
            paintList.push(paintColor);
          }
        }
        searchRange += 2;
      }
      return paintList;
    } else {
      return colors;
    }
  }

  function getSectors() {
    let sectors = [];
    let angleStep = (endAngle - startAngle) / colorList.length;

    for (let i = 0; i < colorList.length; i++) {
      sectors.push(
        <PaintCapsule
          paint={colorList[i]}
          startRotation={startAngle}
          endRotation={startAngle + (i + 0.5) * angleStep}
          width={outerRadius - innerRadius}
          direction={direction}
          radiusOffset={innerRadius}
          onDragStart={onDragStart}
          onDrop={onDrop}
          isSaved={isSaved}
          chipPosition={chipPosition}
          setChipPosition={setChipPosition}
          isDragging={isDragging}
        />
      );
    }
    return sectors;
  }
  return (
    <View
      style={{
        ...style,
        position: "absolute",

        transform: [
          {
            scaleX: direction,
          },
        ],
      }}
    >
      {getSectors()}
    </View>
  );
}
