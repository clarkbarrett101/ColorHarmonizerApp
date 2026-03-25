import React from "react";
import { Svg, Path, G } from "react-native-svg";
import { acl } from "./acl";
function MakeSectorPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const startRad = (Math.PI / 180) * startAngle;
  const endRad = (Math.PI / 180) * endAngle;
  const x1 = cx + outerRadius * Math.cos(startRad);
  const y1 = cy + outerRadius * Math.sin(startRad);
  const x2 = cx + outerRadius * Math.cos(endRad);
  const y2 = cy + outerRadius * Math.sin(endRad);
  const x3 = cx + innerRadius * Math.cos(endRad);
  const y3 = cy + innerRadius * Math.sin(endRad);
  const x4 = cx + innerRadius * Math.cos(startRad);
  const y4 = cy + innerRadius * Math.sin(startRad);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const path = `
                M ${x1} ${y1}                 
                A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} 
                L ${x3} ${y3}        
                A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}  
                Z                              
            `.trim();
  return path;
}
type Sector = {
  angles: [number, number];
  radii: [number, number];
  color: acl;
};
const SectorComp = ({ angles, radii, color }: Sector) => {
  const path = MakeSectorPath(0, 0, radii[0], radii[1], angles[0], angles[1]);
  const { r, g, b } = color.toRGB();
  const fill = `rgb(${r}, ${g}, ${b})`;
  return <Path d={path} fill={fill} />;
};
type colorRange = {
  hue: [number, number];
  saturation: [number, number];
  lightness: [number, number];
  dimensions: [number, number, number];
};
type SectorGrid = {
  angles: [number, number];
  radii: [number, number];
  colors?: [number, number, number][][];
  colorRange?: colorRange;
};
const SectorGridComp = ({ angles, radii, colors, colorRange }: SectorGrid) => {
  let colorMatrix: [number, number, number][][] = [];
  if (colorRange) {
    const hueStep =
      (colorRange.hue[1] - colorRange.hue[0]) / (colorRange.dimensions[0] - 1);
    const satStep =
      (colorRange.saturation[1] - colorRange.saturation[0]) /
      (colorRange.dimensions[1] - 1);
    const lightStep =
      (colorRange.lightness[1] - colorRange.lightness[0]) /
      (colorRange.dimensions[2] - 1);
    for (let i = 0; i < colorRange.dimensions[0]; i++) {
      colorMatrix[i] = [];
      for (let j = 0; j < colorRange.dimensions[1]; j++) {
        for (let k = 0; k < colorRange.dimensions[2]; k++) {
          const h = colorRange.hue[0] + i * hueStep;
          const s = colorRange.saturation[0] + j * satStep;
          const l = colorRange.lightness[0] + k * lightStep;
          const color = new acl(h, s, l);
          const { r, g, b } = color.toRGB();
          colorMatrix[i][j] = [r, g, b];
        }
      }
    }
  } else {
    colorMatrix = colors!;
  }
  const sectors = () => {
    let sectors = [];
    const radiusPerRow = (radii[1] - radii[0]) / colorMatrix.length;
    const anglePerSector = (angles[1] - angles[0]) / colorMatrix[0].length;
    for (let i = 0; i < colorMatrix.length; i++) {
      for (let j = 0; j < colorMatrix[i].length; j++) {
        const sectorStartAngle = angles[0] + j * anglePerSector;
        const sectorEndAngle = sectorStartAngle + anglePerSector;
        const sectorInnerRadius = radii[0] + i * radiusPerRow;
        const sectorOuterRadius = sectorInnerRadius + radiusPerRow;
        sectors.push(
          <SectorComp
            key={`${i}-${j}`}
            radii={[sectorInnerRadius, sectorOuterRadius]}
            angles={[sectorStartAngle, sectorEndAngle]}
            color={
              new acl(
                (colorMatrix[i][j][0] / 255) * 360,
                (colorMatrix[i][j][1] / 255) * 100,
                (colorMatrix[i][j][2] / 255) * 100,
              )
            }
          />,
        );
      }
    }
    return sectors;
  };
  return <G>{sectors()}</G>;
};
export { SectorComp, SectorGridComp };
