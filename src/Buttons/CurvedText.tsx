import { View, Text, Dimensions } from "react-native";
import React from "react";
import Svg, { Circle, Defs, Path, TextPath, TSpan } from "react-native-svg";
import { tRadialObject } from "../Radials/SectorTypes";
import { eLayers } from "../Contexts/UserContext";

export type tCurvedText = tRadialObject & {
  text?: string;
  color?: string;
  fontSize?: number;
  zIndex?: number;
  convex?: boolean;
};
export function CurvedText({
  text = "Curved Text ",
  color = "black",
  fontSize = 20,
  radii = [0, 50],
  zIndex = eLayers.chipFan,
  origin = [
    Dimensions.get("window").width / 2,
    Dimensions.get("window").height / 2,
  ],
  rotationR = -11 / 7,
  convex = false,
}: tCurvedText) {
  const path = `M${-radii[1]} 0 A1 1 0 0 ${convex ? 0 : 1} ${radii[1]} 0 A1 1 0 0 ${convex ? 0 : 1} ${-radii[1]} 0 `;
  return (
    <Svg
      style={{
        position: "absolute",
        top: origin[1] - (radii[1] ?? 50),
        left: origin[0] - (radii[1] ?? 50),
        width: radii[1] * 2,
        height: radii[1] * 2,
        zIndex: zIndex,
        transform: [{ rotate: `${rotationR}rad` }],
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
      }}
      viewBox={`${-radii[1] * 1.1} ${-radii[1] * 1.1} ${2.2 * radii[1]} ${2.2 * radii[1]}`}
      pointerEvents="none"
    >
      <Defs>
        <Path id="curve" d={path} fill="none" stroke="black" strokeWidth={1} />
      </Defs>
      <TextPath href="#curve" fontFamily="Outfit" fill={color}>
        <TSpan fontFamily="Outfit" fontSize={fontSize}>
          {text}
        </TSpan>
      </TextPath>
    </Svg>
  );
}
