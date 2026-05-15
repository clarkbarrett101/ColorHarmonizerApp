import React, {
  createContext,
  Dispatch,
  ReactNode,
  RefObject,
  use,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { fRandomPaints, tPaint } from "./CLAcolor";
import {
  DerivedValue,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import { tVerse, useVerse } from "./Verse";
import { eChipMap, tChipStatus } from "./PaintChip";
import { tActor, tAttributeModifier } from "./Actor";
const clarColorsList: tPaint[] = require("./clarColors.json");

export const eLayers = {
  superMax: 2000,
  grabbedChip: 1000,
  buckets: 800,
  chipHand: 600,
  dropScreen: 400,
  chipFan: 200,
  colorMixer: 0,
};

type modEntry = {
  id: number;
  modifier: tAttributeModifier;
};

export type tUserContext = {
  userPallete: tPaint[];
  addPaint: (paint: tPaint) => void;
  holdChip: (chipID?: number, status?: tChipStatus) => void;
  vPanX: tVerse<number>;
  vPanY: tVerse<number>;
  vVelocityX: tVerse<number>;
  //vHeldChipRoot?: tVerse<tChipStatus>;
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
  addPaint: (paint: tPaint) => {},
  holdChip: (chipID?: number, status?: tChipStatus) => {},
  vPanX: null,
  vPanY: null,
  vVelocityX: null,
  vHeldChipID: null,
  //  vHeldChipRoot: null,
  heldChipPaint: null,
});
export const useUserContext = () => useContext(Context);

export default function UserContext({ children }: { children: ReactNode }) {
  const allModifiers = useRef<Record<number, tAttributeModifier>>({}).current;
  const allChipActors = useRef<Record<number, tActor>>({}).current;
  const registerModifier = (attributeModifier: tAttributeModifier) => {
    const id = Object.keys(allModifiers).length + 1;
    console.log("Registering Modifier:", id, attributeModifier);
    allModifiers[id] = attributeModifier;
    for (let chipID in allChipActors) {
      allChipActors[chipID].addModifier(attributeModifier);
    }
    return id;
  };
  const unregisterModifier = (id: number) => {
    delete allModifiers[id];
    for (let chipID in allChipActors) {
      allChipActors[chipID].removeModifier(id);
    }
  };
  const registerChipActor = (chipID: number, entry: tActor) => {
    allChipActors[chipID] = entry;

    for (let key in allModifiers) {
      const entry = allModifiers[key];

      allChipActors[chipID].addModifier(entry);
    }
  };
  const unregisterChipActor = (chipID: number) => {
    delete allChipActors[chipID];
  };
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
  const addPaint = (paint: tPaint) => {
    setUserPallete((prev) => [...prev, paint]);
  };
  const vPanX = useVerse(0);
  const vPanY = useVerse(0);
  const vVelocityX = useVerse(0);
  const vHeldChipID = useVerse<number | null>(null);
  const vHeldChipRoot = useVerse<tChipStatus>(["idle", "ready"]);
  const [heldChipPaint, setHeldChipPaint] = useState<tPaint | null>(null);
  const holdChip = (chipID?: number) => {
    "worklet";
    if (!chipID) {
      vHeldChipID.dispatch(null);
      return;
    }
    if (vHeldChipID.state !== chipID) {
      vHeldChipID.dispatch(chipID);
    }
  };

  useEffect(() => {
    console.log("Held Chip ID:", vHeldChipID.state);
  }, [vHeldChipID.state]);

  return (
    <Context.Provider
      value={{
        userPallete,
        addPaint,
        vPanX,
        vPanY,
        vVelocityX,
        vHeldChipID,
        holdChip,
        // vHeldChipRoot,
        heldChipPaint,
        setHeldChipPaint,
        registerChipActor,
        unregisterChipActor,
        allChipActors,
        registerModifier,
        unregisterModifier,
      }}
    >
      {children}
    </Context.Provider>
  );
}
