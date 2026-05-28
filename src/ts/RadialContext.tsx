import React from "react";
import { DerivedValue, SharedValue } from "react-native-reanimated";
import { tCLARColor } from "./CLAcolor";
import { tSector, tSectorGroup, fMakePetalPath } from "./sectorTypes";
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

export type tRadialContext = {
  origin?: [number, number];
  radii?: [number, number];
  totalArcLength?: number;
  mainRotationR?: number;
  totalRings?: number;
  totalChords?: number;
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
  mTransformModifier?: tAttributeModifier;
  vPanPos?: SharedValue<{ angle: number; radius: number }>;
  mColorModifier?: tAttributeModifier;
  wUpdateState?: () => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
};

const Ctx = React.createContext<tRadialContext>({
  origin: [0, 0],
  radii: [20, 200],
  totalArcLength: 11 / 7,
  mainRotationR: 0,
  totalRings: 4,
  totalChords: 6,
  fPathFunction: (radii, arcLength, maxRadius) =>
    fMakePetalPath(radii, arcLength, maxRadius),
  wAngleToChord: wDefaultAngleToChord,
  wChordToAngle: wDefaultChordToAngle,
  vRotationROffset: { value: 0 },
  mTransformModifier: null,
  vPanPos: undefined,
  mColorModifier: null,
  wUpdateState: () => {},
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
        ...context,
        ...value,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};
