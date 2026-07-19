import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { tPaint } from "../utils/CLAcolor";
import { tVerse, useVerse } from "../utils/Verse";
import { tChipStatus } from "../Chips/PaintChip";
import { tActor, tAttributeModifier } from "../utils/Actor";

export type tChipContext = {
  holdChip: (chipID?: number, status?: tChipStatus) => void;
  vPanX: tVerse<number>;
  vPanY: tVerse<number>;
  vVelocityX: tVerse<number>;
  vHeldChipID: tVerse<number | null>;
  heldChipPaint: tPaint | null;
  setHeldChipPaint?: (paint: tPaint | null) => void;
  registerChipActor?: (
    chipID: number,
    entry: tActor,
    paints: [tPaint, tPaint?],
  ) => void;
  unregisterChipActor?: (chipID: number) => void;
  allChipActors?: Record<number, tActor>;
  registerModifier?: (attributeModifier: tAttributeModifier) => number;
  unregisterModifier?: (id: number) => void;
};

export const Context = createContext<tChipContext>({
  holdChip: () => {},
  vPanX: null,
  vPanY: null,
  vVelocityX: null,
  vHeldChipID: null,
  heldChipPaint: null,
  setHeldChipPaint: () => {},
  registerChipActor: () => {},
  unregisterChipActor: () => {},
  allChipActors: {},
  registerModifier: () => 0,
  unregisterModifier: () => {},
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
      console.log("Registering modifier", Object.keys(allModifiers));
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
  }, []);

  const registerChipActor = useCallback(
    (chipID: number, entry: tActor, paints: [tPaint, tPaint?]) => {
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
  }, []);

  const _vPanX = useVerse(0);
  const _vPanY = useVerse(0);
  const _vVelocityX = useVerse(0);
  const _vHeldChipID = useVerse<number | null>(null);
  const vPanX = useRef(_vPanX).current;
  const vPanY = useRef(_vPanY).current;
  const vVelocityX = useRef(_vVelocityX).current;
  const vHeldChipID = useRef(_vHeldChipID).current;
  const [heldChipPaint, setHeldChipPaint] = useState<tPaint | null>(null);

  const holdChip = useCallback((chipID?: number) => {
    "worklet";
    if (!chipID) {
      vHeldChipID.dispatch(null);
      return;
    }
    if (vHeldChipID.shared.value !== chipID) {
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
      heldChipPaint,
      setHeldChipPaint,
      registerChipActor,
      unregisterChipActor,
      allChipActors,
      registerModifier,
      unregisterModifier,
    }),
    [heldChipPaint],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
