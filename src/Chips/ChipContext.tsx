import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { tPaint } from "../utils/CLAcolor";
import { tVerse, useVerse } from "../utils/Verse";
import { tChipStatus } from "../Chips/PaintChip";
import { tActor, tAttributeModifier } from "../utils/Actor";
import {
  SharedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export type tChipContext = {
  holdChip: (chipID?: number, status?: tChipStatus) => void;
  vPanX: tVerse<number>;
  vPanY: tVerse<number>;
  vVelocityX: tVerse<number>;
  vHeldChipID: tVerse<number | null>;
  vHeldChipPaint: tVerse<tPaint | null>;
  registerChipActor?: (
    chipID: number,
    entry: tActor,
    paints: [tPaint, tPaint?],
  ) => void;
  unregisterChipActor?: (chipID: number) => void;
  allChipActors?: Record<number, tActor>;
  registerModifier?: (attributeModifier: tAttributeModifier) => number;
  unregisterModifier?: (id: number) => void;
  vSwayTimer?: SharedValue<number>;
};

export const Context = createContext<tChipContext>({
  holdChip: () => {},
  vPanX: null,
  vPanY: null,
  vVelocityX: null,
  vHeldChipID: null,
  vHeldChipPaint: null,
  registerChipActor: () => {},
  unregisterChipActor: () => {},
  allChipActors: {},
  registerModifier: () => 0,
  unregisterModifier: () => {},
  vSwayTimer: null,
});
export const useChipContext = () => useContext(Context);

export default function UserContext({ children }: { children: ReactNode }) {
  const allModifiers = useRef<Record<number, tAttributeModifier>>({}).current;
  const allChipActors = useRef<Record<number, tActor>>({}).current;
  const registerModifier = useCallback(
    (attributeModifier: tAttributeModifier) => {
      const id = attributeModifier.modID;
      if (allModifiers[id]) {
        console.warn(`Modifier with ID ${id} already exists. Overwriting.`);
        return id;
      }
      allModifiers[id] = attributeModifier;
      console.log("Registering modifier", Object.keys(allModifiers).length);
      for (let chipID in allChipActors) {
        allChipActors[chipID].addModifier(attributeModifier);
      }
      return id;
    },
    [],
  );
  const unregisterModifier = useCallback((id: number) => {
    delete allModifiers[id];
    for (let chipID in allChipActors) {
      allChipActors[chipID].removeModifier(id);
    }
    console.log("Unregistering modifier", Object.keys(allModifiers));
  }, []);

  const registerChipActor = useCallback(
    (chipID: number, entry: tActor, paints: [tPaint, tPaint?]) => {
      console.log("Registering chip actor", Object.keys(allChipActors));
      allChipActors[chipID] = entry;
      for (let key in allModifiers) {
        const entry = allModifiers[key];
        allChipActors[chipID].addModifier(entry);
      }
    },
    [],
  );
  const unregisterChipActor = useCallback((chipID: number) => {
    delete allChipActors[chipID];
    console.log("Unregistering chip actor", Object.keys(allChipActors).length);
  }, []);

  const vPanX = useVerse(0);
  const vPanY = useVerse(0);
  const vVelocityX = useVerse(0);
  const vHeldChipID = useVerse<number | null>(null);
  //const vPanX = useRef(_vPanX).current;
  //const vPanY = useRef(_vPanY).current;
  //const vVelocityX = useRef(_vVelocityX).current;
  //const vHeldChipID = useRef(_vHeldChipID).current;
  const vHeldChipPaint = useVerse<tPaint | null>(null);
  const vSwayTimer = useSharedValue(0);
  useEffect(() => {
    vSwayTimer.value = 0;
    vSwayTimer.value = withRepeat(withTiming(1, { duration: 10000 }), -1, true);
  }, []);

  const holdChip = useCallback((chipID?: number) => {
    "worklet";
    if (!chipID) {
      vHeldChipID.dispatch(null);
      return;
    }
    if (vHeldChipID.shared.value !== chipID) {
      console.log(`Holding chip with ID ${chipID}`);
      vHeldChipID.dispatch(chipID);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      vPanX,
      vPanY,
      vVelocityX,
      vHeldChipID,
      holdChip,
      vHeldChipPaint,
      registerChipActor,
      unregisterChipActor,
      allChipActors,
      registerModifier,
      unregisterModifier,
      vSwayTimer,
    }),
    [vHeldChipPaint.state],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
