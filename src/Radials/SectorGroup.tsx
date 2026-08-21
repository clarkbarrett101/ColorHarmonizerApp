import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Sector } from "./Sector";
import Svg from "react-native-svg";
import { useEffect, useState } from "react";
import { tSectorGroup } from "./SectorTypes";
import { useRadialContext } from "./RadialContext";
import { tAttributeMap, useActor } from "../utils/Actor";
import { eLayers } from "../Contexts/UserContext";

export const AnimatedSvg = Animated.createAnimatedComponent(Svg);
export const SectorGroup = ({
  ring = 5,
  chord = 18,
  sectors = [],
  rotationR = 0,
  sectorGroupID = 0,
  children,
  origin = [0, 0],
  radii = [20, 200],
  layer,
}: tSectorGroup) => {
  const actor = useActor({
    ring,
    chord,
    id: sectorGroupID,
    rotateZ: rotationR,
    shadowRadius: 3,
    shadowX: 1,
    shadowY: 1,
    shadowOpacity: 0.7,
    zIndex: layer ? layer : sectorGroupID,
  });

  const { mTransformModifier } = useRadialContext();
  useEffect(() => {
    if (!mTransformModifier) return;
    actor.addModifier(mTransformModifier);
    return () => {
      actor.removeModifier(mTransformModifier.modID);
    };
  }, [mTransformModifier]);

  const animatedProps = useAnimatedProps(() => {
    "worklet";
    return actor.get((attributes) => {
      return {
        transform: [
          { translateY: attributes.translateY || 0 },
          { rotateZ: `${attributes.rotateZ || 0}rad` },
          { translateX: attributes.translateX || 0 },
          { scaleX: attributes.scaleX || 1 },
          { scaleY: attributes.scaleY || 1 },
        ],
      };
    });
  });

  const containerStyle = useAnimatedStyle(() => {
    "worklet";
    const style = actor.get((attributes) => {
      return {
        zIndex: attributes.zIndex || 3,
        shadowOffset: {
          width: attributes.shadowX || 0,
          height: attributes.shadowY || 0,
        },
        shadowRadius: attributes.shadowRadius || 0,
        shadowOpacity: attributes.shadowOpacity || 0,
        shadowColor:
          "#" +
          (attributes.shadowColor?.toString(16).padStart(6, "0") || "000000"),
      };
    });
    return style;
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: origin[0] || 0,
          top: origin[1] || 0,
        },
        containerStyle,
      ]}
      pointerEvents={"none"}
    >
      <AnimatedSvg
        animatedProps={animatedProps}
        width={radii?.[1] * 2}
        height={radii?.[1] * 2}
        viewBox={`-${radii[1] * 1.05} -${radii[1] * 1.05} ${radii[1] * 2.1} ${radii[1] * 2.1}`}
        style={{
          margin: -radii?.[1],
          zIndex: 5,
        }}
      >
        {sectors?.map((sector, index) => (
          <Sector {...sector} key={`${index}-${ring}-${chord}`} />
        ))}
        {children}
      </AnimatedSvg>
    </Animated.View>
  );
};
