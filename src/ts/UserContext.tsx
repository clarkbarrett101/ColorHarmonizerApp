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
import { fRandomPaints } from "./CLAcolor";
import {
  DerivedValue,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import { tVerse, useVerse } from "./Verse";
import { eChipMap, fStatusMatch, tChipStatus } from "./PaintChip";
import { tChipBucket } from "./ChipBucket";
import { runOnRuntime, scheduleOnRN } from "react-native-worklets";

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
  fGetPaint: () => number;
};

export type tUserContext = {
  userPallete: number[];
  addPaint: (paint: number) => void;
  holdChip: (chipID?: [number, number], status?: tChipStatus) => void;
  vPanX: tVerse<number>;
  vPanY: tVerse<number>;
  vPanOverride: SharedValue<{ x: number; y: number }>;
  vVelocityX: tVerse<number>;
  eLayers?: typeof eLayers;
  //eventState?: tChipState;
  //eventDispatch?: React.Dispatch<tChipState>;
  buckets?: tChipBucket[];
  registerBucket?: (bucket: tChipBucket) => void;
  unregisterBucket?: (id: string) => void;
  vHeldChipStatus?: tVerse<tChipStatus>;
  registerChip: (id: [number, number], fGetPaint: () => number) => void;
  unregisterChip: (id: [number, number]) => void;
  vHeldChipID: tVerse<string | null>;
  heldChipPaint: number | null;
};
const phVerse = {
  asState: -1,
  wUpdateState: (value?: any) => {},
  asShared: { value: -1 } as DerivedValue<any>,
};
export const Context = createContext<tUserContext>({
  userPallete: [],
  addPaint: (paint: number) => {},
  holdChip: (chipID?: [number, number], status?: tChipStatus) => {},
  vPanX: phVerse,
  vPanY: phVerse,
  vPanOverride: null as any,
  vVelocityX: phVerse,
  eLayers: eLayers,
  registerChip: (id: [number, number], fGetPaint: () => number) => {},
  unregisterChip: (id: [number, number]) => {},
  vHeldChipID: null,
  vHeldChipStatus: null,
  heldChipPaint: null,
});
export const useUserContext = () => useContext(Context);

export default function UserContext({ children }: { children: ReactNode }) {
  const [buckets, setBuckets] = useState<tChipBucket[]>([]);
  const registerBucket = (bucket: tChipBucket) => {
    if (bucket.id && !buckets.find((b) => b.id === bucket.id)) {
      setBuckets((prev) => [...prev, bucket]);
    }
  };
  const unregisterBucket = (id: string) => {
    setBuckets((prev) => prev.filter((b) => b.id !== id));
  };
  function randomIndexes(count: number, max: number) {
    const indexes = new Set<number>();
    while (indexes.size < count) {
      indexes.add(Math.floor(Math.random() * max));
    }
    return Array.from(indexes);
  }
  const [userPallete, setUserPallete] = useState<number[]>(
    randomIndexes(5, 13000),
  );
  const addPaint = (paint: number) => {
    setUserPallete((prev) => [...prev, paint]);
  };
  const vPanX = useVerse(0);
  const vPanY = useVerse(0);
  const vVelocityX = useVerse(0);
  const vPanOverride = useSharedValue({ x: 0, y: 0 } as {
    x: number;
    y: number;
  });
  const [chipRegistry, setChipRegistry] = useState<Record<string, tChipEntry>>(
    {},
  );
  function registerChip(id: [number, number], fGetPaint: () => number) {
    console.log("Registering chip", id);
    setChipRegistry((prev) => ({
      ...prev,
      [`${id[0]}-${id[1]}`]: { fGetPaint },
    }));
  }
  function unregisterChip(id: [number, number]) {
    setChipRegistry((prev) => {
      const newRegistry = { ...prev };
      delete newRegistry[`${id[0]}-${id[1]}`];
      return newRegistry;
    });
  }
  const vHeldChipID = useVerse<string | null>(null);
  const vHeldChipStatus = useVerse<tChipStatus>(eChipMap.idle.ready);
  const heldChipPaint = vHeldChipID.asState
    ? chipRegistry[vHeldChipID.asState]?.fGetPaint() || null
    : null;
  const holdChip = (chipID?: [number, number], status?: tChipStatus) => {
    "worklet";
    if (!chipID) {
      if (vHeldChipStatus.asState.idle) {
        return;
      }
      vPanX.wUpdateState();
      vPanY.wUpdateState();
      vVelocityX.wUpdateState();
      vHeldChipStatus.wUpdateState(eChipMap.idle.returning);
      return;
    }
    const newID = `${chipID[0]}-${chipID[1]}`;
    if (chipRegistry[newID] === undefined) {
      console.warn("Attempting to hold unregistered chip", newID);
      return;
    }
    if (vHeldChipID.asState != newID) {
      vHeldChipID.wUpdateState(newID);
    }
    if (!fStatusMatch(vHeldChipStatus.asState, status)) {
      vHeldChipStatus.wUpdateState(status);
      console.log("Chip status set to", status, "for chip", newID);
    }
  };

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
        buckets,
        registerBucket,
        unregisterBucket,
        registerChip,
        unregisterChip,
        vHeldChipID,
        holdChip,
        vHeldChipStatus,
        heldChipPaint,
      }}
    >
      {children}
    </Context.Provider>
  );
}
/*
  const holdChip = (chipID?: [number, number]) => {
    "worklet";

    if (!chipID) {
      vPanX.fUpdateState();
      vPanY.fUpdateState();
      vVelocityX.fUpdateState();
      vHeldChip.fUpdateState(null);
      return;
    }
    if (
      vHeldChip.asShared.value[0] === chipID[0] &&
      vHeldChip.asShared.value[1] === chipID[1]
    ) {
      return;
    }
    if (vHeldChip.asShared.value[0] !== -1) {
      console.warn(
        "Dropping chip",
        vHeldChip.asShared.value,
        "to hold chip",
        chipID,
      );
    }
    vHeldChip.fUpdateState(chipID);
    if (event) {
      scheduleOnRN(dispatch, { status: { chipID } });
    }
  };
  return (
    <Context.Provider
      value={{
        userPallete,
        vHeldChip,
        holdChip,
        vPanX,
        vPanY,
        vVelocityX,
        vPanMix,
        vPanOverride,
        eLayers: eLayers,
        eventState: state,
        eventDispatch: dispatch,
        buckets,
        registerBucket,
        unregisterBucket,
        addPaint,
        vHeldPaint,
      }}
    >
      {children}
    </Context.Provider>
  );
}
*/
