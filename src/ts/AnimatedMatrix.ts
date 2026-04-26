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
import { tMatrix } from "./Verse";




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
  const vT = useSharedValue(init?.t ?? { x: 0, y: 0 });
  const vR = useSharedValue(init?.r ?? 0);
  const vS = useSharedValue(init?.s ?? { x: 1, y: 1 });
  const vRadialOffset = useSharedValue(init?.offset ?? 0);
  const vTilt = useSharedValue(init?.tilt ?? 0);
  function wMatrixSpring(
    matrix: Partial<tMatrix>,
    wCallback?: () => void,
  ) {
    "worklet";
    let called = false;
    const onComplete = () => {
      if (called) return;
      called = true;
      if (wCallback) wCallback();
    };
    if (matrix.t && (matrix.t.x !== vT.value.x || matrix.t.y !== vT.value.y))
      vT.value = withSpring(matrix.t, { mass: 0.5, duration: 300}, onComplete);
    if (matrix.r && matrix.r !== vR.value)
      vR.value = withSpring(matrix.r, { mass: 0.5, duration: 300}, onComplete);
    if (matrix.s && (matrix.s.x !== vS.value.x || matrix.s.y !== vS.value.y))
      vS.value = withSpring(matrix.s, { mass: 0.5, duration: 300}, onComplete);
    if (matrix.offset) vRadialOffset.value = matrix.offset;
    if (matrix.tilt) vTilt.value = matrix.tilt;
  }
  function wMatrixInstant(
    matrix: Partial<tMatrix>) {
    "worklet";
    if (matrix.t) vT.value = matrix.t;
    if (matrix.r) vR.value = matrix.r;
    if (matrix.s) vS.value = matrix.s;
    if (matrix.offset) vRadialOffset.value = matrix.offset;
    if (matrix.tilt) vTilt.value = matrix.tilt;
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
        { translateX: vT.value.x },
        { translateY: vT.value.y  },
        {
          rotateZ: `${vR.value}rad`,
        },
        {
            translateX: vRadialOffset.value,
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
