import Animated, {
  useAnimatedProps,
  useDerivedValue,
} from "react-native-reanimated";
import { Path } from "react-native-svg";
import { useRadialContext } from "./RadialContext";
import { tSector } from "./sectorTypes";
import { useActor } from "./Actor";
import { useEffect } from "react";
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const Sector = ({
  arcLength = 44 / 7,
  radii = [20, 200],
  sectorGroupID = 0,
  rc = { rings: 5, chords: 18 },
}: tSector) => {
  const {
    fPathFunction,
    colorModifier,
    radii: contextRadii,
    deps,
  } = useRadialContext();
  const path = fPathFunction(radii, arcLength, contextRadii[1]);
  const actor = useActor({ ring: rc.rings, chord: rc.chords });
  useEffect(() => {
    actor.addModifier(colorModifier);
    return () => {
      actor.removeModifier(colorModifier.modID);
    };
  }, []);
  const animatedProps = useAnimatedProps(() => {
    return actor.get((attributes) => {
      return {
        fill: `rgba(${attributes.red || 0},${attributes.green || 0},${attributes.blue || 0},1)`,
      };
    });
  });
  return (
    <AnimatedPath animatedProps={animatedProps} d={path} strokeWidth={1} />
  );
};
export const fMakeSectorPath = (
  radii: [number, number],
  arcLength: number,
  maxRadius: number,
): string => {
  const startRad = -arcLength / 2;
  const endRad = arcLength / 2;
  const x1 = radii[1] * Math.cos(startRad);
  const y1 = radii[1] * Math.sin(startRad);
  const x2 = radii[1] * Math.cos(endRad);
  const y2 = radii[1] * Math.sin(endRad);
  const x3 = radii[0] * Math.cos(endRad);
  const y3 = radii[0] * Math.sin(endRad);
  const x4 = radii[0] * Math.cos(startRad);
  const y4 = radii[0] * Math.sin(startRad);
  const largeArcFlag = arcLength <= 22 / 7 ? "0" : "1";
  const path = `
                M ${x1} ${y1}                 
                A ${radii[1]} ${radii[1]} 0 ${largeArcFlag} 1 ${x2} ${y2} 
                L ${x3} ${y3}        
                A ${radii[0]} ${radii[0]} 0 ${largeArcFlag} 0 ${x4} ${y4}  
                Z                              
            `.trim();
  return path;
};
export const fMakePetalPath = (
  radii: [number, number],
  arcLength: number,
  maxRadius: number,
): string => {
  const endRad = arcLength / 2;
  const x1 = 0.99 * maxRadius * Math.cos(endRad) - (maxRadius - radii[1]);
  const x2 = 0.99 * maxRadius * Math.cos(-endRad) - (maxRadius - radii[1]);
  const y1 = 0.99 * maxRadius * Math.sin(endRad);
  const y2 = 0.99 * maxRadius * Math.sin(-endRad);
  const x3 = x2 - (radii[1] - radii[0]);
  const x4 = x1 - (radii[1] - radii[0]);
  const y3 = y2;
  const y4 = y1;
  const largeArcFlag = arcLength <= 22 / 7 ? "0" : "1";
  const path = `
                  M ${x1} ${y1}                 
                  A ${maxRadius / 2} ${maxRadius / 2}  0 ${largeArcFlag} 0 ${x2} ${y2} 
                  L ${x3} ${y3} 
                  A ${maxRadius / 2} ${maxRadius / 2}  0 ${largeArcFlag} 0 ${x4} ${y4}       
                  Z                              
              `.trim();
  return path;
};
export type tSelectionRange = {
  angle: number | [number, number];
  radial?: number | [number, number];
};
