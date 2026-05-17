import { Dimensions } from "react-native";
import React, { useEffect } from "react";
import { eLayers } from "./UserContext";
import Animated, {
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";
import { ChipBucket } from "./ChipBucket";
import { useBucketContext } from "./BucketContext";
import { useVerseRelay } from "./Verse";
import { BlurView } from "expo-blur";
import { BGGradient } from "./BGGradient";
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
export type tDropScreen = {};

export default function DropScreen({}: tDropScreen) {
  const { buckets, vDropScreen } = useBucketContext();
  const vDropScreenRelay = useVerseRelay(vDropScreen);
  const dimensions = Dimensions.get("window");

  const animatedStyle = useAnimatedProps(() => {
    return {
      intensity: 50,
    };
  });
  useEffect(() => {
    if (vDropScreenRelay.state) {
      console.log("Dispatch end:", performance.now());
    }
  }, [vDropScreenRelay.state]);

  const bucketComps = () => {
    let comps = [];
    for (let bucket of buckets) {
      comps.push(<ChipBucket key={bucket.id} {...bucket} />);
    }
    return comps;
  };
  return (
    <>
      <BGGradient />
      <AnimatedBlurView
        animatedProps={animatedStyle}
        tint={"light"}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: dimensions.width,
          height: dimensions.height,
          zIndex: vDropScreenRelay.state ? eLayers.dropScreen : 0,
        }}
      />
      {bucketComps()}
    </>
  );
}
