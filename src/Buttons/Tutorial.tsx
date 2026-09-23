import { View } from "react-native";
import React, { useState } from "react";
import {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Stop,
  Svg,
  Text,
} from "react-native-svg";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { usePanHitBox, tPanHitBox } from "./PanHitBox";
import { tVerse, useVerse } from "../utils/Verse";
import { fCLARColorToString } from "../utils/CLAcolor";
export type tTutorial = {
  children?: React.ReactNode | React.ReactNode[];
  height: number;
  width: number;
  origin: [number, number];
  infoIconOrigin?: [number, number];
  infoIconSize?: number;
  layer?: number;
  params?: {};
  maxOpacity?: number;
};
export function Tutorial({
  children,
  height,
  width,
  origin,
  layer = eLayers.superMax,
  maxOpacity = 1,
  params,
  infoIconOrigin = [0, 0],
  infoIconSize = 100,
}: tTutorial) {
  const vActive = useVerse(true);
  return (
    <>
      {" "}
      {vActive.state && (
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
          onTouchEnd={() => {
            vActive.dispatch(!vActive.state);
          }}
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
              <Stop stopColor={"black"} offset={0} stopOpacity={maxOpacity} />
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
      )}
      <Svg
        height={infoIconSize}
        width={infoIconSize}
        style={{
          position: "absolute",
          top: infoIconOrigin[1] - infoIconSize / 2,
          left: infoIconOrigin[0] - infoIconSize / 2,
          zIndex: layer,
        }}
        viewBox="-60 -60 120 120"
        onTouchEnd={() => {
          vActive.dispatch(!vActive.state);
        }}
      >
        <Circle cx={0} cy={0} r={60} fill={"black"} opacity={0.5} />
        <Path d={infoIconPath} fill="white" />
      </Svg>
    </>
  );
}
export function fTextWrapSVG(
  lines: string[],
  totalHeight: number,
  origin = [0, 0],
  props: React.ComponentProps<typeof Text>,
) {
  return (
    <>
      {lines.map((line, index) => (
        <Text
          key={`${line}-${index}`}
          {...props}
          y={
            origin[1] +
            (index + 0.5 - lines.length / 2) * (totalHeight / lines.length)
          }
          x={origin[0]}
        >
          {line}
        </Text>
      ))}
    </>
  );
}
const infoIconPath =
  "M0 49A1 1 0 000-50 1 1 0 000 49M0-42A1 1 0 010 42 1 1 0 010-42ZM0-36A1 1 90 000-19 1 1 90 000-36M3-14a5 5 0 015 5v39a5 5 0 01-5 5h-6a5 5 0 01-5-5v-39a5 5 0 015-5Z";
