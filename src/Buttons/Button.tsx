import React from "react";
import { Circle, Path, Svg } from "react-native-svg";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { fCLARColorToString } from "../utils/CLAcolor";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import { CurvedText, TextCircle, tTextCircle } from "./CurvedText";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
export type tButton = {
  onPress: () => void;
  path: string;
  size?: number;
  origin?: [number, number];
  viewRadius?: number;
  textCircle?: tTextCircle;
  layer?: number;
};
export default function Button({
  onPress,
  path,
  size = 50,
  origin = [20, 40],
  viewRadius = 25,
  textCircle,
  layer = eLayers.dropScreen - 1,
}: tButton) {
  const { dAccentColor, vColorModel } = useUserContext();
  const animatedProps = useAnimatedProps(() => ({
    fill: fCLARColorToString(
      {
        c: dAccentColor.value.c ** (1 / 2),
        l: dAccentColor.value.l * (1 / 2),
        ar: dAccentColor.value.ar,
      },
      vColorModel.shared.value,
    ),
  }));
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`${-viewRadius} ${-viewRadius} ${viewRadius * 2} ${viewRadius * 2}`}
      style={{
        position: "absolute",
        top: origin[1] - size / 2,
        left: origin[0] - size / 2,
        width: size,
        height: size,
        zIndex: layer,
        shadowColor: "black",
        shadowOffset: { width: -2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      }}
      onTouchStart={onPress}
    >
      <AnimatedCircle
        cx={0}
        cy={0}
        r={viewRadius}
        animatedProps={animatedProps}
      />
      <AnimatedPath d={path} fill="white" />
      <TextCircle {...textCircle} />
    </Svg>
  );
}
