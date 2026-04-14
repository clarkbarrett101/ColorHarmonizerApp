import React from "react";
import { DerivedValue, SharedValue } from "react-native-reanimated";
import { CLARColor, tCLARColor } from "./CLAcolor";
import { tSector, tSectorGroup } from "./sectorTypes";

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
  vSelectColor?: SharedValue<tCLARColor>;
  setSelectColor?: (color: tCLARColor) => void;
  vRotationROffset?: SharedValue<number> | { value: number };
  wTransformMatrix?: (
    src: { rings: number; chords: number },
    rotationR: number,
  ) => {
    vT: { x: number; y: number };
    vR: number;
    vS: number;
  };
  vPanPos?: SharedValue<{ angle: number; radius: number }>;
  wGetColor?: (rc: { rings: number; chords: number }) => tCLARColor;
  wGetZIndex?: (rc: { rings: number; chords: number }) => number;
};

const Ctx = React.createContext<tRadialContext>({
  origin: [0, 0],
  direction: 1,
  radii: [20, 200],
  fPathFunction: (radii, arcLength, maxRadius) => "",
  wAngleToChord: wDefaultAngleToChord,
  wChordToAngle: wDefaultChordToAngle,
  vSelectColor: undefined,
  setSelectColor: () => {},
  vRotationROffset: { value: 0 },
  wTransformMatrix: () => ({ vT: { x: 0, y: 0 }, vR: 0, vS: 1 }),
  vPanPos: undefined,
  wGetColor: () => ({ c: 0, l: 0, ar: 0 }),
  wGetZIndex: () => 0,
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
        vSelectColor: undefined,
        setSelectColor: () => {},
        vRotationROffset: { value: 0 },
        wTransformMatrix: () => ({ vT: { x: 0, y: 0 }, vR: 0, vS: 1 }),
        vPanPos: undefined,
        wGetColor: () => ({ c: 0, l: 0, ar: 0 }),
        wGetZIndex: () => 0,
        ...context,
        ...value,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};
