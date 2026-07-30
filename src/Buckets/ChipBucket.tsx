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

const icons = {
  add: "M5 8C20 18 50 18 65 8L65-12C64-13 63-14 61-15L61 1C47 10 24 11 5 4ZM10 16C25 26 55 26 70 16L70-4C69-5 68-6 66-7L66 9C55 16 33 20 10 12ZM0 0C15 10 45 10 60 0L60-20C42-27 27-27 18-25L18-23 28-23 28-11 18-11 18-1 5-1 5-10 0-10ZM-3-11-3-22 7-22 7-32 17-32 17-22 27-22 27-12 17-12 17-2 6-2 6-11Z",
  removeNeg:
    "M0 0C15 10 45 10 60 0L60-20C45-30 15-30 0-20ZM10 15 5 10 25-10 5-30 10-35 30-15 50-35 55-30 35-10 55 10 50 15 30-5Z",
  searchNeg:
    "m0 0c15 10 45 10 60 0l0-20c-15-10-45-10-60 0zm21-4a1 1 0 0121-12 12 12 0 01-16 17l-15 15-5-5zm12-14a1 1 0 00-3 16 1 1 0 003-16",
  remove:
    "M-23 8M-15 18-18 15-3 0-18-15-15-18 0-3 15-18 18-15 3 0 18 15 15 18 0 3ZM24-8C21-10 20-11 16-12L4 0 16 12C20 11 21 10 24 8ZM10 14 0 4-10 14C-2 15 2 15 10 14ZM-24 8C-21 10-20 11-16 12L-4 0-16-12C-20-11-21-10-24-8ZM-10-14C-3-15 2-15 10-14L0-4Z",
  search:
    "M-14 11C-16 10-19 8-21 7L-21-7C-11-14 11-14 21-7L21 7C12 12 7 13-7 12L-3 8A9 9 90 009-4 1 1 90 00-7 4L-14 11ZM2-6A1 1 90 010 6 1 1 90 012-6ZM-17 15-14 18-3 7A8 8 90 008-4 1 1 90 00-6 4ZM0 5A1 1 90 002-5 1 1 90 000 5",
  chip: "M0 0C15 10 45 10 60 0L60-20C45-30 15-30 0-20Z",
  chip45: "M0 0C18-4 39-25 42-42L28-57C11-53-11-32-14-14Z",
  chip90: "M0 0C10-15 10-45 0-60L-20-60C-30-45-30-15-20-0Z",
  chip30: "M0 0C18 1 44-14 52-30L42-47C24-48-2-33-10-17Z",
  addChip:
    "M-23 1C-22-9-12-19-2-20L5-13C4-4-7 8-16 8ZM-16 9C-11 8-10 8-7 6L-5 10C0 11 5 10 12 6 14 7 12 6 14 7L14 15C6 21-9 21-16 15ZM-6 5C1-1 2-2 6-11 11-13 13-13 18-13L19-10l-2 0 0 3-3 0 0 5 3 0 0 3L19 1C19 1 4 11-4 9ZM18 0l0-3L15-3 15-6 18-6 18-9 21-9 21-6 24-6 24-3 21-3 21 0Z",
  swap: "M44 9 38 12C39 13 40 14 41 15 50 14 56 12 65 8L65-12C64-13 63-14 61-15L61 1C51 6 48 7 41 7L41 7ZM0 0 0 0C9 5 11 6 20 6L22-4 40 6C48 6 54 4 60 0L60-20C53-23 44-25 41-25 34-21 27-16 20-9 22-18 24-20 28-25 17-25 8-23 0-17L0-17ZM106 15C112 16 125 15 141 8L141-12C140-13 139-14 137-15L137 1C122 7 116 8 112 8ZM104 8 94 14C90 13 83 11 81 9L81 4C90 7 97 8 103 8ZM76 0 76 0C80 4 98 8 105 7L115-1 112 7C115 7 127 5 136 0L136-20C129-23 123-25 116-25L113-7 90-20 97-23 95-25C90-24 86-24 76-20ZM114-28 111-10 94-20 100-23C81-45 41-32 22-13 41-49 84-50 108-26ZM21 17 23-1 41 9 35 12C54 34 94 21 113 2 94 38 51 39 27 15ZM6 4 6 9C12 13 15 13 19 14L20 7C14 7 11 7 6 4",
};
/**
 * @param radii
 */
export type tChipBucket = tRadialObject & {
  id?: number;
  callback?: (paint: tPaint) => void;
  targetLayerRange?: [number, number];
  outlineOffset?: [number, number];
  zIndex?: number;
  icon?: keyof typeof icons;
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
  icon,
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
        vHeldChipRelay.state >= targetLayerRange[0] &&
        vHeldChipRelay.state <= targetLayerRange[1] &&
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
        viewBox={`-32 -24 64 48`}
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
          d="M-32-16C-16-24 16-24 32-16V16C16 24-16 24-32 16Z"
          strokeWidth={1}
          stroke={paintColor}
          strokeDasharray={[2, 1]}
          fill={"transparent"}
        />
      </Svg>
      {icon && (
        <Svg
          width={eChipSizes.outline[0]}
          height={eChipSizes.outline[1]}
          viewBox={`-32 -24 64 48`}
          style={{
            position: "absolute",
            top: radii[0] - eChipSizes.outline[1] / 2,
            left: radii[0] - eChipSizes.outline[0] / 2,
            shadowOpacity: 0.5,
            shadowRadius: 5,
            transform: [
              { translateX: outlineOffset[0] },
              { translateY: outlineOffset[1] },
            ],
            opacity: vActive.state ? 1 : 0,
            zIndex: eLayers.superMax + 20,
          }}
        >
          <Path d={icons[icon]} fill={paintColor} />
        </Svg>
      )}
    </View>
  );
};
