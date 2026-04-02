import { View, Dimensions, PanResponder } from "react-native";
import { CLAColor } from "./CLAcolor";
import {
  RadialGraphic,
  tColorRange,
  fGetColorsFromGrid,
} from "./RadialGraphic";
import { use, useEffect, useMemo, useState } from "react";
import { tSelectionRange, tSectorGroup, Sector, SectorGroup } from "./Sector";
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
type tColorWheel = {
  radii?: [number, number];
  rc?: { rings: number; chords: number };
  arcLength?: number;
  rotation?: number;
  direction?: 1 | -1;
};
function ColorWheel({
  arcLength = 360,
  rotation = 0,
  radii = [20, 200],
  rc = { rings: 5, chords: 18 },
  direction = 1,
}: tColorWheel) {
  const [selectedColor, setSelectedColor] = useState<CLAColor[][]>(
    fGetColorsFromGrid({
      R0A0: new CLAColor(0.5, 0.4, 0),
      R1A0: new CLAColor(0.8, 0.7, 0),
      R0A1: new CLAColor(0.5, 0.4, 0),
      interpolation: "expo",
      dimensions: [rc.rings, 1],
    }),
  );
  const dimensions = Dimensions.get("window");
  const rotationOffset = useSharedValue(0);
  const [selectedSector, setSelectedSector] = useState(0);
  const [dragging, setDragging] = useState(false);
  const selectionRange = useDerivedValue<[number, number]>(() => {
    return [
      rotationOffset.value + 180 - arcLength / rc.chords,
      rotationOffset.value + 180 + arcLength / rc.chords,
    ];
  });
  const angleToChord = (angle: number) => {
    const adjustedAngle = angle - rotation;
    const chord = Math.floor(adjustedAngle / (arcLength / rc.chords));
    return chord;
  };

  const chordToAngle = (chord: number) => {
    return (chord + 0.5) * (arcLength / rc.chords) + rotation;
  };

  const groupModifier = useMemo(() => {
    return (group: tSectorGroup) => {
      group.style = {
        zIndex:
          (group.sectorGroupID - selectedSector + rc.chords + rc.chords / 2) %
          rc.chords,
      };
      group.offsetMultiplier = 150;
      return group;
    };
  }, [selectedSector]);
  const onRelease = () => {
    if (!dragging) return;
    let nearestSectorAngle = chordToAngle(
      angleToChord(rotationOffset.value - rotation),
    );
    const adjustedAngle = (((nearestSectorAngle + 180) % 360) + 360) % 360;
    const selectedSector = angleToChord(adjustedAngle);
    setSelectedSector(selectedSector);
    setSelectedColor(
      fGetColorsFromGrid({
        R0A0: new CLAColor(0.5, 0.4, adjustedAngle),
        R1A0: new CLAColor(0.8, 0.7, adjustedAngle),
        R0A1: new CLAColor(0.5, 0.4, adjustedAngle),
        interpolation: "expo",
        dimensions: [rc.rings, 1],
      }),
    );
    console.log(
      "Selected sector:",
      selectedSector,
      adjustedAngle.toFixed(2),
      nearestSectorAngle.toFixed(2),
      selectedColor[0][0].toString(),
    );
    rotationOffset.value = withTiming(nearestSectorAngle, {
      duration: 300,
    });
  };
  const onPress = ({ chord, ring }) => {
    if (chord === selectedSector && ring > rc.rings - 1) {
      setDragging(false);
    } else {
      setDragging(true);
    }
  };
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <RadialGraphic
        rc={{ rings: rc.rings, chords: 1 }}
        arcLength={arcLength / rc.chords}
        rotation={180}
        radii={radii}
        direction={direction}
        position={[dimensions.width - 10, dimensions.height / 2]}
        colorRange={selectedColor}
        sectorGroupModifier={groupModifier}
      />
      <RadialGraphic
        chordToAngle={chordToAngle}
        angleToChord={angleToChord}
        position={[dimensions.width, dimensions.height / 2]}
        rc={rc}
        arcLength={arcLength}
        rotation={rotation}
        radii={radii}
        direction={1}
        colorRange={{
          R0A0: new CLAColor(0.5, 0.4, 0),
          R1A0: new CLAColor(0.8, 0.7, 0),
          R0A1: new CLAColor(0.5, 0.4, 360),
          interpolation: "expo",
        }}
        sectorModifier={(sector) => {
          return {
            ...sector,
            zGroupID: sector.rc.chords % rc.chords,
            radii: [sector.radii[0], sector.radii[1]],
          };
        }}
        style={{ borderWidth: 1, borderColor: "black" }}
        sectorGroupModifier={groupModifier}
        rotationOffset={rotationOffset}
        onSectorRelease={onRelease}
        onOverTravel={onRelease}
        onSectorPress={onPress}
        selection={selectionRange}
        draggable
      />
    </View>
  );
}
export { ColorWheel };
