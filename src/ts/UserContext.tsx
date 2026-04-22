import React, { Ref, useRef, useState } from "react";
import { tPaint, fRandomPaints } from "./CLAcolor";
import {
  SharedValue,
  DerivedValue,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";

export type tUserContext = {
  userPallete: React.RefObject<tPaint[]>;
  vHeldChip: SharedValue<[number, number]>;
  holdChip: (chipID?: [number, number]) => void;
  vPanX: SharedValue<number>;
  vPanY: SharedValue<number>;
  vVelocityX: SharedValue<number>;
};

export const Context = React.createContext<tUserContext>({
  userPallete: { current: [] } as React.RefObject<tPaint[]>,
  vHeldChip: { value: [-1, -1] } as SharedValue<[number, number]>,
  holdChip: (chipID?: [number, number]) => {},
  vPanX: { value: 0 } as SharedValue<number>,
  vPanY: { value: 0 } as SharedValue<number>,
  vVelocityX: { value: 0 } as SharedValue<number>,
});
export const useUserContext = () => React.useContext(Context);

export default function UserContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const userPallete = useRef(fRandomPaints(5));
  const vHeldChip = useSharedValue([-1, -1] as [number, number]);
  const vPanX = useSharedValue(0);
  const vPanY = useSharedValue(0);
  const vVelocityX = useSharedValue(0);
  const holdChip = (chipID?: [number, number]) => {
    "worklet";

    if (!chipID) {
      vHeldChip.value = [-1, -1] as [number, number];
      return;
    }
    if (vHeldChip.value[0] === chipID[0] && vHeldChip.value[1] === chipID[1]) {
      // console.warn("Already holding chip", chipID);
      return;
    }
    if (vHeldChip.value[0] !== -1) {
      console.warn("Dropping chip", vHeldChip.value, "to hold chip", chipID);
    }
    vHeldChip.value = chipID;
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
      }}
    >
      {children}
    </Context.Provider>
  );
}
