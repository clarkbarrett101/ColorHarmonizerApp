import Animated, {
  SharedValue,
  DerivedValue,
  useDerivedValue,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Sector } from "./Sector";
import Svg from "react-native-svg";
import { useEffect } from "react";
import { tSector, tSectorGroup } from "./sectorTypes";
import { useRadialContext } from "./RadialContext";

export const AnimatedSvg = Animated.createAnimatedComponent(Svg);
export const SectorGroup = ({
  rc = { rings: 0, chords: 0 },
  rotationR = 0,
  sectors = [],
  children = null,
  props = {},
  style = {},
}: tSectorGroup) => {
  const { rotationROffset, offset, radii, panPos, direction } =
    useRadialContext();
  const mainRotation = useSharedValue(0);
  useEffect(() => {
    mainRotation.value = withTiming(rotationR * direction, { duration: 500 });
  }, [rotationR, direction]);
  const mainOffset = useDerivedValue(() => {
    const _ = rotationROffset?.value;
    const pan = panPos?.value;
    return offset(rc, rotationR) || 0;
  }, [rc, rotationR, panPos]);
  const animatedProps = useAnimatedProps(() => ({
    transform: [
      {
        rotate: `${-rotationROffset?.value * direction + mainRotation.value}rad`,
      },
      {
        translateX: mainOffset.value,
      },
    ],
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        ...style,
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
