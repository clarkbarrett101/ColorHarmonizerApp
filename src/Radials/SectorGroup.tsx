import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Sector } from "./Sector";
import Svg from "react-native-svg";
import { useEffect, useState } from "react";
import { fGetBumpSize, tSectorGroup } from "./SectorTypes";
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
  opacity = 1,
  arcLength = 2 / 7,
}: tSectorGroup) => {
  const actor = useActor({
    ring,
    chord,
    id: sectorGroupID,
    rotateZ: rotationR,
    radialOffsetX: 0,
    radialOffsetY: 0,
    shadowRadius: 3,
    shadowX: 1,
    shadowY: 1,
    shadowOpacity: 0.7,
    zIndex: layer ? layer : sectorGroupID,
  });

  const { mTransformModifier, radii: r } = useRadialContext();
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
          { translateX: attributes.radialOffsetX || 0 },
          { translateY: attributes.radialOffsetY || 0 },
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
        opacity: attributes.alpha || 0,
        zIndex: attributes.zIndex || 3,
        shadowOffset: {
          width: attributes.shadowX || 0,
          height: attributes.shadowY || 0,
        },
        shadowRadius: attributes.shadowRadius || 0,
        shadowOpacity: attributes.shadowOpacity || 0,
        shadowColor:
          "#" + (attributes.shadowColor?.toString(16).padStart(6, "0") || null),
      };
    });
    return style;
  });
  const bumpSize = fGetBumpSize(arcLength, r[1]);
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
        viewBox={`-${radii[1] + bumpSize} -${radii[1] + bumpSize} ${(radii[1] + bumpSize) * 2} ${(radii[1] + bumpSize) * 2}`}
        style={{
          margin: -radii?.[1],
          zIndex: 5,
          opacity: opacity,
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
