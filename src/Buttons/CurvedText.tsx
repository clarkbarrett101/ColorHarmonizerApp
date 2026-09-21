import { Dimensions } from "react-native";
import React, { useEffect, useMemo, useRef } from "react";
import Svg, { Defs, Path, TextAnchor, TextPath, TSpan } from "react-native-svg";
import { tRadialObject } from "../Radials/SectorTypes";
import { eLayers } from "../Contexts/UserContext";

export type tCurvedText = tRadialObject & {
  text?: string;
  color?: string;
  fontSize?: number;
  children?: React.ReactNode;
  convex?: boolean;
  drawCurve?: boolean;
  centerText?: boolean;
};

let svgCurveIdCounter = 0;

function useStableSvgId(prefix: string) {
  const idRef = React.useRef<string | null>(null);
  if (!idRef.current) {
    svgCurveIdCounter += 1;
    idRef.current = `${prefix}-${svgCurveIdCounter}`;
  }
  return idRef.current;
}

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
  centerText = true,
}: tCurvedText) {
  const curveId = useStableSvgId("curve");
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
            id={curveId}
            d={convexPath}
            fill="none"
            stroke="red"
            strokeWidth={1}
          />
        )}
        {!convex && (
          <Path
            id={curveId}
            d={concavePath}
            fill="none"
            stroke="black"
            strokeWidth={1}
          />
        )}
      </Defs>
      {children}
      <TSpan fontFamily="Outfit" fontSize={fontSize}>
        <TextPath href={`#${curveId}`} fontFamily="Outfit" fill={color}>
          {text}
        </TextPath>
      </TSpan>
      {drawCurve && (
        <Path
          id={`${curveId}-debug`}
          d={convex ? convexPath : concavePath}
          fill="none"
          stroke="blue"
          strokeWidth={1}
        />
      )}
    </Svg>
  );
}
export type tTextCircle = {
  topText?: string;
  bottomText?: string;
  topTextProps?: any;
  bottomTextProps?: any;
  radii?: [number, number];
  drawCurve?: boolean;
  centerText?: boolean;
};
export function TextCircle({
  topText = "",
  bottomText = "",
  radii = [25, 50],
  drawCurve = false,
  centerText = true,
  topTextProps,
  bottomTextProps,
}: tTextCircle) {
  const topCurveId = useStableSvgId("topcurve");
  const bottomCurveId = useStableSvgId("bottomcurve");
  const topPath = useMemo(
    () => `M${-radii[0]} 0 A1 1 0 0 1 ${radii[0]} 0 A1 1 0 0 1 ${-radii[0]} 0 `,
    [radii],
  );
  const bottomPath = useMemo(
    () => `M${-radii[1]} 0 A1 1 0 0 0 ${radii[1]} 0 A1 1 0 0 0 ${-radii[1]} 0 `,
    [radii],
  );
  const textAnchor = useRef<TextAnchor>("start");
  useEffect(() => {
    textAnchor.current = "middle";
  }, []);

  return (
    <>
      <Defs>
        <Path id={topCurveId} d={topPath} fill="none" />
        <Path id={bottomCurveId} d={bottomPath} fill="none" />
      </Defs>
      <TSpan textAnchor="middle" {...topTextProps}>
        <TextPath href={`#${topCurveId}`} {...topTextProps} startOffset="25%">
          {topText}
        </TextPath>
      </TSpan>
      <TSpan textAnchor={textAnchor.current} {...bottomTextProps}>
        <TextPath
          href={`#${bottomCurveId}`}
          {...bottomTextProps}
          startOffset="25%"
          textAnchor={textAnchor.current}
        >
          {bottomText}
        </TextPath>
      </TSpan>
      {drawCurve && (
        <Path
          id={`${topCurveId}-debug`}
          d={topPath}
          fill="none"
          stroke="blue"
          strokeWidth={2}
        />
      )}
      {drawCurve && (
        <Path
          id={`${bottomCurveId}-debug`}
          d={bottomPath}
          fill="none"
          stroke="red"
          strokeWidth={2}
        />
      )}
    </>
  );
}
