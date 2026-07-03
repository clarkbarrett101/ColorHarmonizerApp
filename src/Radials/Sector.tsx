import Animated, {
  useAnimatedProps,
  useDerivedValue,
} from "react-native-reanimated";
import { Path } from "react-native-svg";
import { useRadialContext } from "./RadialContext";
import { tSector, fMakePetalPath } from "./SectorTypes";
import { useActor } from "../utils/Actor";
import { useEffect } from "react";
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const Sector = (props: tSector) => {
  const context = useRadialContext();
  const arcLength = props.arcLength || 0.1;
  const fPathFunction = context.fPathFunction || fMakePetalPath;
  const mColorModifier = context.mColorModifier;

  const path = fPathFunction(props.radii, arcLength, context.radii[1]);
  const actor = useActor({
    ring: props.ring,
    chord: props.chord,
    red: 125,
    green: 125,
    blue: 125,
  });
  useEffect(() => {
    if (!mColorModifier) return;
    actor.addModifier(mColorModifier);
    return () => {
      actor.removeModifier(mColorModifier.modID);
    };
  }, []);
  const animatedProps = useAnimatedProps(() => {
    "worklet";
    return actor.get((attributes) => {
      return {
        fill: `rgba(${attributes.red || 0},${attributes.green || 0},${attributes.blue || 0},1)`,
      };
    });
  });
  return (
    <AnimatedPath animatedProps={animatedProps} d={path} strokeWidth={2} />
  );
};
