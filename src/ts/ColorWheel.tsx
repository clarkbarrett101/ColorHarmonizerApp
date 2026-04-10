import { View, Dimensions, PanResponder } from "react-native";
import { CLARColor, tCLARColor } from "./CLAcolor";
import {
  RadialGraphic,
  tColorRange,
  fGetColorsFromGrid,
} from "./RadialGraphic";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { fMakePetalPath } from "./Sector";
import { tSectorGroup } from "./sectorTypes";
import {
  DerivedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { usePanManager } from "./PanManager";
import { RadialContext, useRadialContext } from "./RadialContext";
import { SharedValue } from "react-native-gesture-handler/lib/typescript/v3/types";
type tColorWheel = {
  radii?: [number, number];
  rc?: { rings: number; chords: number };
  rotationROffset?: SharedValue<number>;
};
function ColorWheel({
  radii = [20, 200],
  rc = { rings: 5, chords: 18 },
  rotationROffset,
}: tColorWheel) {
  const arcLength = 43.9 / 7;
  const rotationR = 22 / 7;
  const context = useRadialContext();
  const {
    origin,
    direction,
    angleToChord,
    chordToAngle,
    selectColor,
    setSelectColor,
  } = context;
  const [selectedSector, setSelectedSector] = useState(0);

  const getColor = useCallback((src: { rings: number; chords: number }) => {
    "worklet";
    const rdc = Math.pow(0.5, 1 / Math.max(rc.rings - 1, 1));
    const rdl = Math.pow(0.5, 1 / Math.max(rc.rings - 1, 1));
    let c = Math.pow(rdc, rc.rings - 1 - src.rings) * selectColor.value.c;
    let l = Math.pow(rdl, rc.rings - 1 - src.rings) * selectColor.value.l;
    let ar = (src.chords / rc.chords) * (44 / 7);
    return { c, l, ar };
  }, []);

  const groupModifier = useMemo(() => {
    return (group: tSectorGroup) => {
      group.style = {
        zIndex: (group.sectorGroupID - selectedSector + rc.chords) % rc.chords,
      };
      return group;
    };
  }, [selectedSector]);

  const onLeave = () => {
    let nearestSectorAngle = chordToAngle(
      angleToChord(rotationROffset.value, arcLength, rc.chords, rotationR),
      arcLength,
      rc.chords,
      rotationR,
    );
    const adjustedAngle = ((nearestSectorAngle % (44 / 7)) + 44 / 7) % (44 / 7);
    const selectedSector = angleToChord(
      adjustedAngle,
      arcLength,
      rc.chords,
      rotationR,
    );
    setSelectedSector(selectedSector);
    setSelectColor({
      c: selectColor.value.c,
      l: selectColor.value.l,
      ar: adjustedAngle,
    });
    console.log(
      "Selected sector:",
      selectedSector,
      adjustedAngle.toFixed(2),
      nearestSectorAngle.toFixed(2),
      rotationROffset.value.toFixed(2),
      selectColor.value.c,
    );
    rotationROffset.value = withTiming(nearestSectorAngle, {
      duration: 300,
    });
  };
  const panPos = useSharedValue({ angle: 0, radius: 0 });

  const { registerZone } = usePanManager();
  useEffect(() => {
    registerZone({
      onLeave,
      radii,
      rotationR,
      arcLength,
      panPos,
      drag: rotationROffset,
      origin: origin,
      travelLimit: arcLength / rc.chords,
    });
  }, []);
  const colorModifier = useCallback((color: tCLARColor) => {
    "worklet";
    return {
      c: selectColor.value.c * color.c,
      l: selectColor.value.l * color.l,
      ar: color.ar,
    };
  }, []);
  const offset = useCallback(
    (rc: { rings: number; chords: number }, rotation: number) => {
      "worklet";
      let diff = Math.abs(
        rotation - (((rotationROffset.value % (44 / 7)) + 44 / 7) % (44 / 7)),
      );
      if (diff > 22 / 7) {
        diff = 44 / 7 - diff;
      }
      if (diff > arcLength / rc.chords) {
        return 0;
      }
      return (1 - diff / (arcLength / rc.chords)) * 50;
    },
    [],
  );

  return (
    <RadialContext
      value={{
        radii,
        pathFunction: fMakePetalPath,
        rotationROffset,
        offset,
        getColor,
      }}
    >
      <RadialGraphic
        rc={rc}
        arcLength={arcLength}
        rotationR={rotationR}
        direction={direction}
        sectorModifier={(sector) => {
          return {
            ...sector,
            zGroupID: sector.rc.chords % rc.chords,
          };
        }}
        sectorGroupModifier={groupModifier}
      />
    </RadialContext>
  );
}
export { ColorWheel };
