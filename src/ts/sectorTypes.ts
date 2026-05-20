import { SharedValue } from "react-native-reanimated";
import{  tCLARColor } from "./CLAcolor";
import { ReactNode } from "react";

export type tRadialObject = {
  radii?: [number, number];
  ring?: number;
  chord?: number;
  rotationR?: number;
  arcLength?: number;
  origin?: [number, number];
};

export type tSector = tRadialObject & {
  sectorGroupID?: number;
};
export type tSectorGroup = tSector & {
  sectors?: tSector[];
  children?: ReactNode[];
};