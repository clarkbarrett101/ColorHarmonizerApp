import PaintSector from "../PaintSector";
import React, { useEffect, useRef, useReducer } from "react";
import { Dimensions, View, Animated, Text } from "react-native";
import masterList from "./masterList";
import { Svg, Path, G } from "react-native-svg";
import { Hsluv } from "./hsluv";
import PaintCapsule from "./PaintCapsule";
import CardSwapIcon from "../icons/CardSwapIcon";

export default function PaintRow({
  paints,
  rotation,
  innerRadius,
  outerRadius,
  width,
  style,
  direction,
  onDragStart,
  onDrop,
  isSaved,
  isDragging,
  setChipPosition,
  chipPosition,
  twist,
}) {
  function getSectors() {
    try {
      let sectors = [];
      let innerWidthStep = (outerRadius - innerRadius) / paints.length;
      if (innerWidthStep > width) {
        innerWidthStep = width * 0.7;
      }
      for (let i = 0; i < paints.length; i++) {
        sectors.push(
          <PaintCapsule
            key={i}
            paint={paints[i]}
            startRotation={-90}
            endRotation={rotation}
            width={width}
            direction={direction}
            radiusOffset={innerRadius + innerWidthStep * i}
            onDragStart={onDragStart}
            onDrop={onDrop}
            isSaved={isSaved}
            isDragging={isDragging}
            chipPosition={chipPosition}
            setChipPosition={setChipPosition}
            twist={twist}
            shadows={false}
          />
        );
      }

      sectors.reverse();
      return sectors;
    } catch (e) {
      console.log(e);
    }
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
