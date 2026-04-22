import { View, Text, Dimensions } from "react-native";
import React, { use } from "react";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { ChipFan } from "./ChipStack";
import { useUserContext } from "./UserContext";
import { runOnJS } from "react-native-worklets";
import { useVerse } from "./Verse";

export type tChipHand = {
  radius?: number;
  rotationR?: number;
  arcLength?: number;
  holdRadius?: number;
};

export const ChipHand = ({
  radius = 150,
  rotationR = 6 / 7,
  arcLength = 10 / 7,
  holdRadius = 175,
}: tChipHand) => {
  const groupID = 10;
  const selectVerse = useVerse(-1);
  const { userPallete, vPanX, vPanY, vVelocityX, holdChip } = useUserContext();
  const origin: [number, number] = [30, Dimensions.get("window").height];
  const pan = usePanGesture({
    onActivate: (event) => {
      "worklet";
      const angle = Math.atan2(
        event.absoluteY - origin[1],
        event.absoluteX - origin[0],
      );
      const index = Math.round(
        (0.5 - (angle + rotationR) / arcLength) * userPallete.current.length,
      );
      selectVerse.updateState(index);
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
        holdChip([groupID, selectVerse.asShared.value]);
        vPanX.value = event.absoluteX;
        vPanY.value = event.absoluteY;
        vVelocityX.value = event.velocityX;
      } else {
        holdChip();
        const index = Math.round(
          (0.5 - (angle + rotationR) / arcLength) * userPallete.current.length,
        );
        selectVerse.updateState(index);
      }
    },
    onDeactivate: (event) => {
      "worklet";
      holdChip();
    },
  });

  return (
    <>
      <ChipFan
        groupID={groupID}
        paints={userPallete.current}
        size={[180, 100]}
        radius={radius}
        direction={1}
        origin={origin}
        rotationR={rotationR}
        arcLength={arcLength}
        firstIndex={0}
        fGetChipModifier={(chip) => {
          return {
            ...chip,
            zIndex:
              10 +
              userPallete.current.length -
              Math.abs(selectVerse.asState() - chip.chipID[1]),
          };
        }}
      />
      <View style={{ zIndex: 100 }}>
        <GestureDetector gesture={pan}>
          <View
            style={{
              position: "absolute",
              left: origin[0] - holdRadius,
              top: origin[1] - holdRadius,
              width: holdRadius * 2,
              height: holdRadius * 2,
              borderWidth: 1,
              borderColor: "black",
              borderRadius: holdRadius,
              zIndex: 1000,
              backgroundColor: "rgba(255,255,255,0.5)",
            }}
          />
        </GestureDetector>
      </View>
    </>
  );
};
