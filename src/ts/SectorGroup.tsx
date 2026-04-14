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
import Svg, { FeDropShadow, Filter } from "react-native-svg";
import { useEffect } from "react";
import { tSector, tSectorGroup } from "./sectorTypes";
import { useRadialContext } from "./RadialContext";
import { useAnimatedMatrix } from "./AnimatedMatrix";

export const AnimatedSvg = Animated.createAnimatedComponent(Svg);
export const SectorGroup = ({
  rc = { rings: 0, chords: 0 },
  sectors = [],
  children = null,
  props = {},
  style = {},
  rotationR = 0,
}: tSectorGroup) => {
  const { wTransformMatrix, wGetZIndex, origin } = useRadialContext();
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
    vS: 1,
  });
  const dMatrix = useDerivedValue(() => {
    animatedMatrix.wMatrix(wTransformMatrix(rc, rotationR));
    return animatedMatrix.style.value;
  }, [animatedMatrix]);
  const animatedProps = useAnimatedProps(() => ({
    zIndex: wGetZIndex ? wGetZIndex(rc) : 0,
    transform: [{ matrix: dMatrix.value }],
  }));
  return (
    <AnimatedSvg
      {...props}
      animatedProps={animatedProps}
      width={radii?.[1] * 2}
      height={radii?.[1] * 2}
      viewBox={`-${radii?.[1]} -${radii?.[1]} ${radii?.[1] * 2} ${radii?.[1] * 2}`}
      style={{
        margin: -radii?.[1],
        //   shadowColor: "#000",
        //  shadowOffset: { width: 0, height: 0 },
        //   shadowOpacity: 0.5,
        //     shadowRadius: 6,
        ...style,
      }}
    >
      <Filter id={"shadow"} x="-50%" y="-50%" width="200%" height="200%">
        <FeDropShadow
          dx="0"
          dy="0"
          stdDeviation="5"
          floodColor="#000"
          floodOpacity="0.5"
        />
      </Filter>
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
