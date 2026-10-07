import { Dimensions } from "react-native";
import {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
  Svg,
} from "react-native-svg";
import { RadialContext } from "./Radials/RadialContext";
import { RadialGraphic } from "./Radials/RadialGraphic";
import { tSector, tSectorGroup } from "./Radials/SectorTypes";
import { fCLARColorToRGB } from "./utils/CLAcolor";
import { tAttributeModifier, tAttributeMap } from "./utils/Actor";
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

export default function Icon() {
  function fSectorModifier(sector: tSector) {
    const rgb = fCLARColorToRGB(
      {
        c: (sector.ring / (5 - 1)) * 0.45 + 0.45,

        l: (sector.ring / (5 - 1)) * 0.4 + 0.4,
        ar: (sector.chord / 5) * (44 / 7) - 7 / 7,
      },
      "RYGB",
    );
    return {
      ...sector,
      rgb,
    };
  }
  function fSectorGroupModifier(sectorGroup: tSectorGroup) {
    return {
      ...sectorGroup,
      layer: 3 - Math.abs(sectorGroup.chord - 2),
      origin: [500 + (sectorGroup.chord - 2) * 40, 950],
    };
  }
  const mTransformModifier: tAttributeModifier = {
    modID: 3,
    deps: [],
    modifier: (input: tAttributeMap): tAttributeMap => {
      "worklet";
      const [r, g, b] = fCLARColorToRGB(
        {
          c: 0.5,

          l: 0.3,
          ar: (input.chord / 5) * (44 / 7) - 7 / 7,
        },
        "RYGB",
      );
      return {
        ...input,
        translateY: (3 - Math.abs(input.chord - 2)) ** 1.5 * -20,
        scaleX: ((3 - Math.abs(input.chord - 2)) / 3) * 0.2 + 0.8,
        scaleY: ((3 - Math.abs(input.chord - 2)) / 3) * 0.2 + 0.8,
        shadowRadius: 20,
        shadowX: 10,
        shadowY: 20,
        shadowColor: b | (g << 8) | (r << 16),
      };
    },
  };
  return (
    <>
      <Svg
        style={{
          width: 1000,
          height: 1000,
          top: 100,
          zIndex: 0,
        }}
        viewBox="0 0 100 100"
      >
        <Defs>
          <RadialGradient id="grad" cx=".5" cy=".8" r={1}>
            <Stop offset="0%" stopColor="rgb(125,20,255)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgb(25,175,225)" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#grad)" />
      </Svg>
      <RadialContext
        value={{
          radii: [0, 700],
          totalArcLength: 11 / 7,
          totalChords: 5,
          totalRings: 5,
          origin: [500, 950],
          mainRotationR: 33 / 7,
          mTransformModifier,
        }}
      >
        <RadialGraphic
          fSectorModifier={fSectorModifier}
          fSectorGroupModifier={fSectorGroupModifier}
        />
      </RadialContext>
    </>
  );
}
