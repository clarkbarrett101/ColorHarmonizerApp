import React from "react";
import Svg, { Arc, Defs, TextPath, Text, Path } from "react-native-svg";
export default function CurvedText({ style, width, height, text }) {
  const path = `M100,150 C0,150 0,0 100,0`;
  return (
    <Svg
      xmlSpace="preserve"
      style={style}
      width={width}
      height={height}
      viewBox="0 0 200 200"
    >
      <Defs>
        <Path id="MyPath" d={path} />
      </Defs>
      <Text x={0} y={0} fontSize={12} dy={5} fontFamily={"-"}>
        <TextPath href="#MyPath">{text}</TextPath>
      </Text>
      <Path d={path} fill="none" stroke="black" />
    </Svg>
  );
}
