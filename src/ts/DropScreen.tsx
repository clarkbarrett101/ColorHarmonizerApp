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
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { ChipBucket } from "./ChipBucket";

export type tDropScreen = {};

export default function DropScreen({}: tDropScreen) {
  const { buckets, vHeldChipStatus } = useUserContext();
  const dimensions = Dimensions.get("window");
  const aspectRatio = dimensions.height / dimensions.width;
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (vHeldChipStatus.asState["idle"]) {
      setActive(false);
    } else {
      setActive(true);
    }
  }, [vHeldChipStatus.asState]);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(active ? 1 : 0, { duration: 200 }),
      width: active ? dimensions.width : 0,
      height: active ? dimensions.height : 0,
      zIndex: active ? eLayers.dropScreen : -1,
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
      <Animated.View
        style={[
          animatedStyle,
          {
            position: "absolute",
            left: 0,
            top: 0,
          },
        ]}
      >
        <Svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          <Defs>
            <RadialGradient
              id="grad"
              cx={dimensions.width / 2}
              cy={dimensions.height / 2 / aspectRatio}
              r={dimensions.width * 0.75}
              gradientUnits="userSpaceOnUse"
              gradientTransform={`scale(1, ${aspectRatio})`}
            >
              <Stop offset="0%" stopColor="#000000" stopOpacity={0} />
              <Stop offset="100%" stopColor="#000000" stopOpacity={0.5} />
            </RadialGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            fill="url(#grad)"
          />
        </Svg>
      </Animated.View>
      {bucketComps()}
    </>
  );
}
