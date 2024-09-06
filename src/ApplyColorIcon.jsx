import * as React from "react";
import Svg, { Ellipse, Path, Rect } from "react-native-svg";

export default function ApplyColorIcon({
  width = 400,
  height = 400,
  selectedColor,
  style,
}) {
  return (
    <Svg
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      style={style}
    >
      <Ellipse
        cx={200}
        cy={200}
        rx={175}
        ry={175}
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)`}
      />
      <Path
        style={{
          transformOrigin: "136.983px 186.437px",
        }}
        d="M240.533 153.955L139.604 308.286c-25.452.988-76.5-29.144-80.521-60.567l97.084-148.026c16.938-9.286 79.524 23.885 84.366 54.262z"
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)`}
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={10}
        origin="136.983px 186.437px"
      />
      <Path
        d="M169 168.22a61.98 62.867-8.147 10121.467-24.767A61.98 62.867-8.147 10169 168.22zM193.294 163.267a37.188 37.719-8.137 0172.88-14.86 37.188 37.719-8.137 01-72.88 14.86z"
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)`}
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={10}
      />
      <Rect
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)`}
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={10}
        x={100}
        y={310}
        width={45}
        height={100}
        rotation={-30}
      />
      <Rect
        fill={`hsl(${selectedColor[0]},${selectedColor[1]}%,${selectedColor[2]}%)`}
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={10}
        x={92}
        y={305}
        width={60}
        height={35}
        rotation={-30}
      />
    </Svg>
  );
}
