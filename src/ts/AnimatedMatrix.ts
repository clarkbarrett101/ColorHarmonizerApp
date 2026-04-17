import {useMemo} from "react";
import {
    DerivedValue,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

type tMatrix ={
  vT?: { x: number; y: number };
  vR?: number;   
  vS?: {x: number; y: number} ;
};

export type AnimatedMatrix = {
  vT: SharedValue<{ x: number; y: number }>;
  vR: SharedValue<number>;
  vS: SharedValue<{x: number; y: number} >;
    wT: (xy: {x: number, y: number}) => void;
    wR: (r: number) => void;
    wS: (s: {x: number, y: number}) => void;
    wMatrix: (matrix: tMatrix) => void;
    wOrbit: (params: {center: {x: number, y: number}, radius: number, startAngle: number, endAngle: number}) => void;
  style: DerivedValue< number[]> ;
  
};

export function useAnimatedMatrix(init?: tMatrix): AnimatedMatrix {
  const vT = useSharedValue(init?.vT ?? { x: 0, y: 0 });
  const vR = useSharedValue(init?.vR ?? 0);
  const vS = useSharedValue(init?.vS ?? { x: 1, y: 1 });
  const vPivot = useSharedValue({ x: 0, y: 0 });
  function wT({x, y}: {x: number, y: number}) {
    'worklet';
    vPivot.value = { x:0, y:0 };
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
    function wMatrix({vT: t, vR: r, vS: s}: {vT?: { x: number; y: number }; vR?: number; vS?: {x: number, y: number}}) {
        'worklet';
        if (t) vT.value = withSpring(t, { mass: 0.5 });
        if (r !== undefined) vR.value = withSpring(r, { mass: 0.5 });
        if (s !== undefined) vS.value = withSpring(s, { mass: 0.5 });
    }
    function wOrbit({center, radius, startAngle, endAngle}: {center: {x: number, y: number}, radius: number, startAngle: number, endAngle: number}) {
        'worklet';
        vPivot.value = {x:radius, y:radius};
        vR.value = startAngle;
        vT.value = center;
        vR.value = withTiming(endAngle, { duration: 1000 }, () => {
          vT.value = {x: center.x + radius * Math.cos(endAngle)*vS.value.x, y: center.y + radius * Math.sin(endAngle)*vS.value.y};
          vPivot.value = {x: 0, y: 0};
        });
    
    };
  const style = useDerivedValue(() => {
    const cosR = Math.cos(vR.value);
    const sinR = Math.sin(vR.value);
   const tx = vT.value.x + vPivot.value.x  * cosR;
   const ty = vT.value.y + vPivot.value.x  * sinR;
    return  [vS.value.x * cosR, vS.value.y * sinR, 0,-vS.value.x * sinR, vS.value.y * cosR, 0,
        tx, ty, 1,
      ]

  }, [vT, vR, vS]);
  return useMemo(
    () => ({vT, vR, vS, wT, wR, wS, wMatrix, wOrbit, style}),
    [vT, vR, vS, wT, wR, wS, wMatrix, wOrbit, style],
  );
}