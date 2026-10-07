import {
  Canvas,
  Path,
  RoundedRect,
  Shadow,
  Text,
  Transforms3d,
  useFont,
} from "@shopify/react-native-skia";
import { createContext, useContext } from "react";
import { usePanManager } from "./PanManager";
import Animated, {
  DerivedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  Easing,
  interpolateColor,
  useAnimatedStyle,
} from "react-native-reanimated";
import { SharedValue } from "react-native-reanimated";
import { eLayers } from "./UserContext";
import { cDimW, cDimH } from "../utils/ScreenDimensions";
import { useVerse } from "../utils/Verse";
import { useChipContext } from "../Chips/ChipContext";
import Paths from "../utils/Paths";

export type tDemoStep = {
  touching: 0 | 1 | -1;
  toPos: [number, number];
  duration: number;
  callback?: () => void;
};
export type tDemo = {
  fPlaySequence: (steps: tDemoStep[]) => void;
};
const context = createContext<tDemo | null>(null);
export const useDemo = () => useContext(context);

export function DemoContext({ children }: { children: React.ReactNode }) {
  const circleCount = 5;
  const radius = cDimW() / 20;
  const { panUpdate, releaseZone } = usePanManager();
  const { vPanX, vPanY, vVelocityX, holdChip } = useChipContext();
  const vActive = useVerse(0);
  const vTimer: SharedValue<number> = useSharedValue(0);
  const vTouch: SharedValue<(0 | 1 | -1)[]> = useSharedValue([1]);
  const dTouching: DerivedValue<number> = useDerivedValue(() => {
    return vTouch.value[Math.floor(vTimer.value)];
  });
  const vTouchBuffer: SharedValue<number> = useSharedValue(0);
  const vDuration: SharedValue<number> = useSharedValue(0);
  const vPositions: SharedValue<[number, number][]> = useSharedValue([
    [cDimW() / 2 + 100, cDimH() / 2],
  ]);
  function fCancelAnimation() {
    "worklet";

    vTouchBuffer.value = -1;
    vActive.shared.value = 0;
    vTimer.value = 0;
    vTouch.value = [-1];
    vPositions.value = [[0, 0]];
    holdChip();
  }
  function fPlaySequence(steps: tDemoStep[]) {
    vActive.dispatch(1);
    vPositions.value = [
      [cDimW() / 2, cDimH() / 2],
      ...steps.map((step) => step.toPos),
    ];
    vTouch.value = steps.map((step) => step.touching);
    vTouchBuffer.value = 0;
    vTimer.value = 0;
    vTimer.value = withSequence(
      ...steps.map((step, index) =>
        withTiming(
          index + 1,
          { duration: step.duration, easing: Easing.inOut(Easing.cubic) },
          () => {
            console.log(step);
            step.callback?.();
          },
        ),
      ),
    );
    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);
    vActive.dispatch(0.1);
    vActive.shared.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(
        totalDuration - 600,
        withTiming(0, { duration: 300 }, () => {
          fCancelAnimation();
          vActive.dispatch(0);
        }),
      ),
    );
    vDuration.value = 1;
    vDuration.value = withTiming(0, { duration: totalDuration });
  }

  function fLerp(start: number, end: number, t: number) {
    "worklet";
    return start + (end - start) * t;
  }
  function fLerpArray(
    start: [number, number],
    end: [number, number],
    t: number,
  ): [number, number] {
    "worklet";
    return [fLerp(start[0], end[0], t), fLerp(start[1], end[1], t)];
  }

  function fTransform(index: number): [number, number] {
    "worklet";
    const step = Math.ceil(vTimer.value);
    const start = vPositions.value[step - 1];
    if (!start) {
      return [-100, 0];
    }
    const end = vPositions.value[step] || start;
    const t = vTimer.value - (step - 1);
    return fLerpArray(start, end, Math.min(t ** (1 + index / circleCount), 1));
  }

  const dTransform0: DerivedValue<Transforms3d> = useDerivedValue(() => {
    const v = vTimer.value;
    const pos = fTransform(0);
    return [
      { translateX: pos[0] },
      { translateY: pos[1] },
      { scale: fLerp(1, 0.5, vTouchBuffer.value) },
    ];
  });
  const vTransform1: DerivedValue<Transforms3d> = useDerivedValue(() => {
    const v = vTimer.value;
    const pos = fTransform(1);
    return [
      { translateX: pos[0] },
      { translateY: pos[1] },
      { scale: fLerp(1.2, 0.5, vTouchBuffer.value) },
    ];
  });
  const vTransform2: DerivedValue<Transforms3d> = useDerivedValue(() => {
    const v = vTimer.value;
    const pos = fTransform(2);
    return [
      { translateX: pos[0] },
      { translateY: pos[1] },
      { scale: fLerp(1.4, 0.5, vTouchBuffer.value) },
    ];
  });
  const vTransform3: DerivedValue<Transforms3d> = useDerivedValue(() => {
    const v = vTimer.value;
    const pos = fTransform(3);
    return [
      { translateX: pos[0] },
      { translateY: pos[1] },
      { scale: fLerp(1.6, 0.5, vTouchBuffer.value) },
    ];
  });
  const vTransform4: DerivedValue<Transforms3d> = useDerivedValue(() => {
    const v = vTimer.value;
    const pos = fTransform(4);
    return [
      { translateX: pos[0] },
      { translateY: pos[1] },
      { scale: fLerp(1.8, 0.5, vTouchBuffer.value) },
    ];
  });
  const vTransforms = [
    dTransform0,
    vTransform1,
    vTransform2,
    vTransform3,
    vTransform4,
  ];

  const vColor: DerivedValue<string> = useDerivedValue(() => {
    return interpolateColor(
      vTouchBuffer.value,
      [0, 1],
      ["rgba(0, 0, 0, 0.5)", "white"],
    );
  });
  useAnimatedReaction(
    () => dTransform0.value,
    (timer) => {
      if (vTouchBuffer.value > 0.5) {
        const pos = fTransform(0);
        panUpdate({ absoluteX: pos[0], absoluteY: pos[1] });
        vPanX.shared.value = pos[0];
        vPanY.shared.value = pos[1];
        vVelocityX.shared.value = 100;
      }
    },
  );
  useAnimatedReaction(
    () => dTouching.value,
    (value, previous) => {
      if (previous > 0 && value < 1) {
        releaseZone(value === 0 ? "release" : "leave");
        vTouchBuffer.value = withTiming(0, { duration: 300 });
      } else if (previous <= 0 && value > 0) {
        vTouchBuffer.value = withTiming(1, { duration: 300 });
      }
    },
  );
  const font = useFont(
    require("../../assets/Outfit-VariableFont_wght.ttf"),
    50,
  );
  const smallFont = useFont(
    require("../../assets/Outfit-VariableFont_wght.ttf"),
    30,
  );
  const animatedStyle = useAnimatedStyle(() => {
    return {
      top: 0,
      right: 0,
      width: `${vActive.shared.value * 100}%`,
      height: `${vActive.shared.value * 100}%`,
      position: "absolute",
      zIndex: eLayers.superMax,
    };
  });
  const vFlicker = useDerivedValue(() => {
    return (
      vActive.shared.value *
      ((Math.sin(vDuration.value * Math.PI * 12) + 1.25) / 2)
    );
  });
  return (
    <context.Provider value={{ fPlaySequence }}>
      <Canvas
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          position: "absolute",
          zIndex: eLayers.buckets,
        }}
        pointerEvents="none"
      >
        <RoundedRect
          x={0}
          y={0}
          r={5}
          width={cDimW(1)}
          height={cDimH(1)}
          color="white"
          opacity={vActive.shared}
        >
          <Shadow dx={-20} dy={-20} blur={50} color="black" inner shadowOnly />
        </RoundedRect>
        <RoundedRect
          x={0}
          y={0}
          r={5}
          width={cDimW(1)}
          height={cDimH(1)}
          color="white"
          opacity={vActive.shared}
        >
          <Shadow dx={20} dy={20} blur={50} color="black" inner shadowOnly />
        </RoundedRect>
        {Array.from({ length: circleCount }).map((_, index) => (
          <Path
            transform={vTransforms[index]}
            key={index}
            path={`M-${radius} 0A1 1 0 00${radius} 0 1 1 0 00-${radius} 0`}
            strokeWidth={circleCount - index}
            style="stroke"
            color={vColor}
            opacity={(1 - index / circleCount) ** 2 * vActive.shared.value}
          />
        ))}
        <Path
          transform={vTransforms[0]}
          key={circleCount}
          path={Paths.tap}
          strokeWidth={0}
          style="stroke"
          color={vColor}
          opacity={vActive.shared.value * 0.9}
        />
        <Text
          x={cDimW(0.1)}
          y={cDimH(0.9)}
          color={"white"}
          font={font}
          text={"Demonstration"}
          opacity={vFlicker}
        />
        <Text
          x={cDimW(0.6)}
          y={cDimH(0.8)}
          color={"white"}
          font={smallFont}
          text={"Tap to skip"}
          opacity={vActive.shared}
        />
      </Canvas>
      <Animated.View style={animatedStyle} onTouchStart={fCancelAnimation} />
      {children}
    </context.Provider>
  );
}
