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
import { tAttributeMap, tAttributeModifier } from "./Actor";

const fLerp = (a, b, t) => {
  "worklet";
  return a * (1 - t) + b * t;
};
export type tChipBucket = {
  id?: string;
  origin: [number, number];
  radius: [number, number];
  callback?: (paint: any) => void;
  targetLayerRange?: [number, number];
  outlineOffset?: [number, number];
  zIndex?: number;
};

export const ChipBucket = ({
  origin = [0, 0],
  radius = [100, 200],
  callback,
  targetLayerRange = [eLayers.chipHand, eLayers.chipHand + 100],
  outlineOffset = [0, 0],
  zIndex = eLayers.buckets,
}: tChipBucket) => {
  const {
    heldChipPaint,
    vHeldChipID,
    registerModifier,
    unregisterModifier,
    vPanX,
    vPanY,
  } = useUserContext();
  const vActive = useVerse(false);
  const inRadius = useVerse(false);
  const vHeldChipIDRelay = useVerseRelay(vHeldChipID);
  const paintColor = inRadius.state ? (heldChipPaint?.hex ?? "white") : "white";
  const bucketAnim = useSharedValue(0);

  useEffect(() => {
    if (vHeldChipIDRelay.state != null) {
      if (
        vHeldChipIDRelay.state > targetLayerRange[0] &&
        vHeldChipIDRelay.state < targetLayerRange[1] &&
        !vActive.state
      ) {
        vActive.dispatch(true);
        inRadius.dispatch(false);
      }
    } else {
      if (vActive.state) {
        if (inRadius.state) {
          callback?.(heldChipPaint);
        }
        vActive.dispatch(false);
        inRadius.dispatch(false);
      }
    }
  }, [vHeldChipIDRelay.state]);

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
      if (!vActive.shared.value) return;
      if (inRadius.shared.value && distance > 1.1) {
        bucketAnim.value = withTiming(0, { duration: 500 });
        inRadius.dispatch(false);
      } else if (!inRadius.shared.value && distance < 0.9) {
        bucketAnim.value = withTiming(1, { duration: 500 });
        inRadius.dispatch(true);
      }
    },
  );
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: vActive.state ? 1 / dDistance.value : 0 }],
  }));

  const bucketModifier: tAttributeModifier = {
    modID: 20,
    deps: [
      vHeldChipIDRelay.shared,
      vActive.shared,
      bucketAnim,
      vPanX.shared,
      vPanY.shared,
    ],
    modifier: (input: tAttributeMap, last) => {
      "worklet";
      if (!vActive.shared.value) return { ...input };
      if (vHeldChipIDRelay.shared.value !== input.id) return { ...input };
      return {
        ...input,
        translateX: fLerp(
          input.translateX || 0,
          origin[0] - eChipSizes["default"][0] / 2,
          bucketAnim.value,
        ),
        translateY: fLerp(
          input.translateY || 0,
          origin[1] - eChipSizes["default"][1] / 2,
          bucketAnim.value,
        ),
      };
    },
  };

  useEffect(() => {
    console.log("Registering Bucket Modifier");
    const id = registerModifier(bucketModifier);
    return () => {
      unregisterModifier?.(id);
    };
  }, []);

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
