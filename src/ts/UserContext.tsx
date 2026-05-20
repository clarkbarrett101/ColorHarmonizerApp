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
import { tPaint } from "./CLAcolor";
import { tVerse, useVerse } from "./Verse";
import { tChipStatus } from "./PaintChip";
import { tActor, tAttributeModifier } from "./Actor";
const clarColorsList: tPaint[] = require("./clarColors.json");

export const eLayers = {
  superMax: 2000,
  grabbedChip: 1000,
  buckets: 800,
  chipHand: 600,
  dropScreen: 400,
  chipFan: 200,
  panManager: 150,
  colorMixer: 100,
  background: 10,
};

export type tUserContext = {
  userPallete: tPaint[];
  addPaint: (paint: tPaint, index?: number) => void;
  removePaint: (paint: tPaint) => void;
  holdChip: (chipID?: number, status?: tChipStatus) => void;
  vPanX: tVerse<number>;
  vPanY: tVerse<number>;
  vVelocityX: tVerse<number>;
  vHeldChipID: tVerse<number | null>;
  heldChipPaint: tPaint | null;
  setHeldChipPaint?: (paint: tPaint | null) => void;
  registerChipActor?: (chipID: number, entry: tActor) => void;
  unregisterChipActor?: (chipID: number) => void;
  allChipActors?: Record<number, tActor>;
  registerModifier?: (attributeModifier: tAttributeModifier) => number;
  unregisterModifier?: (id: number) => void;
};

export const Context = createContext<tUserContext>({
  userPallete: [],
  addPaint: (paint: tPaint, index?: number) => {},
  removePaint: (paint: tPaint) => {},
  holdChip: (chipID?: number, status?: tChipStatus) => {},
  vPanX: null,
  vPanY: null,
  vVelocityX: null,
  vHeldChipID: null,
  heldChipPaint: null,
});
export const useUserContext = () => useContext(Context);

export default function UserContext({ children }: { children: ReactNode }) {
  const allModifiers = useRef<Record<number, tAttributeModifier>>({}).current;
  const allChipActors = useRef<Record<number, tActor>>({}).current;
  const registerModifier = useCallback(
    (attributeModifier: tAttributeModifier) => {
      const id = Object.keys(allModifiers).length + 1;
      allModifiers[id] = attributeModifier;
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
  const registerChipActor = useCallback((chipID: number, entry: tActor) => {
    allChipActors[chipID] = entry;

    for (let key in allModifiers) {
      const entry = allModifiers[key];

      allChipActors[chipID].addModifier(entry);
    }
  }, []);
  const unregisterChipActor = useCallback((chipID: number) => {
    delete allChipActors[chipID];
  }, []);
  function randomIndexes(count: number, max: number) {
    const indexes = new Set<number>();
    while (indexes.size < count) {
      indexes.add(Math.floor(Math.random() * max));
    }
    return Array.from(indexes);
  }
  const [userPallete, setUserPallete] = useState<tPaint[]>(() => {
    const indexes = randomIndexes(5, clarColorsList.length);
    return indexes.map((i) => clarColorsList[i]);
  });
  const addPaint = useCallback((paint: tPaint, index?: number) => {
    setUserPallete((prev) => {
      if (index !== undefined) {
        const newPallete = [...prev];
        newPallete.splice(index, 0, paint);
        return newPallete;
      }
      return [...prev, paint];
    });
  }, []);
  const removePaint = useCallback((paint: tPaint) => {
    setUserPallete((prev) => prev.filter((p) => p !== paint));
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

  useEffect(() => {
    console.log("Held Chip ID:", _vHeldChipID.state);
  }, [_vHeldChipID.state]);

  const contextValue = useMemo(
    () => ({
      userPallete,
      addPaint,
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
      removePaint,
    }),
    [userPallete, heldChipPaint],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
