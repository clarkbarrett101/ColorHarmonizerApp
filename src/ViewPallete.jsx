import React from "react";
import { View, Text, Dimensions } from "react-native";
import PalleteSector from "./PalleteSector";
import PaintRow from "./PaintRow";
export default function ViewPallete({ paints }) {
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  console.log(screenWidth, screenHeight);
  const angleRange = [-60, 60];
  function getPaints() {
    if (paints.length === 0) {
      return <></>;
    }
    output = [];
    const angleStep = (angleRange[1] - angleRange[0]) / paints.length;
    for (let i = 0; i < paints.length; i++) {
      output.push(
        <PalleteSector
          paints={[paints[i]]}
          innerRadius={screenWidth * 0.2}
          outerRadius={screenWidth}
          angle={angleStep}
          startRotation={-90}
          endRotation={angleRange[0] + angleStep * i}
          style={{
            position: "absolute",
            top: screenHeight / 2,
            left: 0,
          }}
          textStyles={{
            fontSize: 12,
            color: "white",
            textAlign: "center",
            flex: 1,
          }}
          direction={-1}
        />
      );
    }
    return output;
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: screenWidth * 1.1,
      }}
    >
      {getPaints()}
    </View>
  );
}
