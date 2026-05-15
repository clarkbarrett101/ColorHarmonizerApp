import React from "react";
import { DerivedValue, SharedValue } from "react-native-reanimated";
import { tCLARColor } from "./CLAcolor";
import { tSector, tSectorGroup } from "./sectorTypes";
import { tAttributeModifier } from "./Actor";

export const wDefaultAngleToChord = (
  angle: number,
  arcLength: number,
  chords: number,
  rotationOffset: number,
) => {
  "worklet";
  const adjustedAngle = angle - rotationOffset + arcLength / 2;
  const chord = Math.floor(adjustedAngle / (arcLength / chords));
  return chord;
};

export const wDefaultChordToAngle = (
  chord: number,
  arcLength: number,
  chords: number,
  rotationOffset: number,
) => {
  "worklet";
  return (chord + 0.5) * (arcLength / chords) + rotationOffset - arcLength / 2;
};

type tRadialContext = {
  origin?: [number, number];
  direction?: 1 | -1;
  radii?: [number, number];
  fPathFunction?: (
    radii: [number, number],
    arcLength: number,
    maxRadius: number,
  ) => string;
  wAngleToChord?: (
    angle: number,
    arcLength: number,
    chords: number,
    rotationOffset: number,
  ) => number;
  wChordToAngle?: (
    chord: number,
    arcLength: number,
    chords: number,
    rotationOffset: number,
  ) => number;
  dC?: DerivedValue<number>;
  dL?: DerivedValue<number>;
  dAR?: DerivedValue<number>;
  vRotationROffset?: SharedValue<number> | { value: number };
  transformModifier?: tAttributeModifier;
  vPanPos?: SharedValue<{ angle: number; radius: number }>;
  colorModifier?: tAttributeModifier;
  deps?: SharedValue<any>[];
  isSelected?: boolean;
  selectedRing?: number;
  wUpdateState?: () => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
};

const Ctx = React.createContext<tRadialContext>({
  origin: [0, 0],
  direction: 1,
  radii: [20, 200],
  fPathFunction: (radii, arcLength, maxRadius) => "",
  wAngleToChord: wDefaultAngleToChord,
  wChordToAngle: wDefaultChordToAngle,
  vRotationROffset: { value: 0 },
  transformModifier: null,
  vPanPos: undefined,
  colorModifier: null,
  isSelected: false,
  selectedRing: 0,
  wUpdateState: () => {},
  collapsed: false,
  setCollapsed: () => {},
});
export const useRadialContext = () => React.useContext(Ctx);
export const RadialContext = ({
  children,
  value,
}: {
  children: React.ReactNode;
  value?: tRadialContext;
}) => {
  const context = useRadialContext();
  return (
    <Ctx.Provider
      value={{
        origin: [0, 0],
        direction: 1,
        radii: [20, 200],
        fPathFunction: (radii, arcLength, maxRadius) => "",
        wAngleToChord: wDefaultAngleToChord,
        wChordToAngle: wDefaultChordToAngle,
        dAR: undefined,
        dC: undefined,
        dL: undefined,
        vRotationROffset: { value: 0 },
        transformModifier: null,
        vPanPos: undefined,
        colorModifier: null,
        isSelected: false,
        selectedRing: 0,
        wUpdateState: () => {},
        collapsed: false,
        setCollapsed: () => {},

        ...context,
        ...value,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};
