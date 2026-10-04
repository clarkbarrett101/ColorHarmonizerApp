import Animated, {
  SharedValue,
  useAnimatedProps,
  useDerivedValue,
} from "react-native-reanimated";
import Svg, { Path, Text } from "react-native-svg";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { fCLARColorToRGB } from "../utils/CLAcolor";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { RadialContext } from "../Radials/RadialContext";
import { tRadialObject, tSectorGroup } from "../Radials/SectorTypes";
export type tPetalBox = tRadialObject & {
  children?: React.ReactNode[] | React.ReactNode;
  dC?: SharedValue<number>;
  dL?: SharedValue<number>;
  dAR?: SharedValue<number>;
  mTransformModifier?: tAttributeModifier;
  opacity?: number;
};
export function PetalBox({
  origin,
  rotationR = 0,
  layer = 0,
  opacity = 1,
  dC,
  dL,
  dAR,
  arcLength = 2 / 7,
  radii = [0, 50],
  children,
  mTransformModifier,
}: tPetalBox) {
  const { vAccentC, vAccentL, vAccentAR, vColorModel } = useUserContext();
  const chroma = dC ?? vAccentC.shared;
  const lightness = dL ?? vAccentL.shared;
  const angleRatio = dAR ?? vAccentAR.shared;
  function fSectorGroupModifier(group: tSectorGroup): tSectorGroup {
    return {
      ...group,
      children: Array.isArray(children) ? children : [children],
      layer,
      opacity,
    };
  }
  const mColorModifier: tAttributeModifier = {
    modID: 0,
    deps: [chroma, lightness, angleRatio],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let [r, g, b] = fCLARColorToRGB(
        { c: chroma.value, l: lightness.value, ar: angleRatio.value },
        vColorModel.shared.value,
      );
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
        alpha: opacity,
      };
    },
  };
  return (
    <RadialContext
      value={{
        mColorModifier,
        mTransformModifier,
      }}
    >
      <RadialGraphic
        radii={radii}
        origin={origin}
        rotationR={rotationR}
        fSectorGroupModifier={fSectorGroupModifier}
        ring={1}
        chord={1}
        arcLength={arcLength}
      />
    </RadialContext>
  );
}
const AnimatedPath = Animated.createAnimatedComponent(Path);
export function PetalBoxSimple({
  dC,
  dL,
  dAR,
  children,
  opacity = 1,
  vOpacity,
  origin,
  size = [100, 100],
  rotationR = 0,
  layer = eLayers.buckets,
  viewBox = [35, 14],
}: tPetalBox & {
  size?: [number, number];
  viewBox?: [number, number];
  vOpacity?: SharedValue<number>;
}) {
  const { vAccentC, vAccentL, vAccentAR, vColorModel } = useUserContext();
  const chroma = dC ?? vAccentC.shared;
  const lightness = dL ?? vAccentL.shared;
  const angleRatio = dAR ?? vAccentAR.shared;
  const dColor = useDerivedValue(() => {
    return fCLARColorToRGB(
      { c: chroma.value, l: lightness.value, ar: angleRatio.value },
      vColorModel.shared.value,
    );
  });
  const animatedColor = useAnimatedProps(() => {
    const [r, g, b] = dColor.value;
    return {
      fill: `rgba(${r}, ${g}, ${b}, ${vOpacity?.value ?? opacity})`,
    };
  });
  const [width, height] = viewBox;
  const path = `m-${width / 2}-${height / 2}a${width * 1.5} ${height * 1.5} 0 01${width} 0v${height}a${width * 1.5} ${height * 1.5} 0 01-${width} 0z`;

  return (
    <Svg
      style={{
        top: origin[1] - size[0] / 2,
        left: origin[0] - size[1] / 2,
        position: "absolute",
        shadowColor: "#000",
        shadowOffset: { width: -2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        zIndex: layer,
      }}
      viewBox={`-${(1.2 * width) / 2} -${(1.2 * height) / 2} ${1.2 * width} ${1.2 * height}`}
      width={size[0]}
      height={size[1]}
      pointerEvents="none"
    >
      <AnimatedPath
        d={path}
        animatedProps={animatedColor}
        transform={[{ rotate: rotationR + "rad" }]}
      />
      {children}
    </Svg>
  );
}
