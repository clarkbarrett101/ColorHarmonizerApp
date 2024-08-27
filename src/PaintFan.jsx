import PaintSector from "./PaintSector";
import React, { useEffect, useRef, useReducer } from "react";
import { Dimensions, View, Animated, Text } from "react-native";
import masterList from "./masterList";
import { Svg, Path, G } from "react-native-svg";
import { Hsluv } from "./hsluv";
import PaintCapsule from "./PaintCapsule";

export default function PaintFan({
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
  setChipPosition,
  chipPosition,
}) {
  const [trueStartAngle, setTrueStartAngle] = React.useState(startAngle - 90);
  const [trueEndAngle, setTrueEndAngle] = React.useState(endAngle - 90);
  const [colorList, setColorList] = React.useState(findColors());

  React.useEffect(() => {
    if (hsl) {
      let paintList = findColors();
      let modifier = (6 - paintList.length) / 6;
      setTrueStartAngle(startAngle - 90 + 30 * modifier);
      setTrueEndAngle(endAngle - 90 - 30 * modifier);
      setColorList(paintList);
    }
    if (colors[0]) {
      setColorList(colors);
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
    let angleStep = (trueEndAngle - trueStartAngle) / colorList.length;

    for (let i = 0; i < colorList.length; i++) {
      sectors.push(
        <PaintCapsule
          key={i}
          paint={colorList[i]}
          startRotation={trueStartAngle}
          endRotation={trueStartAngle + (i + 0.05) * angleStep}
          width={outerRadius - innerRadius}
          direction={direction}
          radiusOffset={innerRadius}
          onDragStart={onDragStart}
          onDrop={onDrop}
          isSaved={isSaved}
          isDragging={isDragging}
          chipPosition={chipPosition}
          setChipPosition={setChipPosition}
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
        borderWidth: 1,
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
