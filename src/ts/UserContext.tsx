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
import { tChipBucket } from "./ChipBucket";
import { runOnRuntime, scheduleOnRN } from "react-native-worklets";
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

type tChipEntry = {
  paintValue: () => SharedValue<number>;
};

export type tUserContext = {
  userPallete: tPaint[];
  addPaint: (paint: tPaint) => void;
  holdChip: (chipID?: [number, number], status?: tChipStatus) => void;
  vPanX: tVerse<number>;
  vPanY: tVerse<number>;
  vPanOverride: SharedValue<{ x: number; y: number }>;
  vVelocityX: tVerse<number>;
  eLayers?: typeof eLayers;
  //eventState?: tChipState;
  //eventDispatch?: React.Dispatch<tChipState>;
  vHeldChipRoot?: tVerse<tChipStatus>;
  heldChipID: [number, number] | null;
  heldChipPaint: tPaint | null;
  setHeldChipPaint?: (paint: tPaint | null) => void;
};

export const Context = createContext<tUserContext>({
  userPallete: [],
  addPaint: (paint: tPaint) => {},
  holdChip: (chipID?: [number, number], status?: tChipStatus) => {},
  vPanX: null,
  vPanY: null,
  vPanOverride: null as any,
  vVelocityX: null,
  eLayers: eLayers,
  heldChipID: null,
  vHeldChipRoot: null,
  heldChipPaint: null,
});
export const useUserContext = () => useContext(Context);

export default function UserContext({ children }: { children: ReactNode }) {
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
  const vPanOverride = useSharedValue({ x: 0, y: 0 } as {
    x: number;
    y: number;
  });

  const [heldChipID, setHeldChipID] = useState<[number, number] | null>(null);
  const vHeldChipRoot = useVerse<tChipStatus>(["idle", "ready"]);
  const [heldChipPaint, setHeldChipPaint] = useState<tPaint | null>(null);
  const holdChip = (chipID?: [number, number], status?: tChipStatus) => {
    "worklet";
    if (!chipID) {
      vHeldChipRoot.dispatch(["idle", "returning"]);
      scheduleOnRN(setHeldChipID, null);
      return;
    }
    if (heldChipID !== chipID) {
      scheduleOnRN(setHeldChipID, chipID);
    }
    if (
      vHeldChipRoot.state[0] !== status?.[0] ||
      vHeldChipRoot.state[1] !== status?.[1]
    ) {
      vHeldChipRoot.dispatch(status);
    }
  };

  useEffect(() => {
    console.log(
      "Root Chip Status: ",
      vHeldChipRoot.state,
      " Held Chip ID: ",
      heldChipID,
      " Held Chip Paint: ",
      heldChipPaint?.name,
    );
  }, [vHeldChipRoot.state]);

  return (
    <Context.Provider
      value={{
        userPallete,
        addPaint,
        vPanX,
        vPanY,
        vVelocityX,
        vPanOverride,
        eLayers: eLayers,
        heldChipID,
        holdChip,
        vHeldChipRoot,
        heldChipPaint,
        setHeldChipPaint,
      }}
    >
      {children}
    </Context.Provider>
  );
}
