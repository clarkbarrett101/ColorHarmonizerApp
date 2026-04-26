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
  radius = 100,
  rotationR = 6 / 7,
  arcLength = 10 / 7,
  holdRadius = 150,
}: tChipHand) => {
  const groupID = 10;
  const startAngle = rotationR - arcLength / 2;
  const selectVerse = useVerse(-1);
  const { userPallete, vPanX, vPanY, vVelocityX, holdChip } = useUserContext();
  const origin: [number, number] = [30, Dimensions.get("window").height];
  const [touching, setTouching] = React.useState(false);
  const pan = usePanGesture({
    onActivate: (event) => {
      "worklet";
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
        holdChip([groupID, selectVerse.asShared.value]);
        vPanX.value = event.absoluteX;
        vPanY.value = event.absoluteY;
        vVelocityX.value = event.velocityX;
        console.log(vPanX.value, vPanY.value);
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
    onDeactivate: (event) => {
      "worklet";
      console.log("Hand Deactivate");
      holdChip();
      runOnJS(setTouching)(false);
    },
  });

  return (
    <View style={{ position: "absolute", left: 0, top: 0, zIndex: 100 }}>
      <ChipFan
        groupID={groupID}
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
              10 +
              (1 - Math.abs(selectVerse.asState() - chip.chipID[1])) *
                userPallete.current.length,
            simultaneousHandlers: pan,
          };
        }}
      />
      <View style={{ zIndex: 200 }}>
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
    </View>
  );
};
