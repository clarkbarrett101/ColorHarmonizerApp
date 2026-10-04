import React from "react";
import { Circle, Path, Svg } from "react-native-svg";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { fCLARColorToString } from "../utils/CLAcolor";
import Animated, {
  useAnimatedProps,
  useDerivedValue,
} from "react-native-reanimated";
import { CurvedText, TextCircle, tTextCircle } from "./CurvedText";

export type tButton = {
  onPress: () => void;
  path: string;
  size?: number;
  origin?: [number, number];
  viewRadius?: number;
  textCircle?: tTextCircle;
  layer?: number;
  inverted?: boolean;
};
export default function Button({
  onPress,
  path,
  size = 50,
  origin = [20, 40],
  viewRadius = 25,
  textCircle,
  layer = eLayers.dropScreen - 1,
  inverted = false,
}: tButton) {
  const { vColorModel, vAccentAR, vAccentC, vAccentL } = useUserContext();
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  const AnimatedPath = Animated.createAnimatedComponent(Path);
  const vColor = useDerivedValue(() =>
    fCLARColorToString(
      {
        c: vAccentC.shared.value ** (1 / 2),
        l: vAccentL.shared.value * (1 / 2),
        ar: vAccentAR.shared.value,
      },
      vColorModel.shared.value,
    ),
  );
  const animatedProps = useAnimatedProps(() => ({
    fill: inverted ? "white" : vColor.value,
  }));
  const pathProps = useAnimatedProps(() => ({
    d: path,
    fill: inverted ? vColor.value : "white",
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
      <AnimatedPath animatedProps={pathProps} />
      <TextCircle {...textCircle} />
    </Svg>
  );
}
