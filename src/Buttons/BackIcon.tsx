import Svg, { Path } from "react-native-svg";
import { eLayers } from "../Contexts/UserContext";

export type tBackIcon = {
  size?: number;
  color?: string;
  origin?: [number, number];
  zIndex?: number;
};

export function BackIcon({
  size = 20,
  color = "black",
  origin = [20, 20],
  zIndex = eLayers.chipFan,
}: tBackIcon) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 -2 30 30"
      fill={color}
      style={{
        position: "absolute",
        top: origin[1] - size / 2,
        left: origin[0] - size / 2,
        zIndex: zIndex,
      }}
      pointerEvents="none"
    >
      <Path d="M27 17C-5 42-7-11 23 6L25 3 29 12 19 12 21 9C0-3 0 32 27 17" />
    </Svg>
  );
}
