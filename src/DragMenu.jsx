import React from "react";
import { View } from "react-native";
import SwatchBook from "./SwatchBook";
export default function DragMenu(swatches) {
  return (
    <View style={{ flex: 1, display: "flex" }}>
      <View
        style={{
          flex: 2,
          borderWidth: 5,
          backgroundColor: "rgba(0,0,0,.5)",
          borderColor: "white",
        }}
      />
      <View
        style={{
          flex: 3,
          borderWidth: 5,
          backgroundColor: "rgba(0,0,0,.5)",
          borderColor: "white",
        }}
      />
      <View
        style={{
          flex: 2,
          borderWidth: 5,
          backgroundColor: "rgba(0,0,0,.5)",
          borderColor: "white",
        }}
      />
    </View>
  );
}
