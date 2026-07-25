import { SharedValue } from "react-native-reanimated";
import { tCLARColor } from "../utils/CLAcolor";
import { ReactNode } from "react";

export type tRadialObject = {
  radii?: [number, number];
  ring?: number;
  chord?: number;
  rotationR?: number;
  arcLength?: number;
  origin?: [number, number];
  layer?: number;
};

export type tSector = tRadialObject & {
  sectorGroupID?: number;
  rgb?: [number, number, number];
};
export type tSectorGroup = tSector & {
  sectors?: tSector[];
  children?: ReactNode[];
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
  rotationR: number = 0,
  bend: number = 0.5,
): string => {
  const endRad = arcLength / 2;
  let x1 = maxRadius * Math.cos(endRad) - (maxRadius - radii[1]);
  let x2 = maxRadius * Math.cos(-endRad) - (maxRadius - radii[1]);
  let y1 = maxRadius * Math.sin(endRad);
  let y2 = maxRadius * Math.sin(-endRad);
  let x3 = x2 - (radii[1] - radii[0]);
  let x4 = x1 - (radii[1] - radii[0]);
  let y3 = y2;
  let y4 = y1;
  x1 = x1 * Math.cos(rotationR) - y1 * Math.sin(rotationR);
  y1 = x1 * Math.sin(rotationR) + y1 * Math.cos(rotationR);
  x2 = x2 * Math.cos(rotationR) - y2 * Math.sin(rotationR);
  y2 = x2 * Math.sin(rotationR) + y2 * Math.cos(rotationR);
  x3 = x3 * Math.cos(rotationR) - y3 * Math.sin(rotationR);
  y3 = x3 * Math.sin(rotationR) + y3 * Math.cos(rotationR);
  x4 = x4 * Math.cos(rotationR) - y4 * Math.sin(rotationR);
  y4 = x4 * Math.sin(rotationR) + y4 * Math.cos(rotationR);
  const largeArcFlag = arcLength <= 22 / 7 ? "0" : "1";
  const path = `
                  M ${x1} ${y1}                 
                  A ${maxRadius * bend} ${maxRadius * bend} 0 ${largeArcFlag} 0 ${x2} ${y2} 
                  L ${x3} ${y3} 
                  A ${maxRadius * bend} ${maxRadius * bend}  0 ${largeArcFlag} 0 ${x4} ${y4}
                  Z  
              `.trim();
  return path;
};
