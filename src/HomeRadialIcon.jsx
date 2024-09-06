import * as React from "react";
import Svg, { Ellipse, Path } from "react-native-svg";
export default function HomeRadialIcon({ selectedColor, height, width }) {
  return (
    <Svg
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
    >
      <Ellipse
        cx={200}
        cy={200}
        rx={200}
        ry={200}
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)`}
      />

      <Path
        d="M325 200L75 200"
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)`}
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={50}
        strokeLinecap="round"
      />
      <Path
        d="M100 85L325 125"
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)`}
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={50}
        strokeLinecap="round"
      />
      <Path
        d="M100 315L325 275"
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)`}
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={50}
        strokeLinecap="round"
      />
    </Svg>
  );
}
