import { SharedValue } from "react-native-reanimated";
import{ CLARColor, tCLARColor } from "./CLAcolor";

export type tSector = {
  radii?: [number, number];
  rc?: { rings: number; chords: number };
  arcLength?: number;
  sectorGroupID?: number;
  pathFunction?: (sector: tSector) => string;
};
export type tSectorGroup = tSector & {
  rotationR?: number;
  direction?: 1 | -1;
  style?: any;
  sectors?: tSector[];
  children?: React.ReactNode;
  props?: any;
};