import { createContext, useContext, useRef } from "react";
import { tChipBucket } from "./ChipBucket";
import { tVerse, useVerse } from "../utils/Verse";
import { scheduleOnUI } from "react-native-worklets";
import { tPaint } from "../utils/CLAcolor";
export type tBucketContext = {
  vBuckets?: tVerse<Record<string, Omit<tChipBucket, "callback">>>;
  registerBucket?: (bucket: tChipBucket) => void;
  unregisterBucket?: (id: string) => void;
  getBucketCallback?: (
    id: string | number,
  ) => ((paint: tPaint) => void) | undefined;
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
  const vBuckets = useVerse<Record<string, Omit<tChipBucket, "callback">>>({});
  const bucketCallbacks = useRef<
    Record<string, ((paint: tPaint) => void) | undefined>
  >({}).current;
  const registerBucket = (bucket: tChipBucket) => {
    "worklet";
    const { callback, ...serializableBucket } = bucket;
    if (bucket.id != null) {
      bucketCallbacks[String(bucket.id)] = callback;
    }
    scheduleOnUI(() => {
      vBuckets.shared.value = {
        ...vBuckets.shared.value,
        [String(bucket.id)]: serializableBucket,
      };
      vBuckets.dispatch();
    });
  };
  const unregisterBucket = (id: string) => {
    "worklet";
    delete bucketCallbacks[id];
    scheduleOnUI(() => {
      const newBuckets = { ...vBuckets.shared.value };
      delete newBuckets[id];
      vBuckets.shared.value = newBuckets;
      vBuckets.dispatch();
    });
  };
  const getBucketCallback = (id: string | number) =>
    bucketCallbacks[String(id)];
  const vDropScreen = useVerse(false);

  return (
    <ctx.Provider
      value={{
        vBuckets,
        registerBucket,
        unregisterBucket,
        getBucketCallback,
        vDropScreen,
      }}
    >
      {children}
    </ctx.Provider>
  );
}
