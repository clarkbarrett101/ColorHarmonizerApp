import React, { useState, useEffect, useCallback, use } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
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
  Line,
} from "react-native-svg";
import { useUserContext, eLayers } from "./UserContext";
import { eChipMap, eChipSizes, tChipStatus } from "./PaintChip";
import { useVerse, useVerseRelay } from "./Verse";
import { tPaint } from "./CLAcolor";
import { scheduleOnRN } from "react-native-worklets";
import { transform } from "@babel/core";

const clarColorsList: tPaint[] = require("./clarColors.json");

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const fLerp = (a, b, t) => {
  "worklet";
  return a * (1 - t) + b * t;
};
export type tChipBucket = {
  id?: string;
  origin: [number, number];
  radius: [number, number];
  callback?: (paint: any) => void;
  statusTrigger?: tChipStatus;
  outlineOffset?: [number, number];
  zIndex?: number;
};

export const ChipBucket = ({
  origin = [0, 0],
  radius = [100, 200],
  callback,
  statusTrigger = ["grabbed", "pulled"],
  outlineOffset = [0, 0],
  zIndex = eLayers.buckets,
}: tChipBucket) => {
  const { vPanX, vPanY, vPanOverride, vHeldChipRoot, heldChipPaint } =
    useUserContext();
  const circleRadius = 150;
  const vActive = useVerse(false);
  const inRadius = useVerse(false);
  const vHeldChipStatus = useVerseRelay(vHeldChipRoot);
  const paintColor = inRadius.state ? heldChipPaint.hex : "white";
  useEffect(() => {
    if (
      vHeldChipStatus.state[0] === statusTrigger[0] &&
      vHeldChipStatus.state[1] === statusTrigger[1] &&
      !vActive.state
    ) {
      vActive.dispatch(true);
    } else {
      if (vHeldChipStatus?.state[1] === "returning" && vActive.state) {
        if (inRadius.state) {
          callback?.(heldChipPaint);
        }
        vActive.dispatch(false);
        inRadius.dispatch(false);
      }
    }
  }, [vHeldChipStatus.state]);

  const dDistance = useDerivedValue(() => {
    const distance = Math.sqrt(
      (vPanX.shared.value - origin[0]) ** 2 +
        (vPanY.shared.value - origin[1]) ** 2,
    );
    return Math.max(distance / radius[0], 0.5);
  });

  useAnimatedReaction(
    () => dDistance.value,
    (distance) => {
      if (
        !vActive.shared.value ||
        vHeldChipStatus?.shared.value[1] === "returning"
      )
        return;
      if (inRadius.shared.value && distance > 1.1) {
        vHeldChipStatus.dispatch(statusTrigger);
        inRadius.dispatch(false);
      } else if (!inRadius.shared.value && distance < 0.9) {
        inRadius.dispatch(true);
        vHeldChipStatus.dispatch(["grabbed", "inBucket"]);
        vPanOverride.value = {
          x: origin[0] + outlineOffset[0],
          y: origin[1] + outlineOffset[1],
        };
      }
    },
  );
  const angle = useDerivedValue(() => {
    if (!vActive.state) return 0;
    return Math.atan2(
      vPanY.shared.value - origin[1],
      vPanX.shared.value - origin[0],
    );
  });
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: vActive.state ? 1 / dDistance.value : 0 }],
  }));
  const circleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: vActive.state ? 1 : 0,
    transform: [{ scale: 1 }],
    left: vPanX.shared.value - radius[0],
    top: vPanY.shared.value - radius[0] - circleRadius / 2,
  }));
  const rectProps = useAnimatedProps(() => {
    const length = radius[0] * 2 * dDistance.value;
    const height = (radius[0] * 2) / dDistance.value;
    return {
      width: length,
      height: height,
      transform: [
        { translateY: -height / 2 + radius[0] },
        { rotate: `${angle.value}rad` },
      ],
    };
  });

  return (
    <View
      style={{
        position: "absolute",
        left: origin[0] - radius[0],
        top: origin[1] - radius[0],
        zIndex: vActive.state ? zIndex : -1,
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            mixBlendMode: "overlay",
            zIndex: zIndex + 10,
          },
          animatedStyle,
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
              <Stop offset="0%" stopColor={paintColor} />
              <Stop offset="100%" stopColor={paintColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <Circle
            cx={radius[0]}
            cy={radius[0]}
            r={radius[0]}
            fill="url(#grad)"
          />
        </Svg>
      </Animated.View>

      <Svg
        width={eChipSizes.outline[0]}
        height={eChipSizes.outline[1]}
        viewBox={`0 0 32 20`}
        style={{
          position: "absolute",
          top: radius[0] - eChipSizes.outline[1] / 2,
          left: radius[0] - eChipSizes.outline[0] / 2,
          shadowOpacity: 0.5,
          shadowRadius: 5,
          transform: [
            { translateX: outlineOffset[0] },
            { translateY: outlineOffset[1] },
          ],
          opacity: vActive.state ? 1 : 0,
          zIndex: zIndex + 20,
        }}
      >
        <Path
          d="M0 4C8 0 24 0 32 4V16C24 20 8 20 0 16Z"
          strokeWidth={1}
          stroke={paintColor}
          strokeDasharray={[2, 1]}
          fill={"transparent"}
        />
      </Svg>
    </View>
  );
};
