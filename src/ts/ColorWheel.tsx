import { Dimensions, PanResponder } from "react-native";
import { CLAColor } from "./CLAcolor";
import RadialGraphic from "./RadialGraphic";
import { use, useEffect, useMemo, useState } from "react";
import { tSelectionRange, tSectorGroup } from "./Sector";
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
type tColorWheel = {
  arc?: [number, number];
  radii?: [number, number];
  chords?: number;
  rings?: number;
};
function ColorWheel({
  arc = [0, 360],
  radii = [20, 200],
  chords = 18,
  rings = 5,
}: tColorWheel) {
  const dimensions = Dimensions.get("window");
  const rotationOffset = useSharedValue(0);
  const [selectedSector, setSelectedSector] = useState(0);
  const [dragging, setDragging] = useState(false);
  const selectionRange = useDerivedValue<[number, number]>(() => {
    return [
      rotationOffset.value + 180 - 360 / chords,
      rotationOffset.value + 180 + 360 / chords,
    ];
  });
  const groupModifier = useMemo(() => {
    return (group: tSectorGroup) => {
      group.arcLength =
        group.sectorGroupID === selectedSector
          ? 360 / chords
          : 360 / chords - 10;
      group.style = {
        zIndex:
          (group.sectorGroupID - selectedSector + chords + chords / 2) % chords,
      };
      group.offsetMultiplier =
        group.sectorGroupID === selectedSector ? 150 : 100;
      return group;
    };
  }, [selectedSector]);
  const onRelease = () => {
    if (!dragging) return;
    let nearestSectorAngle =
      Math.round(rotationOffset.value / (360 / chords)) * (360 / chords);
    nearestSectorAngle += 180 / chords;
    let selectedAngle = ((nearestSectorAngle % 360) + 360) % 360;
    const sectorAngle = 360 / chords;
    const selectedSector =
      chords - (Math.floor(selectedAngle / sectorAngle) % chords);
    setSelectedSector(selectedSector);
    console.log(
      "Selected sector:",
      selectedSector,
      selectedAngle.toFixed(2),
      selectionRange.value.map((s) => s.toFixed(2)),
    );
    rotationOffset.value = withTiming(nearestSectorAngle, {
      duration: 300,
    });
  };
  const onPress = ({ chord, ring }) => {
    console.log("Pressed chord:", chord, "ring:", ring);
    if (chord === selectedSector || ring > rings - 1) {
      setDragging(false);
    } else {
      setDragging(true);
    }
  };
  return (
    <RadialGraphic
      position={[dimensions.width, dimensions.height / 2]}
      rc={{ rings, chords }}
      arcLength={arc[1] - arc[0]}
      rotation={arc[0]}
      radii={radii}
      direction={1}
      colorRange={{
        R0A0: new CLAColor(0.5, 0.4, 0),
        R1A0: new CLAColor(0.8, 0.7, 0),
        R0A1: new CLAColor(0.5, 0.4, 360),
        interpolation: "expo",
      }}
      sectorModifier={(sector) => {
        return { ...sector, zGroupID: sector.rc.chords % chords };
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
  );
}
export { ColorWheel };
