import { createContext, useContext, useEffect, useState } from "react";
import { tChipBucket } from "./ChipBucket";
import { tChipStatus } from "../Chips/PaintChip";
import { tVerse, useVerse } from "../utils/Verse";
import { scheduleOnUI } from "react-native-worklets";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";

import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";

export type tBucketContext = {
  vBuckets?: tVerse<Record<string, tChipBucket>>;
  registerBucket?: (bucket: tChipBucket) => void;
  unregisterBucket?: (id: string) => void;
  vDropScreen?: tVerse<boolean>;
};
export const ctx = createContext<tBucketContext>({
  vBuckets: undefined,
  registerBucket: (bucket: tChipBucket) => {},
  unregisterBucket: (id: string) => {},
});
export const useBucketContext = () => useContext(ctx);

export default function BucketContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const vBuckets = useVerse<Record<string, tChipBucket>>({});
  const registerBucket = (bucket: tChipBucket) => {
    "worklet";
    scheduleOnUI(() => {
      vBuckets.shared.value = {
        ...vBuckets.shared.value,
        [bucket.id]: bucket,
      };
      vBuckets.dispatch();
    });
  };
  const unregisterBucket = (id: string) => {
    "worklet";
    scheduleOnUI(() => {
      const newBuckets = { ...vBuckets.shared.value };
      delete newBuckets[id];
      vBuckets.shared.value = newBuckets;
      vBuckets.dispatch();
    });
  };
  const vDropScreen = useVerse(false);

  return (
    <ctx.Provider
      value={{
        vBuckets,
        registerBucket,
        unregisterBucket,
        vDropScreen,
      }}
    >
      {children}
    </ctx.Provider>
  );
}
