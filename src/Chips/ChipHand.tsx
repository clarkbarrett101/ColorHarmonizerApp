import { View, Dimensions } from "react-native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { ChipFan } from "./ChipStack";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { useVerse } from "../utils/Verse";
import { eChipSizes } from "./PaintChip";
import { useBucketContext } from "../Buckets/BucketContext";
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
} from "../utils/Actor";
import { tPaint } from "../utils/CLAcolor";
import { tRadialObject } from "../Radials/SectorTypes";
import { tChordReturn, useSoundContext } from "../Contexts/SoundContext";
import { useChipContext } from "./ChipContext";

export type tChipHand = tRadialObject & {
  holdRadius?: number;
};

export const ChipHand = ({
  radii = [80, 80],
  rotationR = -6 / 7,
  arcLength = 11 / 7,
  holdRadius = 150,
}: tChipHand) => {
  const startAngle = rotationR + arcLength / 2;
  const selectVerse = useVerse(-1);
  const {
    vPanX,
    vPanY,
    vVelocityX,
    holdChip,
    vHeldChipID,
    registerModifier,
    unregisterModifier,
  } = useChipContext();
  const { userPalette, addPaint, removePaint } = useUserContext();
  const { registerBucket, unregisterBucket, vDropScreen } = useBucketContext();
  const { fStartChord, fPlaySFX } = useSoundContext();
  const origin = useMemo<[number, number]>(
    () => [30, Dimensions.get("window").height * 0.95],
    [],
  );
  const touching = useVerse(false);
  const slowAngle = useSharedValue(0);
  const panWeight = useSharedValue(0);
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
      const index = Math.round(
        (1 - (startAngle - angle) / arcLength) * userPalette.length - 0.5,
      );
      holdChip(eLayers.chipHand + index);
      vDropScreen.shared.value = true;
      selectVerse.dispatch(index);
      touching.dispatch(true);
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
        (1 - (startAngle - angle) / arcLength) * userPalette.length - 0.5,
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
      vDropScreen.shared.value = false;
      touching.dispatch(false);
    },
  });

  const dPanx = useDerivedValue(() => {
    return vPanX.shared.value;
  });
  const dPany = useDerivedValue(() => {
    return vPanY.shared.value;
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
      vHeldChipID.shared,
    ],
  );
  const panMod = handPanModifier.modifier;

  handPanModifier.modifier = (input) => {
    "worklet";
    return (() => {
      if (input.held > 0 && panWeight.value > 0) {
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
        input.id > eLayers.chipHand + userPalette.length ||
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

        const pullX = Math.cos(input.rotateZ) * diff * (holdRadius - radii[0]);
        const pullY = Math.sin(input.rotateZ) * diff * (holdRadius - radii[0]);
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
      addPaint(paint, selectVerse.shared.value);
    },
    [addPaint],
  );
  const removePaintCallback = useCallback(
    (paint: tPaint) => {
      removePaint(paint);
    },
    [removePaint],
  );
  const chord = useRef<tChordReturn | null>(null);
  useEffect(() => {
    if (selectVerse.state > -1 && selectVerse.state < userPalette.length) {
      chord.current?.(0);
      chord.current = fStartChord?.(userPalette[selectVerse.state].clar);
    }
  }, [selectVerse.state]);
  useEffect(() => {
    if (touching.state) {
      console.log("Start Chord");
    } else {
      chord.current?.(0);
      chord.current = null;
      console.log("Stop Chord");
    }
  }, [touching.state]);

  useEffect(() => {
    registerBucket({
      origin: [origin[0] + radii[0], origin[1] - radii[0]],
      radii: [holdRadius, holdRadius * 2],
      rotationR: rotationR,
      callback: (paint) => {
        addPaintCallback(paint);
      },
      targetLayerRange: [eLayers.chipFan - 50, eLayers.chipFan + 50],
      id: 21,
      zIndex: eLayers.buckets + 100,
    });
    registerBucket({
      origin: [Dimensions.get("window").width / 2, eChipSizes.outline[1] / 2],
      radii: [holdRadius, holdRadius * 2],
      targetLayerRange: [eLayers.chipHand - 50, eLayers.chipHand + 50],
      id: 22,
      zIndex: eLayers.buckets + 100,
      callback: (paint) => {
        removePaintCallback(paint);
        fPlaySFX?.("drop");
      },
    });
    return () => {
      unregisterBucket("" + 21);
      unregisterBucket("" + 22);
    };
  }, []);
  return (
    <>
      <ChipFan
        groupLayer={eLayers.chipHand}
        paintsA={userPalette}
        size={"default"}
        radius={radii[0]}
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
            }}
          />
        </GestureDetector>
      </View>
    </>
  );
};
