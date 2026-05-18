import { Dimensions } from "react-native";
import React, { useEffect, useMemo } from "react";
import { eLayers } from "./UserContext";
import Animated, {
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";
import { ChipBucket } from "./ChipBucket";
import { useBucketContext } from "./BucketContext";
import { BlurView } from "expo-blur";
import { useVerseRelay } from "./Verse";
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
export type tDropScreen = {};

export default function DropScreen({}: tDropScreen) {
  const { buckets, vDropScreen } = useBucketContext();
  const vDropScreenRelay = useVerseRelay(vDropScreen);

  const dimensions = Dimensions.get("window");

  const animatedProps = useAnimatedProps(() => ({
    intensity: vDropScreenRelay.shared.value
      ? withTiming(20, { duration: 300 })
      : withTiming(0, { duration: 300 }),
  }));

  const bucketComps = useMemo(
    () => buckets.map((bucket) => <ChipBucket key={bucket.id} {...bucket} />),
    [buckets],
  );
  return (
    <>
      <AnimatedBlurView
        animatedProps={animatedProps}
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            width: dimensions.width,
            height: dimensions.height,
            zIndex: eLayers.dropScreen,
          },
        ]}
        pointerEvents={"none"}
        tint={"light"}
      />

      {bucketComps}
    </>
  );
}
