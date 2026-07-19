import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
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
  Circle,
  Path,
} from "react-native-svg";
import { useUserContext, eLayers } from "../Contexts/UserContext";
import { eChipSizes } from "../Chips/PaintChip";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { tRadialObject } from "../Radials/SectorTypes";
import { tPaint } from "../utils/CLAcolor";
import { useChipContext } from "../Chips/ChipContext";

const fLerp = (a, b, t) => {
  "worklet";
  return a * (1 - t) + b * t;
};
export type tChipBucket = tRadialObject & {
  id?: number;
  callback?: (paint: tPaint) => void;
  targetLayerRange?: [number, number];
  outlineOffset?: [number, number];
  zIndex?: number;
};

export const ChipBucket = ({
  origin = [0, 0],
  radii = [100, 200],
  callback,
  targetLayerRange = [eLayers.chipHand, eLayers.chipHand + 100],
  outlineOffset = [0, 0],
  zIndex = eLayers.buckets,
  rotationR = 0,
  id = 0,
}: tChipBucket) => {
  const {
    heldChipPaint,
    vHeldChipID,
    registerModifier,
    unregisterModifier,
    vPanX,
    vPanY,
  } = useChipContext();
  const vActive = useVerse(false);
  const inRadius = useVerse(false);
  const vHeldChipRelay = useVerseRelay(vHeldChipID);
  const paintColor = inRadius.state ? (heldChipPaint?.hex ?? "white") : "white";
  const bucketAnim = useSharedValue(0);

  useEffect(() => {
    if (vHeldChipRelay.state != null) {
      if (
        vHeldChipRelay.state > targetLayerRange[0] &&
        vHeldChipRelay.state < targetLayerRange[1] &&
        !vActive.shared.value
      ) {
        vActive.dispatch(true);
        inRadius.dispatch(false);
      }
    } else {
      if (vActive.shared.value) {
        if (inRadius.shared.value) {
          callback?.(heldChipPaint);

          bucketAnim.value = withTiming(0, { duration: 500 });
        }
        vActive.dispatch(false);
        inRadius.dispatch(false);
      }
    }
  }, [vHeldChipRelay.state]);

  const dDistance = useDerivedValue(() => {
    const distance = Math.sqrt(
      (vPanX.shared.value - origin[0]) ** 2 +
        (vPanY.shared.value - origin[1]) ** 2,
    );
    return Math.max(distance / radii[0], 0.5);
  });

  useAnimatedReaction(
    () => dDistance.value,
    (distance) => {
      if (!vActive.shared.value) {
        inRadius.shared.value = false;
        bucketAnim.value = 0;
        return;
      }
      if (inRadius.shared.value && distance > 1.1) {
        bucketAnim.value = withTiming(0, { duration: 500 });
        inRadius.dispatch(false);
      } else if (!inRadius.shared.value && distance < 0.9) {
        bucketAnim.value = withTiming(1, { duration: 500 });
        inRadius.dispatch(true);
      }
    },
  );
  // vActive.state is a stale JS closure inside a worklet — must use .shared.value
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: vActive.shared.value ? 1 / dDistance.value : 0 }],
  }));

  const bucketModifier: tAttributeModifier = {
    modID: id,
    deps: [
      vHeldChipID.shared,
      vActive.shared,
      bucketAnim,
      vPanX.shared,
      vPanY.shared,
    ],
    modifier: (input: tAttributeMap, last) => {
      "worklet";
      if (!vActive.shared.value) return { ...input };
      if (vHeldChipID.shared.value !== input.id) return { ...input };
      return {
        ...input,
        translateX: fLerp(
          input.translateX || 0,
          origin[0] + outlineOffset[0],
          bucketAnim.value,
        ),
        translateY: fLerp(
          input.translateY || 0,
          origin[1] + outlineOffset[1],
          bucketAnim.value,
        ),
        rotateZ: fLerp(
          input.rotateZ || 0,
          rotationR,
          Math.min(1, bucketAnim.value * 2),
        ),
      };
    },
  };

  useEffect(() => {
    registerModifier(bucketModifier);
    return () => {
      unregisterModifier?.(id);
    };
  }, []);
  return (
    <View
      style={{
        position: "absolute",
        left: origin[0] - radii[0],
        top: origin[1] - radii[0],
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
          width={radii[0] * 2}
          height={radii[0] * 2}
          viewBox={`0 0 ${radii[0] * 2} ${radii[0] * 2}`}
        >
          <Defs>
            <RadialGradient
              id="grad"
              cx={radii[0]}
              cy={radii[0]}
              r={radii[0]}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor={paintColor} />
              <Stop offset="100%" stopColor={paintColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <Circle cx={radii[0]} cy={radii[0]} r={radii[0]} fill="url(#grad)" />
        </Svg>
      </Animated.View>

      <Svg
        width={eChipSizes.outline[0]}
        height={eChipSizes.outline[1]}
        viewBox={`-1 0 34 24`}
        style={{
          position: "absolute",
          top: radii[0] - eChipSizes.outline[1] / 2,
          left: radii[0] - eChipSizes.outline[0] / 2,
          shadowOpacity: 0.5,
          shadowRadius: 5,
          transform: [
            { translateX: outlineOffset[0] },
            { translateY: outlineOffset[1] },
            { rotateZ: `${rotationR}rad` },
          ],
          opacity: vActive.state ? 1 : 0,
          zIndex: zIndex + 20,
        }}
      >
        <Path
          d="M 0 4 C 8 0 24 0 32 4 V 20 C 24 24 8 24 0 20 Z"
          strokeWidth={1}
          stroke={paintColor}
          strokeDasharray={[2, 1]}
          fill={"transparent"}
        />
      </Svg>
    </View>
  );
};
