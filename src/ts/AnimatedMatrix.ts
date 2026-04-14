import {useMemo} from "react";
import {
    DerivedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

type tMatrix ={
  vT?: { x: number; y: number };
  vR?: number;   
  vS?: number;
};

export type AnimatedMatrix = {
  vT: SharedValue<{ x: number; y: number }>;
  vR: SharedValue<number>;
  vS: SharedValue<number>;
    wT: (xy: {x: number, y: number}) => void;
    wR: (r: number) => void;
    wS: (s: number) => void;
    wMatrix: (matrix: tMatrix) => void;
  style: DerivedValue< number[]> ;
  
};

export function useAnimatedMatrix(init?: tMatrix): AnimatedMatrix {
  const vT = useSharedValue(init?.vT ?? { x: 0, y: 0 });
  const vR = useSharedValue(init?.vR ?? 0);
  const vS = useSharedValue(init?.vS ?? 1);

  function wT({x, y}: {x: number, y: number}) {
    'worklet';
    vT.value = withSpring({ x, y }, { mass: 0.5 });
  }
  function wR(r: number = 0) {
    'worklet';
    vR.value = withSpring(r, { mass: 0.5 });
  }
    function wS(s: number = 1) {
        'worklet';
        vS.value = withSpring(s, { mass: 0.5 });
    };
    function wMatrix({vT: t, vR: r, vS: s}: {vT?: { x: number; y: number }; vR?: number; vS?: number}) {
        'worklet';
        if (t) vT.value = withSpring(t, { mass: 0.5 });
        if (r !== undefined) vR.value = withSpring(r);
        if (s !== undefined) vS.value = withSpring(s);
    }
  const style = useDerivedValue(() => {
    return  [vS.value * Math.cos(vR.value), vS.value * Math.sin(vR.value), 0,-vS.value * Math.sin(vR.value), vS.value * Math.cos(vR.value), 0,
        vT.value.x, vT.value.y, 1,
      ]
    
  }, [vT, vR, vS]);
  return useMemo(
    () => ({vT, vR, vS, wT, wR, wS, wMatrix, style}),
    [vT, vR, vS, wT, wR, wS, wMatrix, style],
  );
}