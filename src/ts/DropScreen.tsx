import { DeviceEventEmitter, Dimensions } from "react-native";
import React, { use, useCallback, useEffect, useRef, useState } from "react";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { eLayers, useUserContext } from "./UserContext";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { ChipBucket } from "./ChipBucket";
import { useBucketContext } from "./BucketContext";
import { useVerseRelay } from "./Verse";
import { Blur } from "@shopify/react-native-skia";
import { BlurView } from "expo-blur";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
export type tDropScreen = {};

export default function DropScreen({}: tDropScreen) {
  const { buckets, vDropScreen } = useBucketContext();
  const vDropScreenRelay = useVerseRelay(vDropScreen);
  const dimensions = Dimensions.get("window");
  const aspectRatio = dimensions.height / dimensions.width;
  console.log(
    "DropScreen Render - DropScreen State:",
    vDropScreenRelay.state,
    vDropScreenRelay.shared.value,
  );
  const animatedStyle = useAnimatedProps(() => {
    return {
      intensity: withTiming(vDropScreenRelay.shared.value ? 10 : 0, {
        duration: 300,
      }),
    };
  });
  const bucketComps = () => {
    let comps = [];
    for (let bucket of buckets) {
      comps.push(<ChipBucket key={bucket.id} {...bucket} />);
    }
    return comps;
  };

  return (
    <>
      <AnimatedBlurView
        animatedProps={animatedStyle}
        tint={"systemChromeMaterial"}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: dimensions.width,
          height: dimensions.height,
          zIndex: vDropScreenRelay.state ? eLayers.dropScreen : -1,
        }}
      />

      {bucketComps()}
    </>
  );
}
