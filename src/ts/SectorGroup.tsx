import Animated, {
  SharedValue,
  DerivedValue,
  useDerivedValue,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Sector } from "./Sector";
import Svg, { FeDropShadow, Filter, G } from "react-native-svg";
import { use, useEffect, useState } from "react";
import { tSector, tSectorGroup } from "./sectorTypes";
import { useRadialContext } from "./RadialContext";
import { useAnimatedMatrix } from "./AnimatedMatrix";
import { SectorShadow } from "./SectorShadow";

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
  const { wTransformMatrix, wGetZIndex, selectedRing } = useRadialContext();
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
  const centroid = {
    x: (Math.cos(rotationR) * (radii[0] + radii[1])) / 2,
    y: (Math.sin(rotationR) * (radii[0] + radii[1])) / 2,
  };
  const animatedMatrix = useAnimatedMatrix({
    vT: { x: 0, y: 0 },
    vR: 0,
    vS: { x: 1, y: 1 },
  });
  const dMatrix = useDerivedValue(() => {
    animatedMatrix.wMatrix(wTransformMatrix(rc, rotationR));
    return animatedMatrix.style.value;
  }, [animatedMatrix]);
  const animatedProps = useAnimatedProps(() => {
    const z = wGetZIndex ? wGetZIndex(rc) : 0;
    return {
      zIndex: z,
      transform: [{ matrix: dMatrix.value }],
    };
  });
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
        shadowOpacity: 0.5,
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
