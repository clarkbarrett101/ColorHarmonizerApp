import PaintCapsule from "./PaintCapsule";
import { useEffect, useState } from "react";
import { View } from "react-native";
import masterList from "../masterList.mjs";

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
}) {
  const [colorList, setColorList] = useState(findColors());
  useEffect(() => {
    if (hsl) {
      let paintList = findColors();
      setColorList(paintList);
    }
    if (colors) {
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
    try {
      let sectors = [];
      let angleStep = (endAngle - startAngle) / colorList.length;

      for (let i = 0; i < colorList.length; i++) {
        sectors.push(
          <PaintCapsule
            key={i}
            paint={colorList[i]}
            startRotation={startAngle}
            endRotation={startAngle + (i + 0.5) * angleStep}
            width={outerRadius - innerRadius}
            direction={direction}
            radiusOffset={innerRadius}
            onDragStart={onDragStart}
            onDrop={onDrop}
            isSaved={isSaved}
            isDragging={isDragging}
          />,
        );
      }
      return sectors;
    } catch (e) {
      console.log(e);
    }
  }
  if (!colors && !hsl) {
    return null;
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
