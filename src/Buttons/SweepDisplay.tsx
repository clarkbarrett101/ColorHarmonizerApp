import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { Easing } from "react-native-reanimated";
import {
  Canvas,
  Rect,
  SweepGradient,
  Skia,
  Shader,
  Circle,
  vec,
  Path,
} from "@shopify/react-native-skia";
import { tRadialObject } from "../Radials/SectorTypes";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
export function SweepDisplay({
  origin,
  radii,
  layer,
  opacity,
}: tRadialObject & { opacity?: number }) {
  const rAnim = useSharedValue(0);
  useEffect(() => {
    rAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
    //  opacity.value = withRepeat(withTiming(0.5, { duration: 1000 }), -1, true);
  }, [rAnim]);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rAnim.value * 360}deg` }],
    };
  });
  const path = Skia.Path.Make();
  path.addArc(
    {
      x: (radii[1] - radii[0]) / 2,
      y: (radii[1] - radii[0]) / 2,
      width: radii[1] + radii[0],
      height: radii[1] + radii[0],
    },
    30,
    300,
  );
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: origin[1] - radii[1],
          left: origin[0] - radii[1],
          zIndex: layer,
          width: radii[1] * 2,
          height: radii[1] * 2,
          opacity: opacity ?? 0.5,
        },
        animatedStyle,
      ]}
    >
      <Canvas
        style={{
          zIndex: layer,
          width: radii[1] * 2,
          height: radii[1] * 2,
        }}
      >
        <Path
          path={path}
          style="stroke"
          strokeWidth={radii[1] - radii[0]}
          strokeJoin="round"
          strokeCap="round"
        >
          <SweepGradient
            c={vec(radii[1], radii[1])}
            colors={["rgba(255,255,255,0)", "white"]}
            start={45}
            end={360}
          />
        </Path>
      </Canvas>
    </Animated.View>
  );
}
