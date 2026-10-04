import React, { useEffect } from "react";
import { Paths } from "../utils/Paths";
import { eChipSizes, PaintChip } from "../Chips/PaintChip";
import { tPaint } from "../utils/CLAcolor";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { useVerse } from "../utils/Verse";
import { useUserContext } from "../Contexts/UserContext";
import {
  useAnimatedReaction,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { PetalBox, PetalBoxSimple } from "../Buttons/PetalBox";
import { Path, G } from "react-native-svg";
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
  const vOpacityL = useSharedValue(0.5);
  const vOpacityM = useSharedValue(0.5);
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
          vOpacityL.value = withSequence(withTiming(1), withTiming(0.5));
        } else {
          setThreshold(0.1);
          vOpacityM.value = withSequence(withTiming(1), withTiming(0.5));
        }
        vPanState.shared.value = "leave";
      }
    },
    [],
  );

  return (
    <>
      <PetalBoxSimple
        origin={[origin[0] + eChipSizes.default[0] * 0.5 + 20, origin[1]]}
        rotationR={11 / 7}
        layer={layer - 10}
        size={[75, 75]}
        viewBox={[75, 75]}
        vOpacity={vOpacityM}
      >
        <G transform={[{ translateX: 0 }]}>
          <Path
            transform={[{ scale: 0.6 }, { translateY: 10 }]}
            d={Paths.replaceMore}
            fill={`rgba(0,0,0,.75)`}
          />
          <TextCircle
            topText={"More"}
            radii={[20, 25]}
            topTextProps={{ fontSize: 17 }}
          />
        </G>
      </PetalBoxSimple>
      <PetalBoxSimple
        origin={[origin[0] - eChipSizes.default[0] * 0.5 - 20, origin[1]]}
        rotationR={33 / 7}
        layer={layer - 10}
        size={[75, 75]}
        viewBox={[75, 75]}
        vOpacity={vOpacityL}
      >
        <G transform={[{ translateX: 0 }]}>
          <Path
            transform={[{ scale: 0.65 }, { translateY: 5 }]}
            d={Paths.replaceLess}
            fill={`rgba(0,0,0,.75)`}
          />
          <TextCircle
            topText={"Less"}
            radii={[20, 20]}
            topTextProps={{ fontSize: 16 }}
          />
        </G>
      </PetalBoxSimple>
      <PaintChip
        paintA={activePaint}
        size={"default"}
        origin={origin}
        chipID={[layer, 0]}
      />
    </>
  );
}
