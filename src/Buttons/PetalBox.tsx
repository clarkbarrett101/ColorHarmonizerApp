import { SharedValue } from "react-native-reanimated";
import { Path, Text } from "react-native-svg";
import { useUserContext } from "../Contexts/UserContext";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { fCLARColorToRGB } from "../utils/CLAcolor";
import { SectorGroup } from "../Radials/SectorGroup";
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
