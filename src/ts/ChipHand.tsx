import { View, Dimensions } from "react-native";
import React, { use, useEffect, useRef, useState } from "react";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { ChipFan } from "./ChipStack";
import { eLayers, useUserContext } from "./UserContext";
import { scheduleOnRN } from "react-native-worklets";
import { useVerse, useVerseRelay } from "./Verse";
import { eChipMap } from "./PaintChip";
import { useBucketContext } from "./BucketContext";
import { useSharedValue } from "react-native-reanimated";

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
    userPallete,
    addPaint,
    vPanX,
    vPanY,
    vVelocityX,
    holdChip,
    vHeldChipRoot,
  } = useUserContext();
  const { registerBucket, unregisterBucket } = useBucketContext();
  const origin: [number, number] = [30, Dimensions.get("window").height * 0.95];
  const [touching, setTouching] = React.useState(false);
  const vHeldChipStatus = useVerseRelay(vHeldChipRoot);
  const nudge = useSharedValue({ x: 0, y: 0 });
  const pan = usePanGesture({
    minDistance: 0,
    onBegin: (event) => {
      "worklet";
      console.log("Hand Activate");
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
      nudge.value = {
        x: Math.cos(angle) * distance * 0.3,
        y: Math.sin(angle) * distance * 0.3,
      };
      selectVerse.dispatch(index);
      holdChip([eLayers.chipHand, index], ["idle", "choosing"]);
      scheduleOnRN(setTouching, true);
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
      const index =
        (Math.round(((startAngle - angle) / arcLength) * userPallete.length) -
          0.5) /
        userPallete.length;

      const distance = Math.sqrt(
        (event.absoluteX - origin[0]) ** 2 + (event.absoluteY - origin[1]) ** 2,
      );
      nudge.value = {
        x: Math.cos(angle) * distance * 0.3,
        y: Math.sin(angle) * distance * 0.3,
      };

      if (distance > holdRadius) {
        if (vHeldChipStatus?.shared.value[0] !== "grabbed") {
          holdChip(
            [eLayers.chipHand, selectVerse.shared.value],
            ["grabbed", "pushed"],
          );
        }
      } else {
        holdChip([eLayers.chipHand, index], ["idle", "choosing"]);
        selectVerse.dispatch(index);
      }
    },
    onFinalize: (event) => {
      "worklet";
      console.log("Hand Deactivate");
      nudge.value = { x: 0, y: 0 };
      holdChip();
      scheduleOnRN(setTouching, false);
    },
  });
  const isPulling =
    vHeldChipStatus?.state[0] === "grabbed" &&
    vHeldChipStatus?.state[1] === "pulled";

  useEffect(() => {
    registerBucket({
      origin: [origin[0] + radius, origin[1] - radius],
      radius: [holdRadius, holdRadius * 2],
      callback: (paint) => {
        addPaint(paint);
      },
      statusTrigger: ["grabbed", "pulled"],
      id: `hand-bucket`,
      zIndex: eLayers.buckets + 100,
    });
    return () => unregisterBucket(`hand-bucket`);
  }, []);
  return (
    <>
      <ChipFan
        groupLayer={eLayers.chipHand}
        paintsA={userPallete}
        size={"default"}
        radius={touching || isPulling ? holdRadius - 50 : radius}
        direction={1}
        origin={origin}
        rotationR={rotationR}
        arcLength={arcLength}
        firstIndex={0}
        gapIndex={selectVerse.state}
        fGetChipModifier={(chip) => {
          return {
            ...chip,
            radialOffset:
              chip.radialOffset +
              (Math.abs(selectVerse.state - chip.chipID[1]) < 0.1 ? 20 : 0),
          };
        }}
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
            }}
          />
        </GestureDetector>
      </View>
    </>
  );
};
