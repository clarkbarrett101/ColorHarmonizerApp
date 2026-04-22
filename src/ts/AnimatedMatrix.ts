import {useMemo} from "react";
import {
    DerivedValue,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

export type tMatrix ={
  vT?: { x: number; y: number };
  vR?: number;   
  vS?: {x: number; y: number} ;
  vRadialOffset?: number;
  duration?: number;
  mass?: number;
};

export type AnimatedMatrix = {
  vT: SharedValue<{ x: number; y: number }>;
  vR: SharedValue<number>;
  vS: SharedValue<{x: number; y: number} >;
  vRadialOffset: SharedValue<number>;
    wT: (xy: {x: number, y: number}) => void;
    wR: (r: number) => void;
    wS: (s: {x: number, y: number}) => void;
    wRadialOffset: (ro: number) => void;
    wMatrixSpring: (matrix: tMatrix, wCallback?: () => void) => void;
    wMatrixInstant: (matrix: tMatrix) => void;
    wGetPosition: () => {x: number, y: number};
  style: DerivedValue< number[]> ;
  
};

export function useAnimatedMatrix(init?: tMatrix): AnimatedMatrix {
  const vT = useSharedValue(init?.vT ?? { x: 0, y: 0 });
  const vR = useSharedValue(init?.vR ?? 0);
  const vS = useSharedValue(init?.vS ?? { x: 1, y: 1 });
  const vRadialOffset = useSharedValue(init?.vRadialOffset ?? 0);
  function wT({x, y}: {x: number, y: number}) {
    'worklet';
    vRadialOffset.value = 0;
    vT.value = withSpring({ x, y }, { mass: 0.5 });
  }
  function wR(r: number = 0) {
    'worklet';
    vR.value = withSpring(r, { mass: 0.5 });
  }
    function wS(s: {x: number, y: number} = {x: 1, y: 1}) {
        'worklet';
        vS.value = withSpring(s, { mass: 0.5 });
    };
    function wRadialOffset(ro: number = 0) {
        'worklet';
        vRadialOffset.value = withSpring(ro, { mass: 0.5 });
    }
    function wMatrixSpring({vT: t, vR: r, vS: s, vRadialOffset: p, duration: d, mass: m}: Partial<tMatrix>, wCallback) {
        'worklet';
        let called = false;
        const onComplete = () => {
            if (called) return;
            called = true;
            if (wCallback) wCallback();
        }
        if (t) vT.value = withSpring(t, { mass: m ?? 0.5,duration: d }, onComplete);
        if (r !== undefined) vR.value = withSpring(r, { mass: m ?? 0.5, duration: d }, onComplete);
        if (s !== undefined) vS.value = withSpring(s, { mass: m ?? 0.5, duration: d }, onComplete);
        if (p !== undefined) vRadialOffset.value = p;
    }
    function wMatrixInstant({vT: t, vR: r, vS: s, vRadialOffset: p}:Partial<tMatrix>) {
        'worklet';
        if (t) vT.value = t;
        if (r !== undefined) vR.value = r;
        if (s !== undefined) vS.value = s;
        if (p !== undefined) vRadialOffset.value = p;
    }
    function wGetPosition() {
        'worklet';
            const cosR = Math.cos(vR.value);
    const sinR = Math.sin(vR.value);
   const tx = vT.value.x + vRadialOffset.value * cosR;
   const ty = vT.value.y + vRadialOffset.value * sinR;
    return {x: tx, y: ty};
    }
        
  const style = useDerivedValue(() => {
    const cosR = Math.cos(vR.value);
    const sinR = Math.sin(vR.value);
   const tx = vT.value.x + vRadialOffset.value * cosR;
   const ty = vT.value.y + vRadialOffset.value * sinR;
    return  [vS.value.x * cosR, vS.value.y * sinR, 0,-vS.value.x * sinR, vS.value.y * cosR, 0,
        tx, ty, 1,
      ]

  }, [vT, vR, vS, vRadialOffset]);
  return useMemo(
    () => ({vT, vR, vS, vRadialOffset, wT, wR, wS, wRadialOffset, wMatrixSpring, wMatrixInstant, wGetPosition, style}),
    [vT, vR, vS, vRadialOffset, wT, wR, wS, wRadialOffset, wMatrixSpring, wMatrixInstant, wGetPosition, style],
  );
}
