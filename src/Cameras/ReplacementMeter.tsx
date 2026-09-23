import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { eChipSizes, PaintChip } from "../Chips/PaintChip";
import { fCLARColorToString, tPaint } from "../utils/CLAcolor";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { useVerse } from "../utils/Verse";
import { Sector } from "../Radials/Sector";
import { useUserContext } from "../Contexts/UserContext";
import { useAnimatedReaction } from "react-native-reanimated";
import { tIVerse } from "../utils/iVerse";
import { PetalButton } from "../Buttons/PetalButton";
import { PetalBox } from "../Buttons/PetalBox";
import { Path, Circle, G } from "react-native-svg";
import { TextCircle } from "../Buttons/CurvedText";
export type tReplacementMeter = {
  origin: [number, number];
  activePaint: tPaint;
  setThreshold: (value: number) => void;
  layer: number;
};
export function ReplacementMeter({
  origin,
  activePaint,
  layer,
  setThreshold,
}: tReplacementMeter) {
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const vPanState = useVerse<ePanEvent>("leave");
  const vPanPos = useVerse<{ angle: number; radius: number }>({
    angle: 0,
    radius: 0,
  });
  const length = 250;
  useEffect(() => {
    registerHitBox({
      id: `ReplacementMeter`,
      origin: [origin[0] - length * 0.4, origin[1]],
      shape: "capsule",
      radii: [eChipSizes.default[1] / 3, length * 0.9],
      vPanState: vPanState.shared,
      vPanPos: vPanPos.shared,
      rotationR: 0,
    });
    return () => {
      unregisterHitBox(`ReplacementMeter`);
    };
  }, []);

  useAnimatedReaction(
    () => vPanState.shared.value,
    (pos) => {
      "worklet";
      if (pos === "enter" || pos === "tap") {
        if (vPanPos.shared.value.radius < length / 2) {
          setThreshold(-0.1);
        } else {
          setThreshold(0.1);
        }
        vPanState.shared.value = "leave";
      }
    },
    [],
  );

  const { vColorModel } = useUserContext();
  return (
    <>
      <PetalBox
        origin={origin}
        radii={[eChipSizes.default[0] / 3, eChipSizes.default[0] / 2 + 45]}
        rotationR={0 / 7}
        layer={layer - 10}
        arcLength={3 / 7}
        opacity={0.75}
      >
        <G transform={[{ translateX: 95 }, { translateY: 0 }]}>
          <Path
            transform={[{ translateX: 0 }, { scale: 0.7 }]}
            d={
              "M-19-32C-22-16-30-12-30-1-30 5-25 9-17 9-17 5-13-5-10-10-13-16-17-21-19-32ZM19-33C17-22 13-17 10-10 13-5 17 5 17 9 25 9 30 5 30-1 30-12 22-16 19-33ZM0-29C-3-20-6-13-9-8-13 0-15 5-15 13-15 23-8 27 0 27 8 27 15 23 15 13 15 5 13 0 9-8 6-14 3-20 0-29ZM-3 4H3V10H9V16H3V22H-3V16H-9V10H-3Z"
            }
            fill={`rgba(0,0,0,.75)`}
          />
          <TextCircle
            topText={"More"}
            radii={[30, eChipSizes.default[0] / 2]}
            topTextProps={{ fontSize: 12 }}
          />
        </G>
      </PetalBox>
      <PetalBox
        origin={origin}
        radii={[eChipSizes.default[0] / 3, eChipSizes.default[0] / 2 + 45]}
        rotationR={22 / 7}
        arcLength={3 / 7}
        layer={layer - 10}
        opacity={0.75}
      >
        <G transform={[{ translateX: 95 }, { scale: -1 }]}>
          <Path
            transform={[{ translateX: 0 }, { scale: 0.7 }]}
            d={
              "M3 10H8V16H-8V10ZM0-28C-3-19-6-13-9-7-13 1-15 6-15 14-15 24-8 28 0 28S15 24 15 14C15 6 13 1 9-7 6-12 3-19 0-28Z"
            }
            fill={`rgba(0,0,0,.75)`}
          />
          <TextCircle
            topText={"Less"}
            radii={[30, eChipSizes.default[0] / 2]}
            topTextProps={{ fontSize: 12 }}
          />
        </G>
      </PetalBox>
      <PaintChip
        paintA={activePaint}
        size={"default"}
        origin={origin}
        chipID={[layer, 0]}
      />
    </>
  );
}
