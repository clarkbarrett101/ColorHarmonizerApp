import { View } from "react-native";
import React, { use, useEffect } from "react";
import { RadialContext } from "./RadialContext";
import { RadialGraphic } from "./RadialGraphic";
import { fMakePetalPath, tRadialObject, tSectorGroup } from "./sectorTypes";
import Svg, { Path, Text } from "react-native-svg";
import { ePanEvent, usePanManager } from "./PanManager";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Sector } from "./Sector";
import { eLayers } from "./UserContext";

export type tSectorButton = tRadialObject & {
  label: string;
  onPress: () => void;
  fill?: string;
};

export function SectorButton({
  label,
  onPress,
  origin,
  rotationR,
  radii,
  fill = "rgba(255,0,0,0.5)",
}: tSectorButton) {
  const vPanState = useSharedValue<ePanEvent>("leave");
  useAnimatedReaction(
    () => {
      return vPanState.value;
    },
    (panState) => {
      if (panState === "tap" || panState === "enter") {
        scheduleOnRN(onPress);
        vPanState.value = "leave";
      }
    },
    [onPress],
  );
  const sectorPath = fMakePetalPath([0, radii[1] / 6], 3 / 7, radii[1]);
  const { registerHitBox, unregisterHitBox } = usePanManager();
  useEffect(() => {
    registerHitBox({
      id: "" + 20,
      shape: "capsule",
      origin: origin,
      rotationR: rotationR,
      radii: [radii[0], radii[1] / 2],
      vPanState,
      arcLength: 3 / 7,
    });
    return () => unregisterHitBox("" + 20);
  }, []);
  return (
    <View
      onResponderGrant={onPress}
      style={{
        position: "absolute",
        left: origin[0] - radii[1] / 2,
        top: origin[1] - radii[1] / 2,
        width: radii[1],
        height: radii[1],
        transform: [{ rotate: rotationR + "rad" }],
        shadowColor: "black",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        zIndex: eLayers.chipHand,
      }}
    >
      <Svg
        style={{
          position: "absolute",
        }}
        viewBox={`-${radii[1] / 4} -${radii[1] / 4} ${radii[1] / 2} ${radii[1] / 2}`}
        width={radii[1]}
        height={radii[1]}
      >
        <Path d={sectorPath} fill={fill} />
        <Text
          fill="black"
          fontSize={(radii[1] / label.length) * 0.8}
          fontFamily="Outfit"
          textAnchor="middle"
          alignmentBaseline="middle"
          transform={[
            { translateX: radii[1] / 16 },
            {
              rotate: -rotationR + "rad",
            },
          ]}
        >
          {label}
        </Text>
      </Svg>
    </View>
  );
}
