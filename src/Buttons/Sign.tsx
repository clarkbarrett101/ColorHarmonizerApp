import { View, Text } from "react-native";
import React from "react";
import { tRadialObject } from "../Radials/SectorTypes";
import Svg, { Defs, Path, TextPath, TSpan } from "react-native-svg";
export type tSign = tRadialObject & {
  zIndex?: number;
  color?: string;
  fontSize?: number;
  text?: string;
  signPath?: string;
};
export function Sign({
  radii,
  origin,
  zIndex,
  rotationR,
  color,
  fontSize,
  text,
  signPath,
}: tSign) {
  const path = `M -24 0 A1 1 0 0 1 24 0 A1 1 0 0 1 -24 0 `;
  const x = radii[0] * Math.cos(rotationR) + origin[0];
  const y = radii[0] * Math.sin(rotationR) + origin[1];
  return (
    <Svg
      style={{
        position: "absolute",
        width: radii[1] * 2,
        height: radii[1] * 2,
        zIndex: zIndex,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        transform: [{ translateX: x - radii[1] }, { translateY: y - radii[1] }],
      }}
      viewBox={`${-32} ${-32} ${64} ${64}`}
      pointerEvents="none"
    >
      <Defs>
        <Path id="curve" d={path} fill="none" stroke="black" strokeWidth={1} />
      </Defs>
      <Path d={signPath} fill={color} />
      <TextPath href="#curve" fontFamily="Outfit" fill={color}>
        <TSpan fontFamily="Outfit" fontSize={8}>
          {text}
        </TSpan>
      </TextPath>
    </Svg>
  );
}
