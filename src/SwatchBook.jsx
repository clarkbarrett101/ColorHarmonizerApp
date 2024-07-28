import React, { useState, useEffect } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import PaintChip from "./PaintChip";
export default function SwatchBook(swatches) {
  const [selectedSwatch, setSelectedSwatch] = useState(0);
  function handleSelectSwatch(index) {
    setSelectedSwatch(index);
  }

  const idleStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginLeft: -20,
    top: 0,
  };
  const activeStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 3,
    top: 0,
  };
  function getSwatches() {
    let swatchList = [];
    for (let i = 0; i < swatches.swatches.length; i++) {
      const color = swatches.swatches[i];
      if (i !== selectedSwatch) {
        swatchList.push(
          <PaintChip
            key={i}
            paintColor={color}
            startWidth={100}
            startHeight={100}
            style={idleStyle}
            startTop={0}
            startLeft={i * 50}
          />
        );
      }
    }
    return swatchList;
  }

  return (
    <View style={{ flex: 1, display: "flex" }}>
      <View
        style={{
          position: "absolute",
          flexDirection: "row-reverse",
          alignItems: "center",
          bottom: -10,
          width: "100%",
          height: "15%",
          display: "flex",
        }}
      >
        {getSwatches()}
      </View>
      <PaintChip
        paintColor={swatches.swatches[selectedSwatch]}
        style={activeStyle}
        startTop={0}
        startLeft={0}
        startWidth={100}
        startHeight={100}
      />
    </View>
  );
}
