import Animated, { useAnimatedProps } from "react-native-reanimated";
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
    groupID: sectorGroupID,
    rotationZ: rotationR,
  });

  const { transformModifier, selectedRing } = useRadialContext();

  useEffect(() => {
    actor.addModifier("transform", transformModifier);
    return () => {
      actor.removeModifier("transform");
    };
  }, []);

  const animatedProps = useAnimatedProps(() => {
    return actor.get((attributes) => {
      return {
        zIndex: attributes.zIndex || 0,
        transform: [
          { rotateZ: `${attributes.rotationZ || 0}rad` },
          { translateX: attributes.translateX || 0 },
          { scale: attributes.scale || 1 },
        ],
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
    <AnimatedSvg
      {...props}
      animatedProps={animatedProps}
      width={radii?.[1] * 2}
      height={radii?.[1] * 2}
      viewBox={`-${radii?.[1] * 1.1} -${radii?.[1] * 1.1} ${radii?.[1] * 2.2} ${radii?.[1] * 2.2}`}
      style={{
        margin: -radii?.[1],
        shadowColor: "black",
        shadowOffset: { width: -1, height: -1 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
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
  );
};
