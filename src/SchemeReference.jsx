import React from "react";
import { View } from "react-native";
import { Hsluv } from "./hsluv";
import ColorCircle from "./ColorCircle";
export default function SchemeReference() {
  function getComplimentarySchemes() {
    let schemes = [];
    let hue = 0;
    for (let i = 0; i < 3; i++) {
      const color1 = "hsl(" + hue + ", 100%, 50%)";
      const color2 = "hsl(" + (hue + (180 % 360)) + ", 100%, 50%)";
      schemes.push(<ColorCircle key={i} colors={[color1, color2]} />);
      hue += 60;
    }
    return schemes;
  }
  function getSplitComplimentaryColorSchemes() {
    let schemes = [];
    let hue = 0;
    for (let i = 0; i < 6; i++) {
      const color1 = "hsl(" + hue + ", 100%, 50%)";
      const color2 = "hsl(" + (hue + 150) + ", 100%, 50%)";
      const color3 = "hsl(" + (hue + 210) + ", 100%, 50%)";
      schemes.push(<ColorCircle key={i} colors={[color1, color2, color3]} />);
      hue += 60;
    }
    return schemes;
  }
  function getAnalogousColorSchemes() {
    let schemes = [];
    let hue = 0;
    for (let i = 0; i < 6; i++) {
      const color1 = "hsl(" + hue + ", 100%, 50%)";
      const color2 = "hsl(" + (hue + 30) + ", 100%, 50%)";
      const color3 = "hsl(" + (hue + 60) + ", 100%, 50%)";
      schemes.push(<ColorCircle key={i} colors={[color1, color2, color3]} />);
      hue += 60;
    }
    return schemes;
  }
  return (
    <View
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
      }}
    >
      {getComplimentarySchemes()}
      {getSplitComplimentaryColorSchemes()}
      {getAnalogousColorSchemes()}
    </View>
  );
}
