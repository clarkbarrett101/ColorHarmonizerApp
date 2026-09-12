import { View } from "react-native";
import React, { useState } from "react";
import {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
  Svg,
  Text,
} from "react-native-svg";
import { eLayers } from "../Contexts/UserContext";
import { usePanHitBox, tPanHitBox } from "./PanHitBox";
import { useVerse } from "../utils/Verse";
export type tTutorial = {
  children?: React.ReactNode | React.ReactNode[];
  height: number;
  width: number;
  origin: [number, number];
  layer?: number;
  params?: {};
};
export function Tutorial({
  children,
  height,
  width,
  origin,
  layer = eLayers.superMax,
  params,
}: tTutorial) {
  const vActive = useVerse(true);
  const diameter = Math.max(width, height);
  usePanHitBox({
    id: "Tutorial" + origin,
    radii: [0, Math.min(width, height) / 2],
    rotationR: 0,
    origin,
    arcLength: 43 / 7,
    fOnUpdate: (state, pos) => {
      "worklet";
      if (state.value == "tap" || state.value == "release") {
        vActive.dispatch(!vActive.shared.value);
        state.value = "leave";
      }
    },
  });
  return vActive.state ? (
    <Svg
      height={height}
      width={width}
      {...params}
      style={{
        position: "absolute",
        top: origin[1] - height / 2,
        left: origin[0] - width / 2,
        zIndex: layer,
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <Defs>
        <RadialGradient
          cx={width / 2}
          cy={height / 2}
          rx={width / 2}
          ry={height / 2}
          id="grad"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={"black"} offset={0} stopOpacity={0.7} />
          <Stop stopColor={"black"} stopOpacity={0} offset={1} />
        </RadialGradient>
      </Defs>
      <Ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2}
        ry={height / 2}
        fill="url(#grad)"
      />
      {children}
    </Svg>
  ) : (
    <></>
  );
}
export function fTextWrapSVG(
  lines: string[],
  totalHeight: number,
  startY = 0,
  props: React.ComponentProps<typeof Text>,
) {
  return (
    <>
      {lines.map((line, index) => (
        <Text
          key={`${line}-${index}`}
          {...props}
          y={
            startY +
            (index + 0.5 - lines.length / 2) * (totalHeight / lines.length)
          }
        >
          {line}
        </Text>
      ))}
    </>
  );
}
