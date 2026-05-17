import { View, Dimensions } from "react-native";
import React, {
  Profiler,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { ChipFan } from "./ChipStack";
import UserContext, { eLayers, useUserContext } from "./UserContext";
import { scheduleOnRN } from "react-native-worklets";
import { useVerse, useVerseRelay } from "./Verse";
import { eChipMap, eChipSizes, fLerp } from "./PaintChip";
import BucketContext, { useBucketContext } from "./BucketContext";
import {
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  tAttributeModifier,
  tAttributeMap,
  fLerpModifierFactory,
} from "./Actor";
import { tPaint } from "./CLAcolor";
export type tChipHand = {
  radius?: number;
  rotationR?: number;
  arcLength?: number;
  holdRadius?: number;
};

export const ChipHand = ({
  radius = 80,
  rotationR = 6 / 7,
  arcLength = 12 / 7,
  holdRadius = 200,
}: tChipHand) => {
  const startAngle = rotationR - arcLength / 2;
  const selectVerse = useVerse(-1);
  const {
    vPanX,
    vPanY,
    vVelocityX,
    userPallete,
    addPaint,
    holdChip,
    vHeldChipID,
    registerModifier,
    unregisterModifier,
  } = useUserContext();
  const { registerBucket, unregisterBucket, vDropScreen } = useBucketContext();
  const origin: [number, number] = [30, Dimensions.get("window").height * 0.95];
  const touching = useVerse(false);
  //const vHeldChipStatus = useVerseRelay(vHeldChipRoot);
  const slowAngle = useSharedValue(0);
  const panWeight = useSharedValue(0);
  const vHeldChipIDRelay = useVerseRelay(vHeldChipID);
  const pan = usePanGesture({
    minDistance: 0,
    onBegin: (event) => {
      "worklet";
      console.log("Hand Activate");
      vPanX.shared.value = event.absoluteX;
      vPanY.shared.value = event.absoluteY;
      const angle = Math.atan2(
        event.absoluteY - origin[1],
        event.absoluteX - origin[0],
      );
      const distance = Math.sqrt(
        (event.absoluteX - origin[0]) ** 2 + (event.absoluteY - origin[1]) ** 2,
      );
      const index =
        (Math.round(((startAngle - angle) / arcLength) * userPallete.length) -
          0.5) /
        userPallete.length;

      selectVerse.dispatch(index);
      holdChip(eLayers.chipHand + index);
      touching.dispatch(true);
      vDropScreen.dispatch(true);
    },
    onUpdate: (event) => {
      "worklet";
      vPanX.shared.value = event.absoluteX;
      vPanY.shared.value = event.absoluteY;

      vVelocityX.shared.value = event.velocityX;
      const angle = Math.atan2(
        event.absoluteY - origin[1],
        event.absoluteX - origin[0],
      );

      const index = Math.round(
        ((startAngle - angle) / arcLength) * userPallete.length,
      );
      const distance = Math.sqrt(
        (event.absoluteX - origin[0]) ** 2 + (event.absoluteY - origin[1]) ** 2,
      );

      if (distance > holdRadius) {
        panWeight.value = withTiming(1, { duration: 200 });
        holdChip(eLayers.chipHand + selectVerse.shared.value);
      } else {
        holdChip();
        slowAngle.value = withSpring(angle, { stiffness: 1000, damping: 1000 });
        panWeight.value = withTiming(0, { duration: 200 });
        selectVerse.dispatch(index);
      }
    },
    onFinalize: (event) => {
      "worklet";
      console.log("Hand Deactivate");
      panWeight.value = withTiming(0, { duration: 200 });
      holdChip();
      touching.dispatch(false);
      vDropScreen.dispatch(false);
    },
  });

  const dPanx = useDerivedValue(() => {
    return vPanX.shared.value - eChipSizes["grabbed"][0] / 2;
  });
  const dPany = useDerivedValue(() => {
    return vPanY.shared.value - eChipSizes["grabbed"][1] / 2;
  });
  const dRotation = useDerivedValue(() => {
    return vVelocityX.shared.value * 0.0005;
  });
  const dScale = useDerivedValue(() => {
    return 1.3;
  });
  const dZIndex = useDerivedValue(() => {
    return eLayers.grabbedChip + 100;
  });
  const handPanModifier = fLerpModifierFactory(
    11,
    {
      translateX: dPanx,
      translateY: dPany,
      rotateZ: dRotation,
      scaleX: dScale,
      scaleY: dScale,
      zIndex: dZIndex,
    },
    panWeight,
    [
      vPanX.shared,
      vPanY.shared,
      vVelocityX.shared,
      panWeight,
      vHeldChipIDRelay.shared,
    ],
  );
  const panMod = handPanModifier.modifier;

  handPanModifier.modifier = (input) => {
    "worklet";
    return (() => {
      if (input.id === vHeldChipIDRelay.shared.value && panWeight.value > 0) {
        return panMod(input);
      } else {
        return input;
      }
    })();
  };

  const nudgeModifier: tAttributeModifier = {
    modID: 10,
    deps: [vPanX.shared, vPanY.shared, touching.shared, slowAngle],
    modifier: (input: tAttributeMap, last?: tAttributeMap) => {
      "worklet";
      if (
        input.id > eLayers.chipHand + userPallete.length ||
        input.id < eLayers.chipHand
      ) {
        return input;
      }
      let diff = Math.abs(input.rotateZ - slowAngle.value) / arcLength;
      diff = 1 - diff;
      let z = Math.round(diff * 10);
      diff = Math.pow(diff, 3);

      if (touching.shared.value) {
        diff *= Math.min(
          1,
          Math.sqrt(
            (vPanX.shared.value - origin[0]) ** 2 +
              (vPanY.shared.value - origin[1]) ** 2,
          ) / holdRadius,
        );

        const pullX = Math.cos(input.rotateZ) * diff * (holdRadius - radius);
        const pullY = Math.sin(input.rotateZ) * diff * (holdRadius - radius);
        return {
          ...input,
          translateX: input.translateX + pullX,
          translateY: input.translateY + pullY,
          zIndex: eLayers.chipHand + z,
        };
      }
      return { ...input, zIndex: eLayers.chipHand + z };
    },
  };
  useEffect(() => {
    const nudgeId = registerModifier(nudgeModifier);
    const handPanId = registerModifier(handPanModifier);
    return () => {
      unregisterModifier(nudgeId);
      unregisterModifier(handPanId);
    };
  }, []);
  const addPaintCallback = useCallback(
    (paint: tPaint) => {
      addPaint(paint, selectVerse.state);
    },
    [selectVerse.state],
  );

  useEffect(() => {
    registerBucket({
      origin: [origin[0] + radius, origin[1] - radius],
      radius: [holdRadius, holdRadius * 2],
      callback: (paint) => {
        addPaintCallback(paint);
      },
      targetLayerRange: [eLayers.chipFan, eLayers.chipFan + 100],
      id: `hand-bucket`,
      zIndex: eLayers.buckets + 100,
    });
    return () => {
      unregisterBucket(`hand-bucket`);
    };
  }, []);
  console.log("Rendering ChipHand with selected index", selectVerse.state);
  return (
    <>
      <ChipFan
        groupLayer={eLayers.chipHand}
        paintsA={userPallete}
        size={"default"}
        radius={radius}
        direction={1}
        origin={origin}
        rotationR={rotationR}
        arcLength={arcLength}
      />

      <View
        style={{
          zIndex: eLayers.superMax,
          position: "absolute",
          left: origin[0] - holdRadius,
          top: origin[1] - holdRadius,
        }}
      >
        <GestureDetector gesture={pan}>
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: holdRadius * 2,
              height: holdRadius * 2,
              borderColor: "rgba(255,255,255,1)",
              borderRadius: holdRadius,
              borderWidth: 2,
            }}
          />
        </GestureDetector>
      </View>
    </>
  );
};
