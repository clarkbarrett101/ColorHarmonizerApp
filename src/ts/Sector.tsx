import React from "react";
import { Svg, Path, G } from "react-native-svg";
import { clark2RGB } from "./acl";
import { get } from "react-native/Libraries/NativeComponent/NativeComponentRegistry";
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
  color: [number, number, number];
};
const SectorComp = ({ angles, radii, color }: Sector) => {
  const path = MakeSectorPath(0, 0, radii[0], radii[1], angles[0], angles[1]);
  const [r, g, b] = clark2RGB(color[0], color[1], color[2]);
  const fill = `rgb(${r}, ${g}, ${b})`;
  return <Path d={path} fill={fill} />;
};
function ColorRange(
  chromas: [number, number],
  lightness: [number, number],
  angles: [number, number],
  steps: [number, number, number],
): [number, number, number][] {
  const chromaStep = (chromas[1] - chromas[0]) / steps[0];
  const lightnessStep = (lightness[1] - lightness[0]) / steps[1];
  const angleStep = (angles[1] - angles[0]) / steps[2];
  const colors = [];
  for (let k = 0; k < steps[2]; k++) {
    for (let j = 0; j < steps[1]; j++) {
      for (let i = 0; i < steps[0]; i++) {
        const chroma = chromas[0] + chromaStep * i;
        const light = lightness[0] + lightnessStep * j;
        const angle = angles[0] + angleStep * k;
        console.log(
          `Angle: ${angle}, Chroma: ${chroma.toFixed(2)}, Lightness: ${light.toFixed(2)}`,
        );
        colors.push([chroma, light, angle]);
      }
    }
  }
  return colors;
}
type SectorGrid = {
  rowLength: number;
  angles: [number, number];
  radii: [number, number];
  colors: [number, number, number][];
};
const SectorGridComp = ({ rowLength, angles, radii, colors }: SectorGrid) => {
  const sectors = () => {
    const angleStep = (angles[1] - angles[0]) / (colors.length / rowLength);
    const radiusStep = (radii[1] - radii[0]) / rowLength;
    let sectors = [];
    for (let i = 0; i < colors.length / rowLength; i++) {
      for (let j = 0; j < rowLength; j++) {
        console.log(
          `Creating sector with angles [${angles[0] + angleStep * i}, ${
            angles[0] + angleStep * (i + 1)
          }] and radii [${radii[0] + radiusStep * j}, ${
            radii[0] + radiusStep * (j + 1)
          }] and color rgb(${colors[i * rowLength + j].join(", ")})`,
        );
        sectors.push(
          <SectorComp
            key={`${i}-${j}`}
            radii={[radii[0] + radiusStep * j, radii[0] + radiusStep * (j + 1)]}
            angles={[
              angles[0] + angleStep * i,
              angles[0] + angleStep * (i + 1),
            ]}
            color={colors[i * rowLength + j]}
          />,
        );
      }
    }
    return sectors;
  };
  return <G>{sectors()}</G>;
};
export { SectorComp, SectorGridComp, ColorRange };
