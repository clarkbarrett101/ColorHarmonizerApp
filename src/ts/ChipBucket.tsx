import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native-svg";
import { useUserContext, eLayers } from "./UserContext";
import { eChipSizes, tChipStatus } from "./PaintChip";
import { useVerse } from "./Verse";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const fLerp = (a, b, t) => {
  "worklet";
  return a * (1 - t) + b * t;
};
export type tChipBucket = {
  id?: string;
  origin: [number, number];
  radius: [number, number];
  callback?: (paint: any) => void;
  statusTrigger?: string;
  outlineOffset?: [number, number];
};

export const ChipBucket = ({
  origin = [0, 0],
  radius = [100, 200],
  callback,
  statusTrigger = "pulled",
  outlineOffset = [0, 0],
}: tChipBucket) => {
  const {
    vPanX,
    vPanY,
    vPanOverride,
    heldChipDispatch,
    heldChipStatus,
    heldChipPaint,
    heldChipID,
  } = useUserContext();
  const [active, setActive] = useState(false);
  const inRadius = useVerse(false);
  const paintColor = heldChipStatus?.["grabbed"]?.["inBucket"]
    ? heldChipPaint?.hex || "rgba(255,255,255,1)"
    : "rgba(255,255,255,1)";

  useEffect(() => {
    console.log("Bucket Status:", heldChipStatus);
    if (heldChipStatus?.grabbed?.[statusTrigger]) {
      setActive(true);
    } else if (heldChipStatus?.["returning"] && active) {
      if (dDistance.value <= 1) {
        callback?.(heldChipPaint);
      }
      setActive(false);
    }
  }, [heldChipStatus, heldChipID]);

  const dDistance = useDerivedValue(() => {
    const distance = Math.sqrt(
      (vPanX.asShared.value - origin[0]) ** 2 +
        (vPanY.asShared.value - origin[1]) ** 2,
    );
    return Math.max(distance / radius[0], 0.5);
  });

  useAnimatedReaction(
    () => dDistance.value,
    (distance) => {
      if (!active) return;

      if (inRadius.asShared && distance > 1) {
        heldChipDispatch?.({ grabbed: { [statusTrigger]: {} } });
      } else if (!inRadius.asShared.value && distance <= 1) {
        heldChipDispatch?.({ grabbed: { inBucket: {} } });
        vPanOverride.value = {
          x: origin[0] + outlineOffset[0],
          y: origin[1] + outlineOffset[1],
        };
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: active ? 1 / dDistance.value : 0 }],
  }));

  return (
    <View
      style={{
        position: "absolute",
        left: origin[0] - radius[0],
        top: origin[1] - radius[0],
        zIndex: eLayers.buckets,
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            mixBlendMode: "overlay",
            zIndex: eLayers.buckets,
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
          opacity: active ? 1 : 0,
          zIndex: eLayers.buckets,
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
