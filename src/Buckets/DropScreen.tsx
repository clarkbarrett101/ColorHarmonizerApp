import { Dimensions } from "react-native";
import React, { use, useEffect, useMemo } from "react";
import { eLayers } from "../Contexts/UserContext";
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ChipBucket } from "./ChipBucket";
import { useBucketContext } from "./BucketContext";
import { BlurView } from "expo-blur";
import { tVerse, useVerseRelay } from "../utils/Verse";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function DropScreen() {
  const { vBuckets, vDropScreen } = useBucketContext();
  const bucketComps = useMemo(
    () =>
      Object.values(vBuckets.state).map((bucket) => (
        <ChipBucket key={bucket.id} {...bucket} />
      )),
    [vBuckets.state],
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
      ? withTiming(20, { duration: 300 })
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
      tint={"light"}
    />
  );
}
