import React from "react";
import { DerivedValue, SharedValue } from "react-native-reanimated";
import { CLARColor, tCLARColor } from "./CLAcolor";
import { tSector, tSectorGroup } from "./sectorTypes";

export const fDefaultAngleToChord = (
  angle: number,
  arcLength: number,
  chords: number,
  rotation: number,
) => {
  const adjustedAngle = angle - rotation + arcLength / 2;
  const chord = Math.floor(adjustedAngle / (arcLength / chords));
  return chord;
};

export const fDefaultChordToAngle = (
  chord: number,
  arcLength: number,
  chords: number,
  rotation: number,
) => {
  return (chord + 0.5) * (arcLength / chords) + rotation - arcLength / 2;
};

type tRadialContext = {
  origin?: [number, number];
  direction?: 1 | -1;
  radii?: [number, number];
  pathFunction?: (
    radii: [number, number],
    arcLength: number,
    maxRadius: number,
  ) => string;
  angleToChord?: (
    angle: number,
    arcLength: number,
    chords: number,
    rotation: number,
  ) => number;
  chordToAngle?: (
    chord: number,
    arcLength: number,
    chords: number,
    rotation: number,
  ) => number;
  selectColor?: SharedValue<tCLARColor>;
  setSelectColor?: (color: tCLARColor) => void;
  rotationROffset?: SharedValue<number> | { value: number };
  offset?: (src: { rings: number; chords: number }, rotation: number) => number;
  panPos?: SharedValue<{ angle: number; radius: number }>;
  getColor?: (rc: { rings: number; chords: number }) => tCLARColor;
};

const Ctx = React.createContext<tRadialContext>({
  origin: [0, 0],
  direction: 1,
  radii: [20, 200],
  pathFunction: (radii, arcLength, maxRadius) => "",
  angleToChord: fDefaultAngleToChord,
  chordToAngle: fDefaultChordToAngle,
  selectColor: undefined,
  setSelectColor: () => {},
  rotationROffset: { value: 0 },
  offset: () => 0,
  panPos: undefined,
  getColor: () => ({ c: 0, l: 0, ar: 0 }),
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
        pathFunction: (radii, arcLength, maxRadius) => "",
        angleToChord: fDefaultAngleToChord,
        chordToAngle: fDefaultChordToAngle,
        selectColor: undefined,
        setSelectColor: () => {},
        rotationROffset: { value: 0 },
        offset: () => 0,
        panPos: undefined,
        getColor: () => ({ c: 0, l: 0, ar: 0 }),
        ...context,
        ...value,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};
