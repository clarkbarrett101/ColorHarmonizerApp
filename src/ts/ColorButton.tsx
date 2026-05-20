import { View, Text } from "react-native";
import React from "react";
import { useRadialContext } from "./RadialContext";
import Animated, { useDerivedValue } from "react-native-reanimated";
import { fCLARColorToString } from "./CLAcolor";

export type tColorButton = {
  onPress: () => void;
};

export function ColorButton() {
  const { dAR, dC, dL } = useRadialContext();
  const dColor = useDerivedValue(() => {
    const color = {
      c: dC.value,
      l: dL.value,
      ar: dAR.value,
    };
    return fCLARColorToString(color);
  }, [dC, dL, dAR]);
  return (
    <Animated.View
      style={{
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: dColor,
      }}
    >
      <Text>ColorButton</Text>
    </Animated.View>
  );
}
