import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import {
  ePanEvent,
  tRadialHitBox,
  usePanManager,
} from "../Contexts/PanManager";
import { useEffect } from "react";

export type tPanHitBox = Omit<tRadialHitBox, "vPanState" | "vPanPos"> & {
  fOnUpdate?: (
    vPanState: SharedValue<ePanEvent>,
    vPanPos: SharedValue<{ angle: number; radius: number }>,
  ) => void;
};
export function usePanHitBox(props: tPanHitBox) {
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const vPanState = useSharedValue<ePanEvent>("leave");
  const vPanPos = useSharedValue<{ angle: number; radius: number }>({
    angle: 0,
    radius: 0,
  });
  useEffect(() => {
    registerHitBox({
      ...props,
      vPanState: vPanState,
      vPanPos: vPanPos,
    });
    return () => {
      unregisterHitBox(props.id);
    };
  }, []);
  useAnimatedReaction(
    () => [vPanState.value, vPanPos.value],
    ([state, pos]) => {
      if (props.fOnUpdate) {
        props.fOnUpdate(vPanState, vPanPos);
      }
    },
    [],
  );
  return { vPanState, vPanPos };
}
