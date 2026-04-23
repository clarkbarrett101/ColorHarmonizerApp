import { translate } from "@shopify/react-native-skia";
import { useMemo } from "react";
import {
  DerivedValue,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

export type tMatrix = {
  vT?: { x: number; y: number };
  vR?: number;
  vS?: { x: number; y: number };
  vRadialOffset?: number;
  vTilt?: number;
  duration?: number;
  mass?: number;
};

export type AnimatedMatrix = {
  vT: SharedValue<{ x: number; y: number }>;
  vR: SharedValue<number>;
  vS: SharedValue<{ x: number; y: number }>;
  vRadialOffset: SharedValue<number>;
  vTilt: SharedValue<number>;
  wMatrixSpring: (matrix: tMatrix, wCallback?: () => void) => void;
  wMatrixInstant: (matrix: tMatrix) => void;
  dPosition: DerivedValue<{ x: number; y: number }>;
  dTransform: DerivedValue<{ transform: any[] }>;
};

export function useAnimatedMatrix(init?: tMatrix): AnimatedMatrix {
  const vT = useSharedValue(init?.vT ?? { x: 0, y: 0 });
  const vR = useSharedValue(init?.vR ?? 0);
  const vS = useSharedValue(init?.vS ?? { x: 1, y: 1 });
  const vRadialOffset = useSharedValue(init?.vRadialOffset ?? 0);
  const vTilt = useSharedValue(0);
  function wMatrixSpring(
    {
      vT: t,
      vR: r,
      vS: s,
      vRadialOffset: p,
      vTilt: tilt,
      duration: d,
      mass: m,
    }: Partial<tMatrix>,
    wCallback?: () => void,
  ) {
    "worklet";
    let called = false;
    const onComplete = () => {
      if (called) return;
      called = true;
      if (wCallback) wCallback();
    };
    if (t && (t.x !== vT.value.x || t.y !== vT.value.y))
      vT.value = withSpring(t, { mass: m ?? 0.5, duration: d }, onComplete);
    if (r && r !== vR.value)
      vR.value = withSpring(r, { mass: m ?? 0.5, duration: d }, onComplete);
    if (s && (s.x !== vS.value.x || s.y !== vS.value.y))
      vS.value = withSpring(s, { mass: m ?? 0.5, duration: d }, onComplete);
    if (p) vRadialOffset.value = p;
    if (tilt) vTilt.value = tilt;
  }
  function wMatrixInstant({
    vT: t,
    vR: r,
    vS: s,
    vRadialOffset: p,
    vTilt: tilt,
  }: Partial<tMatrix>) {
    "worklet";
    if (t) vT.value = t;
    if (r) vR.value = r;
    if (s) vS.value = s;
    if (p) vRadialOffset.value = p;
    if (tilt) vTilt.value = tilt;
  }
  const dPosition = useDerivedValue(() => {
    const cosR = Math.cos(vR.value);
    const sinR = Math.sin(vR.value);
    const tx = vT.value.x + vRadialOffset.value * cosR;
    const ty = vT.value.y + vRadialOffset.value * sinR;
    return { x: tx, y: ty };
  });
  const dTransform = useDerivedValue(() => {
    return {
      transform: [
        { perspective: 2000 },
        { translateX: vT.value.x + vRadialOffset.value * Math.cos(vR.value) },
        { translateY: vT.value.y + vRadialOffset.value * Math.sin(vR.value) },
        {
          rotateZ: `${vR.value}rad`,
        },
        {
          scaleX: vS.value.x,
        },
        { scaleY: vS.value.y },
        {
          rotateX: `${vTilt.value}rad`,
        },
      ],
    };
  }, [vT, vR, vS, vRadialOffset, vTilt]);
  return useMemo(
    () => ({
      vT,
      vR,
      vS,
      vRadialOffset,
      vTilt,
      wMatrixSpring,
      wMatrixInstant,
      dPosition,
      dTransform,
    }),
    [
      vT,
      vR,
      vS,
      vRadialOffset,
      vTilt,
      wMatrixSpring,
      wMatrixInstant,
      dPosition,
      dTransform,
    ],
  );
}
