import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { Sector } from "./Sector";
import Svg from "react-native-svg";
import { useEffect, useState } from "react";
import { tSectorGroup } from "./sectorTypes";
import { useRadialContext } from "./RadialContext";
import { useActor } from "./Actor";

export const AnimatedSvg = Animated.createAnimatedComponent(Svg);
export const SectorGroup = ({
  rc = { rings: 0, chords: 0 },
  sectors = [],
  children = null,
  props = {},
  style = {},
  selectedStyle = {},
  rotationR = 0,
  sectorGroupID = 0,
}: tSectorGroup) => {
  const actor = useActor({
    ring: rc.rings,
    chord: rc.chords,
    id: sectorGroupID,
    rotateZ: rotationR,
    shadowRadius: 3,
    shadowX: -2,
    shadowY: 2,
  });

  const { transformModifier, selectedRing, origin } = useRadialContext();
  useEffect(() => {
    if (!transformModifier) return;
    actor.addModifier(transformModifier);
    return () => {
      actor.removeModifier(transformModifier.modID);
    };
  }, []);

  const animatedProps = useAnimatedProps(() => {
    return actor.get((attributes) => {
      return {
        transform: [
          { rotateZ: `${attributes.rotateZ || 0}rad` },
          { translateX: attributes.translateX || 0 },
          { translateY: attributes.translateY || 0 },
          { scaleX: attributes.scaleX || 1 },
          { scaleY: attributes.scaleY || 1 },
        ],
      };
    });
  });
  const containerStyle = useAnimatedStyle(() => {
    return actor.get((attributes) => {
      return {
        zIndex: attributes.zIndex || 0,
        shadowOffset: {
          width: attributes.shadowX || 0,
          height: attributes.shadowY || 0,
        },
        shadowRadius: attributes.shadowRadius || 0,
      };
    });
  });
  const [isSelected, setIsSelected] = useState(selectedRing === sectorGroupID);
  useEffect(() => {
    setIsSelected(selectedRing === sectorGroupID);
  }, [selectedRing, sectorGroupID]);
  const radii = sectors.reduce(
    (acc, sector) => {
      if (!acc[0] || sector.radii?.[0] < acc[0]) acc[0] = sector.radii?.[0];
      if (!acc[1] || sector.radii?.[1] > acc[1]) acc[1] = sector.radii?.[1];
      return acc;
    },
    [undefined, undefined] as [number | undefined, number | undefined],
  );
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: origin[0],
          top: origin[1],
          shadowColor: "black",
          shadowOpacity: 0.8,
        },
        containerStyle,
      ]}
    >
      <AnimatedSvg
        {...props}
        animatedProps={animatedProps}
        width={radii?.[1] * 2}
        height={radii?.[1] * 2}
        viewBox={`-${radii?.[1] * 1.1} -${radii?.[1] * 1.1} ${radii?.[1] * 2.2} ${radii?.[1] * 2.2}`}
        style={{
          margin: -radii?.[1],
          ...style,
          ...(isSelected ? selectedStyle : {}),
        }}
      >
        {sectors?.map((sector, index) => (
          <Sector
            {...sector}
            key={`${index}-${sector.rc?.rings}-${sector.rc?.chords}`}
          />
        ))}
        {children}
      </AnimatedSvg>
    </Animated.View>
  );
};
