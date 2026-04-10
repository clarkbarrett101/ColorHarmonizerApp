import Animated, {
  DerivedValue,
  SharedValue,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { CLARColor, tCLARColor } from "./CLAcolor";
import Svg, { Circle, Path } from "react-native-svg";
import { useRadialContext } from "./RadialContext";
import { tSector } from "./sectorTypes";
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const Sector = ({
  arcLength = 44 / 7,
  radii = [20, 200],
  sectorGroupID = 0,
  rc = { rings: 5, chords: 18 },
}: tSector) => {
  const context = useRadialContext();
  const { pathFunction, getColor, radii: contextRadii, selectColor } = context;
  const path = pathFunction
    ? pathFunction(radii, arcLength, contextRadii[1])
    : "";

  const fill = useDerivedValue(() => {
    const _ = selectColor?.value;
    const fillColor = getColor
      ? getColor({ rings: rc.rings, chords: rc.chords })
      : { c: 0, l: 0, ar: 0 };
    let u = Math.cos(fillColor.ar) * 0.5;
    let v = Math.sin(fillColor.ar) * 0.5;
    u = fillColor.c * u;
    v = fillColor.c * v;
    const y = fillColor.l;
    const r = (y + 1.13983 * v) * 255;
    const g = (y - 0.39465 * u - 0.5806 * v) * 255;
    const b = (y + 2.03211 * u) * 255;
    return `rgb(${r}, ${g}, ${b})`;
  }, [getColor]);
  const animatedProps = useAnimatedProps(() => ({
    fill: fill.value,
    stroke: fill.value,
  }));
  return (
    <AnimatedPath d={path} animatedProps={animatedProps} strokeWidth={1} />
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
