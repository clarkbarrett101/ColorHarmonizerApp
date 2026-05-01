import { View, Dimensions } from "react-native";
import React, { use, useEffect, useState } from "react";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { ChipFan } from "./ChipStack";
import { eLayers, useUserContext } from "./UserContext";
import { runOnJS } from "react-native-worklets";
import { useVerse } from "./Verse";

export type tChipHand = {
  radius?: number;
  rotationR?: number;
  arcLength?: number;
  holdRadius?: number;
};

export const ChipHand = ({
  radius = 80,
  rotationR = 6 / 7,
  arcLength = 10 / 7,
  holdRadius = 150,
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
    registerBucket,
    unregisterBucket,
  } = useUserContext();
  const origin: [number, number] = [30, Dimensions.get("window").height];
  const [touching, setTouching] = React.useState(false);
  const pan = usePanGesture({
    minDistance: 0,
    onBegin: (event) => {
      "worklet";
      console.log("Hand Activate");
      const angle = Math.atan2(
        event.absoluteY - origin[1],
        event.absoluteX - origin[0],
      );
      const index =
        (Math.round(
          ((startAngle - angle) / arcLength) * userPallete.current.length,
        ) -
          0.5) /
        userPallete.current.length;
      selectVerse.fUpdateState(index);
      runOnJS(setTouching)(true);
    },
    onUpdate: (event) => {
      "worklet";
      const angle = Math.atan2(
        event.absoluteY - origin[1],
        event.absoluteX - origin[0],
      );
      const distance = Math.sqrt(
        (event.absoluteX - origin[0]) ** 2 + (event.absoluteY - origin[1]) ** 2,
      );
      if (distance > holdRadius) {
        holdChip([eLayers.chipHand, selectVerse.asShared.value], "onPush");
        vPanX.setValue(event.absoluteX);
        vPanY.setValue(event.absoluteY);
        vVelocityX.setValue(event.velocityX);
      } else {
        holdChip();
        const index =
          (Math.round(
            ((startAngle - angle) / arcLength) * userPallete.current.length,
          ) -
            0.5) /
          userPallete.current.length;
        selectVerse.fUpdateState(index);
      }
    },
    onFinalize: (event) => {
      "worklet";
      console.log("Hand Deactivate");
      holdChip();
      runOnJS(setTouching)(false);
    },
  });
  useEffect(() => {
    registerBucket({
      origin,
      radius: [holdRadius, holdRadius + 50],
      callback: (paint) => {
        addPaint(paint);
      },
      eventTrigger: "onPull",
    });
    return () =>
      unregisterBucket({
        origin,
        radius: [holdRadius, holdRadius + 50],
        callback: (paint) => {
          addPaint(paint);
        },
        eventTrigger: "onPull",
      });
  }, []);
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: touching ? eLayers.dropScreen + 10 : eLayers.chipHand + 10,
      }}
    >
      <ChipFan
        groupLayer={eLayers.chipHand}
        paintsA={userPallete.current}
        size={[180, 100]}
        radius={touching ? holdRadius : radius}
        direction={1}
        origin={origin}
        rotationR={rotationR}
        arcLength={arcLength}
        firstIndex={0}
        fGetChipModifier={(chip) => {
          return {
            ...chip,
            zIndex:
              eLayers.chipHand +
              (1 - Math.abs(selectVerse.asState() - chip.chipID[1])) *
                userPallete.current.length,
            simultaneousHandlers: pan,
            radialOffset:
              chip.radialOffset +
              (Math.abs(selectVerse.asState() - chip.chipID[1]) < 0.1 ? 20 : 0),
          };
        }}
      />
      <View
        style={{
          zIndex: touching ? eLayers.dropScreen + 10 : eLayers.chipHand + 10,
        }}
      >
        <GestureDetector gesture={pan}>
          <View
            style={{
              position: "absolute",
              left: origin[0] - holdRadius,
              top: origin[1] - holdRadius,
              width: holdRadius * 2,
              height: holdRadius * 2,
              zIndex: touching ? eLayers.dropScreen + 10 : eLayers.chipHand,
            }}
          />
        </GestureDetector>
      </View>
    </View>
  );
};
