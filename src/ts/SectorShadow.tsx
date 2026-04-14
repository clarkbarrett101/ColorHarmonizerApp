import { useRadialContext } from "./RadialContext";
import { tSector } from "./sectorTypes";

export type tSectorShadow = tSector & {
  elevation: number;
};
