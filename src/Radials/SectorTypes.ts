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
  opacity?: number;
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

export type tPetalSizeOptions = {
  rotationR?: number;
  bend?: number;
  innerRadius?: number;
  maxRadius?: number;
};

export const fMakePetalPathFromSize = (
  width: number,
  height: number,
  options: tPetalSizeOptions = {},
): string => {
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);
  if (safeWidth === 0 || safeHeight === 0) {
    return "";
  }

  const innerRadius = Math.max(0, options.innerRadius ?? 0);
  const outerRadius = innerRadius + safeWidth;

  // Keep maxRadius large enough so the requested tip-to-tip height is feasible.
  const computedMaxRadius = options.maxRadius ?? outerRadius;
  const maxRadius = Math.max(safeHeight / 2, computedMaxRadius);
  const chordRatio = Math.min(1, safeHeight / (2 * maxRadius));
  const arcLength = 2 * Math.asin(chordRatio);

  return fMakePetalPath(
    [innerRadius, outerRadius],
    arcLength,
    maxRadius,
    options.rotationR ?? 0,
    options.bend ?? 0.5,
  );
};

export const fMakeGeneralPetalPath = (
  width: number,
  height: number,
  bendDegree: number = 0.5,
  rotationR: number = 0,
  origin: [number, number] = [0, 0],
): string => {
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);
  if (safeWidth === 0 || safeHeight === 0) {
    return "";
  }

  const halfW = safeWidth / 2;
  const halfH = safeHeight / 2;
  const bend = Math.min(1, Math.max(0, bendDegree));

  // Bend changes control-point placement only, so cusp distance and bbox stay fixed.
  const controlX = halfW * (0.25 + 0.75 * bend);
  const controlInsetY = halfH * 0.7 * (1 - bend);

  const top: [number, number] = [0, -halfH];
  const rightMid: [number, number] = [halfW, 0];
  const bottom: [number, number] = [0, halfH];
  const leftMid: [number, number] = [-halfW, 0];

  const c1: [number, number] = [controlX, -halfH + controlInsetY];
  const c2: [number, number] = [controlX, halfH - controlInsetY];
  const c3: [number, number] = [-controlX, halfH - controlInsetY];
  const c4: [number, number] = [-controlX, -halfH + controlInsetY];

  const transformPoint = (point: [number, number]): [number, number] => {
    const [x, y] = point;
    const cosR = Math.cos(rotationR);
    const sinR = Math.sin(rotationR);
    const rx = x * cosR - y * sinR;
    const ry = x * sinR + y * cosR;
    return [rx + origin[0], ry + origin[1]];
  };

  const [tX, tY] = transformPoint(top);
  const [rmX, rmY] = transformPoint(rightMid);
  const [bX, bY] = transformPoint(bottom);
  const [lmX, lmY] = transformPoint(leftMid);
  const [c1x, c1y] = transformPoint(c1);
  const [c2x, c2y] = transformPoint(c2);
  const [c3x, c3y] = transformPoint(c3);
  const [c4x, c4y] = transformPoint(c4);

  const path = `
                M ${tX} ${tY}
                Q ${c1x} ${c1y} ${rmX} ${rmY}
                Q ${c2x} ${c2y} ${bX} ${bY}
                Q ${c3x} ${c3y} ${lmX} ${lmY}
                Q ${c4x} ${c4y} ${tX} ${tY}
                Z
            `.trim();

  return path;
};
