import Animated, {
  DerivedValue,
  SharedValue,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { CLAColor } from "./CLAcolor";
import Svg, { Filter, Path, FeDropShadow } from "react-native-svg";
import { useEffect } from "react";
import { get } from "react-native/Libraries/NativeComponent/NativeComponentRegistry";

type tSector = {
  color?: CLAColor;
  radii?: [number, number];
  rc?: { rings: number; chords: number };
  arcLength?: number;
  sectorGroupID?: number;
  maxRadius?: number;
};
const Sector = ({
  arcLength = 360,
  radii = [20, 200],
  color,
  sectorGroupID = 0,
  maxRadius = radii[1],
  rc = { rings: 5, chords: 18 },
}: tSector) => {
  const path = fMakePetalPath({
    arcLength,
    radii,
    maxRadius,
    rc,
  });
  const fill = color ? color.toString() : "transparent";
  return <Path d={path} fill={fill} stroke={fill} strokeWidth={1} />;
};
function fMakeSectorPath({ radii, arcLength }: tSector): string {
  const startRad = ((Math.PI / 180) * -arcLength) / 2;
  const endRad = ((Math.PI / 180) * arcLength) / 2;
  const x1 = radii[1] * Math.cos(startRad);
  const y1 = radii[1] * Math.sin(startRad);
  const x2 = radii[1] * Math.cos(endRad);
  const y2 = radii[1] * Math.sin(endRad);
  const x3 = radii[0] * Math.cos(endRad);
  const y3 = radii[0] * Math.sin(endRad);
  const x4 = radii[0] * Math.cos(startRad);
  const y4 = radii[0] * Math.sin(startRad);
  const largeArcFlag = arcLength <= 180 ? "0" : "1";
  const path = `
                M ${x1} ${y1}                 
                A ${radii[1]} ${radii[1]} 0 ${largeArcFlag} 1 ${x2} ${y2} 
                L ${x3} ${y3}        
                A ${radii[0]} ${radii[0]} 0 ${largeArcFlag} 0 ${x4} ${y4}  
                Z                              
            `.trim();
  return path;
}
function fMakePetalPath({ maxRadius, radii, arcLength }: tSector): string {
  const endRad = ((Math.PI / 180) * arcLength) / 2;
  const x1 = maxRadius * Math.cos(endRad) - (maxRadius - radii[1]);
  const x2 = maxRadius * Math.cos(-endRad) - (maxRadius - radii[1]);
  const y1 = maxRadius * Math.sin(endRad);
  const y2 = maxRadius * Math.sin(-endRad);
  const x3 = x2 - (radii[1] - radii[0]);
  const x4 = x1 - (radii[1] - radii[0]);
  const y3 = y2;
  const y4 = y1;
  const largeArcFlag = arcLength <= 180 ? "0" : "1";
  const path = `
                  M ${x1} ${y1}                 
                  A ${radii[1]} ${radii[1]}  0 ${largeArcFlag} 0 ${x2} ${y2} 
                  L ${x3} ${y3} 
                  A ${radii[0]} ${radii[1]}  0 ${largeArcFlag} 1 ${x4} ${y4}       
                  Z                              
              `.trim();
  return path;
}
const AnimatedSvg = Animated.createAnimatedComponent(Svg);
type tSelectionRange = {
  angle: number | [number, number];
  radial?: number | [number, number];
};
type tSectorGroup = tSector & {
  rotation?: number;
  rotationOffset?: SharedValue<number> | { value: number };
  direction?: 1 | -1;
  style?: any;
  sectors?: tSector[];
  children?: React.ReactNode;
  props?: any;
  selection?: DerivedValue<[number, number]> | { value: [number, number] };
  offsetMultiplier?: number;
};
const SectorGroup = ({
  rotation = 0,
  direction = 1,
  sectors = [],
  children = null,
  props = {},
  rotationOffset,
  style = {},
  maxRadius = 200,
  selection,
  offsetMultiplier = 0,
}: tSectorGroup) => {
  const distanceFromSelected = useDerivedValue(() => {
    let rot = [
      Math.sin((rotation / 180) * Math.PI),
      Math.cos((rotation / 180) * Math.PI),
    ];
    let selectionRange = [
      [
        Math.sin((selection.value[0] / 180) * Math.PI),
        Math.cos((selection.value[0] / 180) * Math.PI),
      ],
      [
        Math.sin((selection.value[1] / 180) * Math.PI),
        Math.cos((selection.value[1] / 180) * Math.PI),
      ],
    ];
    let selectionMid = [
      (selectionRange[0][0] + selectionRange[1][0]) / 2,
      (selectionRange[0][1] + selectionRange[1][1]) / 2,
    ];
    let dotProduct = rot[0] * selectionMid[0] + rot[1] * selectionMid[1];
    dotProduct /=
      Math.sqrt(rot[0] * rot[0] + rot[1] * rot[1]) *
      Math.sqrt(
        selectionMid[0] * selectionMid[0] + selectionMid[1] * selectionMid[1],
      );
    let selectionWidth =
      selectionRange[0][0] * selectionMid[0] +
      selectionRange[0][1] * selectionMid[1];
    let distanceFromSelected =
      Math.max(0, dotProduct - selectionWidth) / (1 - selectionWidth);

    return distanceFromSelected;
  }, [rotationOffset, rotation, selection]);

  const animatedProps = useAnimatedProps(
    () => ({
      transform: [
        {
          rotate: `${-rotationOffset?.value * direction + rotation}deg`,
        },
        {
          translateX: distanceFromSelected.value * offsetMultiplier,
        },
      ],
    }),
    [rotationOffset, offsetMultiplier],
  );
  return (
    <AnimatedSvg
      {...props}
      animatedProps={animatedProps}
      width={maxRadius * 2}
      height={maxRadius * 2}
      viewBox={`-${maxRadius} -${maxRadius} ${maxRadius * 2} ${maxRadius * 2}`}
      style={{
        margin: -maxRadius,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        ...style,
      }}
    >
      {sectors?.map((sector, index) => (
        <Sector {...sector} key={index} />
      ))}
      {children}
    </AnimatedSvg>
  );
};

export { tSector, Sector, tSectorGroup, SectorGroup, tSelectionRange };
