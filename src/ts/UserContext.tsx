import React, {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useReducer,
  useRef,
} from "react";
import { tPaint, fRandomPaints } from "./CLAcolor";
import {
  DerivedValue,
  runOnJS,
  SharedValue,
  useSharedValue,
} from "react-native-reanimated";
import { tVerse, useVerse } from "./Verse";
import { tChipEvent } from "./PaintChip";
import { tChipBucket } from "./ChipBucket";
import { scheduleOnRN } from "react-native-worklets";

export const eLayers = {
  dropScreen: 1000,
  colorMixer: 500,
  chipHand: 0,
};
type State = {
  paint: any | null;
  eChipEvent: tChipEvent;
};

type Action = { event: tChipEvent; paint?: any };

export const initialState: State = {
  paint: null,
  eChipEvent: "idle",
};

function chipReducer(state: State, action: Action): State {
  if (action.event === state.eChipEvent) {
    return state; // No state change if the event is the same as the current state
  }
  switch (action.event) {
    case "onPush":
      console.log("Holding chip with paint", action.paint?.name);
      return { ...state, eChipEvent: "onPush", paint: action.paint };
    case "onPull":
      console.log("Pulling chip with paint", action.paint?.name);
      return { ...state, eChipEvent: "onPull", paint: action.paint };
    case "onDrop":
      console.log("Dropped chip with paint", action.paint?.name);
      return { ...state, paint: action.paint, eChipEvent: "onDrop" };
    case "idle":
      return initialState;
    default:
      return state;
  }
}
export type tUserContext = {
  userPallete: RefObject<tPaint[]>;
  addPaint: (paint: tPaint) => void;
  vHeldChip: tVerse<[number, number]>;
  holdChip: (chipID?: [number, number], event?: tChipEvent) => void;
  vPanX: tVerse<number>;
  vPanY: tVerse<number>;
  vPanMix: SharedValue<number>;
  vPanOverride: SharedValue<[number, number]>;
  vVelocityX: tVerse<number>;
  eLayers?: typeof eLayers;
  eventState?: State;
  eventDispatch?: React.Dispatch<Action>;
  buckets?: RefObject<tChipBucket[]>;
  registerBucket?: (bucket: tChipBucket) => void;
  unregisterBucket?: (bucket: tChipBucket) => void;
  vHeldPaint?: tVerse<tPaint>;
};
const phVerse = {
  asState: () => -1 as any,
  fUpdateState: (value?: any) => {},
  asShared: { value: -1 } as DerivedValue<any>,
  setValue: (value: any) => {},
};
export const Context = createContext<tUserContext>({
  userPallete: { current: [] } as React.RefObject<tPaint[]>,
  addPaint: (paint: tPaint) => {},
  vHeldChip: {} as tVerse<[number, number]>,
  holdChip: (chipID?: [number, number], event?: tChipEvent) => {},
  vPanX: phVerse as tVerse<number>,
  vPanY: phVerse as tVerse<number>,
  vVelocityX: phVerse as tVerse<number>,
  vPanMix: { value: 0 } as SharedValue<number>,
  vPanOverride: { value: [0, 0] } as SharedValue<[number, number]>,
  eLayers: eLayers,
  eventState: initialState,
  eventDispatch: () => {},
  buckets: { current: [] } as RefObject<tChipBucket[]>,
  registerBucket: (bucket: tChipBucket) => {},
  unregisterBucket: (bucket: tChipBucket) => {},
  vHeldPaint: {} as tVerse<tPaint>,
});
export const useUserContext = () => useContext(Context);

export default function UserContext({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chipReducer, initialState);
  const userPallete = useRef(fRandomPaints(5));
  const addPaint = (paint: tPaint) => {
    userPallete.current.push(paint);
  };
  const vHeldChip = useVerse([-1, -1] as [number, number]);
  const vHeldPaint = useVerse(null as tPaint | null);
  const vPanX = useVerse(0);
  const vPanY = useVerse(0);
  const vVelocityX = useVerse(0);
  const vPanMix = useSharedValue(0);
  const vPanOverride = useSharedValue([0, 0] as [number, number]);
  const buckets = useRef<tChipBucket[]>([]);
  const registerBucket = (bucket: tChipBucket) => {
    if (!buckets.current.includes(bucket)) {
      buckets.current.push(bucket);
    }
  };
  const unregisterBucket = (bucket: tChipBucket) => {
    buckets.current = buckets.current.filter((b) => b !== bucket);
  };

  const holdChip = (chipID?: [number, number], event?: tChipEvent) => {
    "worklet";

    if (!chipID) {
      vPanX.fUpdateState();
      vPanY.fUpdateState();
      vVelocityX.fUpdateState();
      vHeldChip.fUpdateState([-1, -1] as [number, number]);
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
      scheduleOnRN(dispatch, { event, paint: userPallete.current[chipID[1]] });
    }
  };
  return (
    <Context.Provider
      value={{
        userPallete: userPallete,
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
