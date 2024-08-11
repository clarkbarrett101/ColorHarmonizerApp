import React from "react";
import { View, Text } from "react-native";
export default function ViewPallete({ paints }) {
  console.log(paints);
  function getPaints() {
    let paintSwatches = [];
    for (let i = 0; i < paints.length; i++) {
      paintSwatches.push(
        <View
          style={{
            backgroundColor: paints[i].hex,
            width: "100%",
            height: "7%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: paints[i].hsluv[2] < 50 ? "white" : "black",
              textAlign: "center",
              fontSize: 20,
              flex: 2,
              textAlignVertical: "center",
            }}
          >
            {paints[i].name}
          </Text>
          <Text
            style={{
              color: paints[i].hsluv[2] < 50 ? "white" : "black",
              textAlign: "center",
              fontSize: 20,
              flex: 1,
            }}
          >
            {paints[i].brand}
          </Text>
          <Text
            style={{
              color: paints[i].hsluv[2] < 50 ? "white" : "black",
              textAlign: "center",
              fontSize: 20,
              flex: 1,
            }}
          >
            {paints[i].label}
          </Text>
        </View>
      );
    }
    return paintSwatches;
  }
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        flexWrap: "wrap",

        flex: 1,
      }}
    >
      <View
        style={{
          backgroundColor: "rgb(128, 128, 150)",
          width: "100%",
          height: "5%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontSize: 20,
            flex: 2,
            fontWeight: "bold",
          }}
        >
          Name
        </Text>
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontSize: 20,
            flex: 1,
            fontWeight: "bold",
          }}
        >
          Brand
        </Text>
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontSize: 20,
            flex: 1,
            fontWeight: "bold",
          }}
        >
          Label
        </Text>
      </View>
      {getPaints()}
    </View>
  );
}
