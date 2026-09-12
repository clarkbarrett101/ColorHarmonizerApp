import { View, Text } from "react-native";
import React from "react";
import { Circle, Path, Svg } from "react-native-svg";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { fCLARColorToString } from "../utils/CLAcolor";
import Animated, { useAnimatedProps } from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export default function MenuButton({ onPress }: { onPress: () => void }) {
  const { vAccentC, vAccentL, vAccentAR, vColorModel } = useUserContext();
  const animatedProps = useAnimatedProps(() => ({
    fill: fCLARColorToString(
      {
        c: 1,
        l: 0.5,
        ar: vAccentAR.shared.value,
      },
      vColorModel.shared.value,
    ),
  }));
  return (
    <Svg
      width={50}
      height={50}
      viewBox="-25 -25 50 50"
      style={{
        position: "absolute",
        top: 40,
        left: 20,
        width: 50,
        height: 50,
        zIndex: eLayers.dropScreen - 1,
      }}
      onTouchStart={onPress}
    >
      <AnimatedCircle
        cx={0}
        cy={0}
        r={23}
        opacity={0.5}
        animatedProps={animatedProps}
      />
      <Path
        d="M-12-9Q-15-5-11-1L12-5Q15-10 10-14ZM6-3-11 0C-12 2-12 3-11 5L14 5C16 3 16-1 14-3ZM-11 6-12 5C-14 6-14 9-11 11L9 15Q14 12 12 7L6 6Z"
        fill="white"
      />
    </Svg>
  );
}
