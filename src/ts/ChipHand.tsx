import { View, Dimensions } from "react-native";
import React, { use, useEffect, useRef, useState } from "react";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { ChipFan } from "./ChipStack";
import { eLayers, useUserContext } from "./UserContext";
import { runOnJS, scheduleOnRN } from "react-native-worklets";
import { useVerse } from "./Verse";
import { translate } from "@shopify/react-native-skia";
import { eChipSizes } from "./PaintChip";

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
    registerBucket,
    unregisterBucket,
    holdChip,
    heldChipDispatch,
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
        (Math.round(((startAngle - angle) / arcLength) * userPallete.length) -
          0.5) /
        userPallete.length;
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
        holdChip([eLayers.chipHand, selectVerse.asShared.value], "pushed");

        vPanX.asShared.value = event.absoluteX;
        vPanY.asShared.value = event.absoluteY;
        vVelocityX.asShared.value = event.velocityX;
      } else {
        holdChip();
        const index =
          (Math.round(((startAngle - angle) / arcLength) * userPallete.length) -
            0.5) /
          userPallete.length;
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
      origin: [origin[0] + radius, origin[1] - radius],
      radius: [holdRadius, holdRadius + 100],
      callback: (paint) => {
        addPaint(paint);
      },
      statusTrigger: "pulled",
      id: `hand-bucket`,
    });
    return () => unregisterBucket(`hand-bucket`);
  }, []);
  return (
    <>
      <ChipFan
        groupLayer={eLayers.chipHand}
        paintsA={userPallete}
        size={"default"}
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
              (1 - Math.abs(selectVerse.asState - chip.chipID[1])) *
                userPallete.length,
            radialOffset:
              chip.radialOffset +
              (Math.abs(selectVerse.asState - chip.chipID[1]) < 0.1 ? 20 : 0),
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
              borderWidth: 10,
              borderColor: "rgba(255,255,255,1)",
              borderRadius: holdRadius,
            }}
          />
        </GestureDetector>
      </View>
    </>
  );
};
