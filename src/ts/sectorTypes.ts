import { SharedValue } from "react-native-reanimated";
import{  tCLARColor } from "./CLAcolor";

export type tSector = {
  radii?: [number, number];
  rc?: { rings: number; chords: number };
  arcLength?: number;
  sectorGroupID?: number;
};
export type tSectorGroup = tSector & {
  rotationR?: number;
  style?: any;
  selectedStyle?: any;
  sectors?: tSector[];
  children?: React.ReactNode;
  props?: any;
};