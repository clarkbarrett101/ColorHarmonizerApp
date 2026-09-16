import { Dimensions } from "react-native";
import React from "react";
import Svg, { Defs, Path, TextPath, TSpan } from "react-native-svg";
import { tRadialObject } from "../Radials/SectorTypes";
import { eLayers } from "../Contexts/UserContext";

export type tCurvedText = tRadialObject & {
  text?: string;
  color?: string;
  fontSize?: number;
  children?: React.ReactNode;
  convex?: boolean;
  drawCurve?: boolean;
};
export function CurvedText({
  text = "Curved Text ",
  color = "black",
  fontSize = 20,
  radii = [0, 50],
  layer = eLayers.chipFan,
  origin = [
    Dimensions.get("window").width / 2,
    Dimensions.get("window").height / 2,
  ],
  rotationR = -11 / 7,
  convex = false,
  children,
  drawCurve = false,
}: tCurvedText) {
  const convexPath = `M${-(radii[1] - fontSize)} 0 A1 1 0 0 1 ${radii[1] - fontSize} 0 A1 1 0 0 1 ${-(radii[1] - fontSize)} 0 `;
  const concavePath = `M${-radii[1]} 0 A1 1 0 0 0 ${radii[1]} 0 A1 1 0 0 0 ${-radii[1]} 0 `;
  return (
    <Svg
      style={{
        position: "absolute",
        top: origin[1] - radii[1],
        left: origin[0] - radii[1],
        width: radii[1] * 2,
        height: radii[1] * 2,
        zIndex: layer,
        transform: [{ rotate: `${rotationR}rad` }],
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
      }}
      viewBox={`${-radii[1] * 1} ${-radii[1] * 1} ${2 * radii[1]} ${2 * radii[1]}`}
      pointerEvents="none"
    >
      <Defs>
        {convex && (
          <Path
            id="curve"
            d={convexPath}
            fill="none"
            stroke="red"
            strokeWidth={1}
          />
        )}
        {!convex && (
          <Path
            id="curve"
            d={concavePath}
            fill="none"
            stroke="black"
            strokeWidth={1}
          />
        )}
      </Defs>
      {children}
      <TSpan fontFamily="Outfit" fontSize={fontSize}>
        <TextPath href="#curve" fontFamily="Outfit" fill={color}>
          {text}
        </TextPath>
      </TSpan>
      {drawCurve && (
        <Path
          id="curve"
          d={convex ? convexPath : concavePath}
          fill="none"
          stroke="blue"
          strokeWidth={1}
        />
      )}
    </Svg>
  );
}
