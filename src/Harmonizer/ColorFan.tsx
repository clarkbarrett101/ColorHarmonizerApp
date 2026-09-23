import { eLayers, useUserContext } from "../Contexts/UserContext";
import { RadialContext } from "../Radials/RadialContext";
import { RadialGraphic } from "../Radials/RadialGraphic";
import {
  fMakePetalPath,
  tRadialObject,
  tSector,
  tSectorGroup,
} from "../Radials/SectorTypes";
import { fCLARColorToRGB, tColorModel } from "../utils/CLAcolor";
import { Dimensions } from "react-native";

export type tColorFan = tRadialObject & {
  hues: number[];
  bend?: number;
  chromaRange?: [number, number];
  lumaRange?: [number, number];
  customModel?: tColorModel;
  chordLength?: number;
};
export function ColorFan({
  arcLength = 15 / 7,
  radii = [300, 500],
  origin = [
    Dimensions.get("window").width + radii[0] / 2,
    Dimensions.get("window").height / 2,
  ],
  rotationR = 22 / 7,
  ring = 5,
  hues = [],
  bend = 0.5,
  chromaRange = [0.3, 0.7],
  lumaRange = [0.4, 0.9],
  customModel,
  chordLength = arcLength / hues.length,
  layer = eLayers.colorMixer,
}: tColorFan) {
  if (hues.length === 0) {
    console.warn(
      "ColorFan: hues array is empty. Please provide an array of hues.",
    );
    return null;
  }
  const { vColorModel } = useUserContext();
  function fSectorModifier(sector: tSector): tSector {
    const rgb = fCLARColorToRGB(
      {
        c:
          (sector.ring / (ring - 1)) * (chromaRange[1] - chromaRange[0]) +
          chromaRange[0],
        l:
          (sector.ring / (ring - 1)) * (lumaRange[1] - lumaRange[0]) +
          lumaRange[0],
        ar: hues[sector.chord % hues.length] ?? 0,
      },
      customModel ?? vColorModel.state,
    );
    return {
      ...sector,
      arcLength: chordLength,
      rgb,
      layer,
    };
  }
  return (
    <RadialContext
      value={{
        radii,
        origin,
        totalArcLength: arcLength,
        mainRotationR: rotationR,
        totalChords: hues.length,
        totalRings: ring,
        fPathFunction: (radii, arcLength, maxRadius, rotationR = 0) =>
          fMakePetalPath(radii, arcLength, maxRadius, rotationR, bend),
      }}
    >
      <RadialGraphic
        ring={ring}
        arcLength={arcLength}
        rotationR={rotationR}
        origin={origin}
        chord={hues.length}
        fSectorModifier={fSectorModifier}
      />
    </RadialContext>
  );
}
