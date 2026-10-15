import React, { useEffect, useMemo, useRef } from "react";
import { Paths } from "../utils/Paths";
import { eChipSizes, PaintChip } from "../Chips/PaintChip";
import { tPaint } from "../utils/CLAcolor";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { useVerse } from "../utils/Verse";
import { useUserContext } from "../Contexts/UserContext";
import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { PetalBox, PetalBoxSimple } from "../Buttons/PetalBox";
import { Path, G, Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { TextCircle } from "../Buttons/CurvedText";
import Button from "../Buttons/Button";
import { cDimH } from "../utils/ScreenDimensions";
export type tReplacementMeter = {
  origin: [number, number];
  activePaint: tPaint;
  inverted: boolean;
  toggleThreshold: () => void;
  setThreshold: (value: number) => void;
  layer: number;
};
export function ReplacementMeter({
  origin,
  activePaint,
  layer,
  inverted,
  toggleThreshold,
  setThreshold,
}: tReplacementMeter) {
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const { vAccentL } = useUserContext();
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
  const color = useMemo(
    () => (vAccentL.state > 0.5 ? `black` : `white`),
    [vAccentL.state],
  );

  return (
    <>
      <PetalBoxSimple
        origin={[origin[0] + eChipSizes.default[0] * 0.5 + 20, origin[1]]}
        rotationR={11 / 7}
        layer={layer - 10}
        size={[eChipSizes.default[1] * 0.8, eChipSizes.default[1] * 0.8]}
        viewBox={[75, 75]}
        vOpacity={vOpacityM}
      >
        <G transform={[{ translateX: 0 }]}>
          <Defs>
            <RadialGradient
              id="grad"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="white" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="white" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="0%" cy="0%" r="50%" fill="url(#grad)" />
          <Path
            transform={[{ scale: 0.6 }, { translateY: 10 }]}
            d={Paths.replaceMore}
            fill={"black"}
          />
          <TextCircle
            topText={"More"}
            radii={[20, 25]}
            topTextProps={{
              fontSize: 17,
              color: "black",
            }}
          />
        </G>
      </PetalBoxSimple>
      <PetalBoxSimple
        origin={[origin[0] - eChipSizes.default[0] * 0.5 - 20, origin[1]]}
        rotationR={33 / 7}
        layer={layer - 10}
        size={[eChipSizes.default[1] * 0.8, eChipSizes.default[1] * 0.8]}
        viewBox={[75, 75]}
        vOpacity={vOpacityL}
      >
        <G transform={[{ translateX: 0 }]}>
          <Defs>
            <RadialGradient
              id="grad"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="white" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="white" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="0%" cy="0%" r="50%" fill="url(#grad)" />
          <Path
            transform={[{ scale: 0.65 }, { translateY: 5 }]}
            d={Paths.replaceLess}
            fill={"black"}
          />
          <TextCircle
            topText={"Less"}
            radii={[20, 20]}
            topTextProps={{
              fontSize: 16,
              color: "black",
            }}
          />
        </G>
      </PetalBoxSimple>
      <PaintChip
        paintA={activePaint}
        size={"default"}
        origin={origin}
        chipID={[layer, 0]}
      />
      <Button
        path={Paths.noPaint}
        origin={[
          origin[0],
          origin[1] + eChipSizes.default[1] * 0.5 + cDimH(0.025),
        ]}
        inverted={!inverted}
        invertColor={"rgba(255, 255, 255, .25)"}
        size={cDimH(0.05)}
        onPress={() => {
          toggleThreshold();
        }}
      />
    </>
  );
}
