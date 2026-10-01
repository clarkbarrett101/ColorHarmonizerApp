import { Dimensions } from "react-native";
import React, { useMemo } from "react";
import { eLayers } from "../Contexts/UserContext";
import Animated, {
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";
import { ChipBucket } from "./ChipBucket";
import { useBucketContext } from "./BucketContext";
import { BlurView } from "expo-blur";
import { tVerse, useVerseRelay } from "../utils/Verse";
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function DropScreen() {
  const { vBuckets, vDropScreen, getBucketCallback } = useBucketContext();
  const vBucketsRelay = useVerseRelay(vBuckets);
  const bucketComps = useMemo(
    () =>
      Object.values(vBucketsRelay.state).map((bucket) => (
        <ChipBucket
          key={bucket.id}
          {...bucket}
          callback={getBucketCallback?.(bucket.id)}
        />
      )),
    [vBucketsRelay.state, getBucketCallback],
  );

  return (
    <>
      <BlurScreen vActive={vDropScreen} layer={eLayers.dropScreen} />
      {bucketComps}
    </>
  );
}
export type tBlurScreen = {
  layer?: number;
  vActive?: tVerse<boolean>;
};
export function BlurScreen({ vActive, layer }: tBlurScreen) {
  const dimensions = Dimensions.get("window");

  const animatedProps = useAnimatedProps(() => ({
    intensity: vActive.shared.value
      ? withTiming(40, { duration: 300 })
      : withTiming(0, { duration: 300 }),
  }));
  return (
    <AnimatedBlurView
      animatedProps={animatedProps}
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          width: dimensions.width,
          height: dimensions.height,
          zIndex: layer,
        },
      ]}
      pointerEvents={"none"}
      tint={"extraLight"}
    />
  );
}
