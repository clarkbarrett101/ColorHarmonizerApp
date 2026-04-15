import Svg, {
  FeDropShadow,
  FeGaussianBlur,
  Filter,
  G,
  Path,
  Rect,
} from "react-native-svg";
import { useRadialContext } from "./RadialContext";
import { Sector } from "./Sector";
import { tSector } from "./sectorTypes";

export type tSectorShadow = tSector & {
  elevation: number;
  rotationR?: number;
  zIndex?: number;
};
export const SectorShadow = ({
  arcLength = 44 / 7,
  radii = [20, 200],
  sectorGroupID = 0,
  elevation = 5,
  rotationR = 0,
  zIndex = -1,
}: tSectorShadow) => {
  const context = useRadialContext();
  const { fPathFunction, radii: contextRadii } = context;
  const path = fPathFunction
    ? fPathFunction(radii, arcLength, contextRadii[1])
    : "";
  return (
    <Svg
      width={radii[1] * 2}
      height={radii[1] * 2}
      viewBox={`-${radii[1] * 1.1} -${radii[1] * 1.1} ${radii[1] * 2.2} ${
        radii[1] * 2.2
      }`}
      style={{
        margin: -radii[1],
        transform: [{ rotate: `${rotationR || 0}rad` }],
        zIndex: zIndex,
      }}
    >
      <Filter id="filter">
        <FeGaussianBlur in="SourceAlpha" stdDeviation={10} />
      </Filter>
      <Path
        d={path}
        filter="url(#filter)"
        opacity={1}
        fill="black"
        stroke="black"
        strokeWidth={elevation}
      />
    </Svg>
  );
};
export const fMakeSectorBox = (
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
                L ${x2} ${y2} 
                L ${x3} ${y3}        
                L ${x4} ${y4}  
                Z                              
            `.trim();
  return path;
};
