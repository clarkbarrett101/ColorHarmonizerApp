import {
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import { ePanEvent, tRadialHitBox, usePanManager } from "./PanManager";
import { useEffect } from "react";

export type tPanSetup = {
  onPanEvent?: (
    event: ePanEvent,
    vPanPos: SharedValue<{ angle: number; radius: number }>,
    vPanState: SharedValue<ePanEvent>,
  ) => void;
  onPanPos?: (
    pos: { angle: number; radius: number },
    vPanPos: SharedValue<{ angle: number; radius: number }>,
    vPanState: SharedValue<ePanEvent>,
  ) => void;
  hitbox: tRadialHitBox;
};
export type tPanEffect = {
  vPanPos: SharedValue<{ angle: number; radius: number }>;
  vPanState: SharedValue<ePanEvent>;
};

function usePanEffect({ onPanEvent, onPanPos, hitbox }: tPanSetup) {
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const vPanState = useSharedValue<ePanEvent>("leave");
  useEffect(() => {
    registerHitBox({ ...hitbox, vPanPos, vPanState });
    return () => {
      unregisterHitBox(hitbox.id);
    };
  }, []);
  useAnimatedReaction(
    () => vPanState.value,
    (state) => {
      if (onPanEvent) onPanEvent(state, vPanPos, vPanState);
    },
  );
  useAnimatedReaction(
    () => vPanPos.value,
    (pos) => {
      if (onPanPos) onPanPos(pos, vPanPos, vPanState);
    },
  );
  return { vPanPos, vPanState };
}
