import { Path } from "react-native-svg";
import { Hsluv } from "./hsluv.mjs";
import dropShadow from "./dropShadow";
export default function SectorPath({
  hue,
  saturation,
  lightness,
  angle,
  startAngle,
  endAngle,
  innerRadius,
  outerRadius,
  style,
  strokeWidth = 0,
}) {
  function annulusSectorPath(
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle
  ) {
    // Convert angles from degrees to radians
    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;

    // Calculate the start and end points for the outer arc
    const x1 = cx + outerRadius * Math.cos(startRad);
    const y1 = cy + outerRadius * Math.sin(startRad);
    const x2 = cx + outerRadius * Math.cos(endRad);
    const y2 = cy + outerRadius * Math.sin(endRad);

    // Calculate the start and end points for the inner arc
    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);

    // Determine if the arc should be large (greater than 180 degrees)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    // Create the path string
    const path = `
                M ${x1} ${y1}                 
                A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} 
                L ${x3} ${y3}        
                A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}  
                Z                              
            `.trim();
    return path;
  }
  const hsluv = new Hsluv(hue, saturation, lightness);
  hsluv.hsluvToRgb();
  function rgbString() {
    if (hsluv.rgb_r < 0) {
      hsluv.rgb_r = 0;
    }
    if (hsluv.rgb_g < 0) {
      hsluv.rgb_g = 0;
    }
    if (hsluv.rgb_b < 0) {
      hsluv.rgb_b = 0;
    }
    if (hsluv.rgb_r > 1) {
      hsluv.rgb_r = 1;
    }
    if (hsluv.rgb_g > 1) {
      hsluv.rgb_g = 1;
    }
    if (hsluv.rgb_b > 1) {
      hsluv.rgb_b = 1;
    }

    return `rgb(${Math.round(hsluv.rgb_r * 255)}, ${Math.round(
      hsluv.rgb_g * 255
    )}, ${Math.round(hsluv.rgb_b * 255)})`;
  }
  return (
    <Path
      d={annulusSectorPath(
        outerRadius,
        outerRadius,
        innerRadius,
        outerRadius,
        angle ? 0 : startAngle,
        angle ? angle : endAngle
      )}
      fill={rgbString()}
      style={{
        ...style,
      }}
      strokeWidth={strokeWidth}
      stroke="black"
    />
  );
}
