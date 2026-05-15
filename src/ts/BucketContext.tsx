import { createContext, useContext, useState } from "react";
import { tChipBucket } from "./ChipBucket";
import { tChipStatus } from "./PaintChip";
import { tVerse, useVerse } from "./Verse";

export type tBucketContext = {
  buckets?: tChipBucket[];
  registerBucket?: (bucket: tChipBucket) => void;
  unregisterBucket?: (id: string) => void;
  vDropScreen?: tVerse<boolean>;
};
export const ctx = createContext<tBucketContext>({
  buckets: [],
  registerBucket: (bucket: tChipBucket) => {},
  unregisterBucket: (id: string) => {},
});
export const useBucketContext = () => useContext(ctx);

export default function BucketContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [buckets, setBuckets] = useState<tChipBucket[]>([]);
  const registerBucket = (bucket: tChipBucket) => {
    if (bucket.id && !buckets.find((b) => b.id === bucket.id)) {
      setBuckets((prev) => [...prev, bucket]);
    }
  };
  const unregisterBucket = (id: string) => {
    setBuckets((prev) => prev.filter((b) => b.id !== id));
  };
  const vDropScreen = useVerse(false);
  return (
    <ctx.Provider
      value={{
        buckets,
        registerBucket,
        unregisterBucket,
        vDropScreen,
      }}
    >
      {children}
    </ctx.Provider>
  );
}
