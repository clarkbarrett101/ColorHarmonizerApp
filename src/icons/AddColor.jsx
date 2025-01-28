import * as React from "react";
import Svg, { Ellipse, Path } from "react-native-svg";

export default function AddColor({ style, width, height, selectedColor }) {
  return (
    <Svg
      viewBox="0 0 600 600"
      xmlns="http://www.w3.org/2000/svg"
      width={width || 400}
      height={width || 400}
      style={style}
    >
      <Ellipse
        cx={200}
        cy={200}
        rx={200}
        ry={200}
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)
        `}
      />
      <Path
        d="M152.53-12.026l9.804-159.945c18.932-11.977 70.84-11.988 87.533 9.73L240.253-8.708c-8.856 14.421-70.858 17.254-87.723-3.318z"
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)
        `}
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={10}
        originX={102.318}
        x={-100}
        originY={194.502}
        y={250}
      />
      <Path
        d="M107.355-96.047l45.533-153.64c21.14-7.411 71.72 4.255 83.1 29.17L192.083-73.08c-11.873 12.06-72.923.873-84.728-22.966z"
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)
        `}
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={10}
        x={32}
        y={270}
      />
      <Path
        d="M255.287 7.848l106.198-120.002c22.292 2.218 63.202 34.167 62.986 61.558L322.371 64.47c-15.857 5.912-66.46-30.028-67.084-56.623z"
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)
        `}
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={10}
        x={-90}
        y={230}
      />
      <Path
        d="M264.515 148.275L410.34 81.842c19.463 11.093 43.841 56.92 32.503 81.855l-140.074 63.59c-16.891-1.049-48.5-54.463-38.254-79.012z"
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)
        `}
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={10}
        x={-75}
        y={125}
      />
    </Svg>
  );
}
