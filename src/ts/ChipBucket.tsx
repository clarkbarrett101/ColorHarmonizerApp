import React, { useState, useEffect, useCallback } from "react";
import { Dimensions } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
} from "react-native-svg";
import { useUserContext, eLayers } from "./UserContext";
import { tChipEvent } from "./PaintChip";
import { transform } from "@babel/core";

const AnimatedStop = Animated.createAnimatedComponent(Stop);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export type tChipBucket = {
  origin: [number, number];
  radius: [number, number];
  callback?: (paint: any) => void;
  eventTrigger?: tChipEvent;
};

export const ChipBucket = ({
  origin = [0, 0],
  radius = [100, 200],
  callback,
  eventTrigger = "onPush",
}: tChipBucket) => {
  const { vPanX, vPanY, eventState, vHeldPaint, vPanMix, vPanOverride } =
    useUserContext();
  const vScale = useSharedValue(1);
  const fOnPreDrop = useCallback(
    (paint: any) => {
      const distance = Math.sqrt(
        (vPanX.asState() - origin[0]) ** 2 + (vPanY.asState() - origin[1]) ** 2,
      );
      if (distance < radius[1]) {
        if (callback) {
          callback(paint);
        }
      }
    },
    [vPanX.asState, vPanY.asState, origin, radius],
  );

  const [active, setActive] = useState(false);
  const inRadius = useSharedValue(false);
  const paintColor = useSharedValue("rgba(255,255,255,0)");

  useEffect(() => {
    if (eventState?.eChipEvent === eventTrigger) {
      setActive(true);
      vPanOverride.value = origin;
      vScale.value = withTiming(1, { duration: 200 });
    } else if (eventState?.eChipEvent === "onDrop" && active) {
      fOnPreDrop(eventState.paint);
      setActive(false);
      vScale.value = withTiming(0, { duration: 200 });
    } else {
      setActive(false);
      vScale.value = withTiming(0, { duration: 200 });
    }
  }, [eventState?.eChipEvent, eventState?.paint, fOnPreDrop]);

  const dDistance = useDerivedValue(() => {
    const distance = Math.sqrt(
      (vPanX.asShared.value - origin[0]) ** 2 +
        (vPanY.asShared.value - origin[1]) ** 2,
    );
    return distance / radius[1];
  });

  const animatedStyle = useAnimatedStyle(() => {
    if (inRadius.value && dDistance.value > 1) {
      inRadius.value = false;
      vPanMix.value = withTiming(0, { duration: 200 });
    } else if (!inRadius.value && dDistance.value <= 1) {
      inRadius.value = true;
      vPanMix.value = withTiming(1, { duration: 200 });
    }
    const angle = Math.atan2(
      vPanY.asShared.value - origin[1],
      vPanX.asShared.value - origin[0],
    );
    return {
      transform: [{ scale: vScale.value / dDistance.value }],
    };
  });
  const pathProps = useAnimatedProps(() => {
    const color = vHeldPaint.asShared.value?.hex || "rgba(255,255,255,1)";
    return {
      stroke: inRadius.value ? color : "rgba(255,255,255,1)",
    };
  });

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          left: origin[0] - radius[0],
          top: origin[1] - radius[0],
          width: radius[0] * 2,
          height: radius[0] * 2,
          borderRadius: radius[0],
        },
      ]}
    >
      <Svg
        width={radius[0] * 2}
        height={radius[0] * 2}
        viewBox={`0 0 ${radius[0] * 2} ${radius[0] * 2}`}
      >
        <Defs>
          <RadialGradient
            id="grad"
            cx={radius[0]}
            cy={radius[0]}
            r={radius[0]}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={radius[0]} cy={radius[0]} r={radius[0]} fill="url(#grad)" />
        <AnimatedPath
          x={radius[0] / 2}
          y={radius[0] / 2}
          animatedProps={pathProps}
          d="M0 40C80 0 240 0 320 40V160C240 200 80 200 0 160Z"
          strokeWidth={10}
          stroke={"white"}
          strokeDasharray={[20, 10]}
          fill={"transparent"}
        />
      </Svg>
    </Animated.View>
  );
};
