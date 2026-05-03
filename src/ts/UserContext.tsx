import React, {
  createContext,
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
import { tPaint, fRandomPaints } from "./CLAcolor";
import {
  DerivedValue,
  runOnJS,
  SharedValue,
  useSharedValue,
} from "react-native-reanimated";
import { tVerse, useVerse } from "./Verse";
import { tChipStatus } from "./PaintChip";
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
  status: tChipStatus;
  dispatch: React.Dispatch<any>;
  fGetPaint: () => tPaint;
};

export type tUserContext = {
  userPallete: tPaint[];
  addPaint: (paint: tPaint) => void;
  holdChip: (chipID?: [number, number], status?: string) => void;
  vPanX: tVerse<number>;
  vPanY: tVerse<number>;
  vPanMix: SharedValue<number>;
  vPanOverride: SharedValue<{ x: number; y: number }>;
  vVelocityX: tVerse<number>;
  eLayers?: typeof eLayers;
  //eventState?: tChipState;
  //eventDispatch?: React.Dispatch<tChipState>;
  buckets?: tChipBucket[];
  registerBucket?: (bucket: tChipBucket) => void;
  unregisterBucket?: (id: string) => void;
  // vHeldPaint?: tVerse<tPaint>;
  registerChip: (
    id: [number, number],
    status: tChipStatus,
    dispatch: React.Dispatch<any>,
    fGetPaint: () => tPaint,
  ) => void;
  unregisterChip: (id: [number, number]) => void;
  heldChipID: string | null;
  heldChipStatus: tChipStatus | null;
  heldChipDispatch: React.Dispatch<any> | null;
  heldChipPaint: tPaint | null;
};
const phVerse = {
  asState: -1,
  fUpdateState: (value?: any) => {},
  asShared: { value: -1 } as DerivedValue<any>,
};
export const Context = createContext<tUserContext>({
  userPallete: [] as tPaint[],
  addPaint: (paint: tPaint) => {},
  //vHeldChip: {} as tVerse<[number, number] | null>,
  holdChip: (chipID?: [number, number]) => {},
  vPanX: phVerse as tVerse<number>,
  vPanY: phVerse as tVerse<number>,
  vVelocityX: phVerse as tVerse<number>,
  vPanMix: { value: 0 } as SharedValue<number>,
  vPanOverride: { value: { x: 0, y: 0 } } as SharedValue<{
    x: number;
    y: number;
  }>,
  eLayers: eLayers,
  buckets: [] as tChipBucket[],
  registerBucket: (bucket: tChipBucket) => {},
  unregisterBucket: (id: string) => {},
  // vHeldPaint: {} as tVerse<tPaint>,
  registerChip: (
    id: [number, number],
    status: tChipStatus,
    dispatch: React.Dispatch<any>,
    fGetPaint: () => tPaint,
  ) => {},
  unregisterChip: (id: [number, number]) => {},
  heldChipID: null,
  heldChipStatus: null,
  heldChipDispatch: null,
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
  const [userPallete, setUserPallete] = useState(fRandomPaints(5));
  const addPaint = (paint: tPaint) => {
    setUserPallete((prev) => [...prev, paint]);
  };
  const vPanX = useVerse(0);
  const vPanY = useVerse(0);
  const vVelocityX = useVerse(0);
  const vPanMix = useSharedValue(0);
  const vPanOverride = useSharedValue({ x: 0, y: 0 } as {
    x: number;
    y: number;
  });
  const [chipRegistry, setChipRegistry] = useState<Record<string, tChipEntry>>(
    {},
  );
  function registerChip(
    id: [number, number],
    status: tChipStatus,
    dispatch: React.Dispatch<any>,
    fGetPaint: () => tPaint,
  ) {
    console.log("Registering chip", id);
    setChipRegistry((prev) => ({
      ...prev,
      [`${id[0]}-${id[1]}`]: { status, dispatch, fGetPaint },
    }));
  }
  function unregisterChip(id: [number, number]) {
    setChipRegistry((prev) => {
      const newRegistry = { ...prev };
      delete newRegistry[`${id[0]}-${id[1]}`];
      return newRegistry;
    });
  }
  const [heldChipID, setHeldChipID] = useState<string | null>(null);
  const heldChipStatus = heldChipID
    ? chipRegistry[heldChipID]?.status || null
    : null;
  const heldChipDispatch = heldChipID
    ? chipRegistry[heldChipID]?.dispatch || null
    : null;
  const heldChipPaint = heldChipID
    ? chipRegistry[heldChipID]?.fGetPaint() || null
    : null;
  const holdChip = (chipID?: [number, number], status?: string) => {
    "worklet";
    if (!chipID) {
      vPanX.fUpdateState();
      vPanY.fUpdateState();
      vVelocityX.fUpdateState();
      heldChipDispatch?.({ returning: {} });
      scheduleOnRN(setHeldChipID, null);
      return;
    }
    const newID = `${chipID[0]}-${chipID[1]}`;
    if (chipRegistry[newID] === undefined) {
      console.warn("Attempting to hold unregistered chip", newID);
      return;
    }
    if (heldChipID === newID) {
      return;
    }
    console.log("Holding chip", newID);
    if (heldChipID !== null) {
      console.warn("Dropping chip", heldChipID, "to hold chip", newID);
    }
    scheduleOnRN(setHeldChipID, newID);
    chipRegistry[newID]?.dispatch?.({ grabbed: { [status || "pushed"]: {} } });
  };

  return (
    <Context.Provider
      value={{
        userPallete,
        addPaint,
        vPanX,
        vPanY,
        vVelocityX,
        vPanMix,
        vPanOverride,
        eLayers: eLayers,
        buckets,
        registerBucket,
        unregisterBucket,
        registerChip,
        unregisterChip,
        heldChipID,
        holdChip,
        heldChipStatus,
        heldChipDispatch,
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
