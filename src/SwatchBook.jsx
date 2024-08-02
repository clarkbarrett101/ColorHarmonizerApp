import React, { useState, useEffect } from "react";
import { TouchableOpacity, View, Text, Dimensions } from "react-native";
import DragMenu from "./DragMenu";
import PaintChip from "./PaintChip";
export default function SwatchBook({
  swatches,
  onDrop,
  isDragging,
  startDrag,
  style = {},
}) {
  const width = Dimensions.get("window").width / 3;
  function getSwatches() {
    let swatchList = [];
    for (let i = 0; i < swatches.length; i++) {
      const color = swatches[i];
      swatchList.push(
        <PaintChip
          key={i}
          paintColor={color}
          startWidth={width}
          startHeight={width}
          startTop={Dimensions.get("window").height * 0.95}
          startLeft={
            (Dimensions.get("window").width / swatches.length) * (i + 0.5)
          }
          onDrop={onDrop}
          isSaved={true}
          startDrag={startDrag}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: swatches.length - i,
          }}
        />
      );
    }
    return swatchList;
  }

  return <View style={style}>{getSwatches()}</View>;
}
