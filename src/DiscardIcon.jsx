import * as React from "react";
import Svg, { Ellipse, Path } from "react-native-svg";

export default function DiscarcIcon({
  selectedColor = [0, 49, 50],
  height,
  width,
  style,
}) {
  return (
    <Svg
      viewBox="0 0 400 400"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <Ellipse
        cx={199.597}
        cy={198.789}
        rx={200}
        ry={200}
        fill={
          "hsl(" +
          selectedColor[0] +
          "," +
          selectedColor[1] +
          "%," +
          selectedColor[2] +
          "%)"
        }
      />
      <Path
        d="M316.152 118.371L189.331 312.295c-31.982 1.241-96.125-36.62-101.179-76.106L210.143 50.188c21.283-11.668 99.925 30.013 106.009 68.183z"
        fill={
          "hsl(" +
          selectedColor[0] +
          "," +
          selectedColor[1] +
          "%," +
          selectedColor[2] +
          "%)"
        }
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={10}
      />
      <Path
        d="M141.453 259.776l59.661-59.982 58.645 59.361 19.86-19.781-58.135-59.803 60.724-61.67-19.837-20.183-60.764 62.201-62.014-63.001-20.242 19.775 62.367 62.616-59.381 60.968 19.116 19.499z"
        fill={
          "hsl(" +
          selectedColor[0] +
          "," +
          selectedColor[1] +
          "%," +
          selectedColor[2] +
          "%)"
        }
        stroke={selectedColor[2] > 50 ? "black" : "white"}
        strokeWidth={10}
      />
    </Svg>
  );
}
