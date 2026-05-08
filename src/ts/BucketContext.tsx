import { createContext, useContext, useState } from "react";
import { tChipBucket } from "./ChipBucket";
import { tChipStatus } from "./PaintChip";
import { tVerse } from "./Verse";

export type tBucketContext = {
  buckets?: tChipBucket[];
  registerBucket?: (bucket: tChipBucket) => void;
  unregisterBucket?: (id: string) => void;
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
  return (
    <ctx.Provider value={{ buckets, registerBucket, unregisterBucket }}>
      {children}
    </ctx.Provider>
  );
}
