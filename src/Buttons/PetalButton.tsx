import { View } from "react-native";
import { tRadialHitBox, usePanManager } from "../Contexts/PanManager";
import React, { useEffect } from "react";
import { RadialContext, useRadialContext } from "../Radials/RadialContext";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { tSectorGroup } from "../Radials/SectorTypes";
import { Text } from "react-native-svg";
import { fCLARColorToRGB } from "../utils/CLAcolor";
import { eLayers, useUserContext } from "../Contexts/UserContext";
export type tPetalButton = tRadialHitBox & {
  zIndex?: number;
  fontSize?: number;
};
export function PetalButton(props: tPetalButton) {
  const { id, origin, radii, rotationR, arcLength, zIndex } = props;
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const { dC, dL, dAR } = useRadialContext();
  useEffect(() => {
    registerHitBox({ ...props, radii: [radii[0] * 0.9, radii[1] * 0.9] });
    return () => {
      unregisterHitBox(id);
    };
  }, [props]);
  function fSectorGroupModifier(group: tSectorGroup): tSectorGroup {
    const words = id.split(" ");
    return {
      ...group,
      children: words.map((word, index) => (
        <Text
          fontFamily="Outfit"
          x={-radii[1] * 0.95}
          y={index * 24 - (words.length / 2) * 12}
          fontSize={props.fontSize ?? 24}
          key={index}
          transform={[{ scale: -1 }]}
          fill={`rgba(0,0,0,.75)`}
        >
          {word}
        </Text>
      )),
      sectorGroupID: zIndex,
    };
  }
  const { vColorModel } = useUserContext();
  const mColorModifier = {
    modID: 0,
    deps: [dC, dL, dAR],
    modifier: (input) => {
      "worklet";
      let [r, g, b] = fCLARColorToRGB(
        {
          c: dC.value,
          l: dL.value,
          ar: dAR.value,
        },
        vColorModel.shared.value,
      );
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  const mTransformModifier = {
    modID: 1,
    deps: [],
    modifier: (input) => {
      "worklet";
      return {
        ...input,
        zIndex,
      };
    },
  };
  return (
    <RadialContext
      value={{
        mColorModifier,
        mTransformModifier,
        radii,
      }}
    >
      <RadialGraphic
        ring={1}
        chord={1}
        arcLength={arcLength}
        rotationR={rotationR}
        radii={radii}
        fSectorGroupModifier={fSectorGroupModifier}
      />
    </RadialContext>
  );
}
