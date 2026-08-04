import { View, Text, Dimensions } from "react-native";
import React, { use, useCallback, useEffect, useState } from "react";
import { usePanManager } from "../Contexts/PanManager";
import { eChipSizes, PaintChip, tPaintChip } from "./PaintChip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fCLARColorToString,
  fGetRandomPalette,
  fRGBToCLARColor,
  tCLARColor,
  tPaint,
  tPalette,
} from "../utils/CLAcolor";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tRadialObject } from "../Radials/SectorTypes";
import { fLerpModifierFactory, tAttributeModifier } from "../utils/Actor";
import { useChipContext } from "./ChipContext";
import {
  withTiming,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import { ePanEvent } from "../Contexts/PanManager";
import {
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "../Radials/RadialContext";
import { Sign } from "../Harmonizer/ColorScheme";
import { Circle, Path, Svg } from "react-native-svg";
import { SweepDisplay } from "../Buttons/SweepDisplay";
import { useVerse } from "../utils/Verse";
import { ChipFan, ChipRow, ColorChipFan } from "./ChipStack";

export function PaletteLibrary({
  radii = [50, 300],
  origin = [
    Dimensions.get("window").width + radii[0] * 0.5,
    Dimensions.get("window").height * 0.5,
  ],
  wheelCenter = 33 / 7,
}: {
  origin?: [number, number];
  wheelCenter?: number;
  radii?: [number, number];
}) {
  const { registerModifier, unregisterModifier } = useChipContext();
  const vPalettes = useVerse<tPalette[]>([
    fGetRandomPalette(4),
    fGetRandomPalette(5),
    fGetRandomPalette(4),
  ]);
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const vPanState = useSharedValue<ePanEvent>("leave");
  const vStartAngle = useSharedValue(0);
  const dragStartAngle = useSharedValue(0);
  const vRotationROffset = useSharedValue(0);
  const { userPalette, setUserPalette } = useUserContext();
  const vSelection = useVerse<number>(0);
  const modifier: tAttributeModifier = {
    modID: 30,
    deps: [vRotationROffset, vPalettes.shared],
    modifier: (input) => {
      "worklet";
      if (input.id >= eLayers.chipFan || input.held === 1) return input;

      const arcLength = Math.min(
        (4 / 7) * vPalettes.shared.value.length,
        44 / 7,
      );
      let group = Math.floor((input.id - eLayers.background - 10) / 10);
      let index = (input.id - eLayers.background - 10) % 10;
      const palette = vPalettes.shared.value[group];
      if (!palette) {
        console.log(
          "Palette not found for group:",
          group,
          "Available palettes:",
          vPalettes.shared.value,
        );
        return input; // Return the input unchanged if the palette is not found
      }
      console.log(input.id, group, index, palette);
      let rot = input.rotateZ - vRotationROffset.value;
      let diff = Math.abs(rot - wheelCenter) % (2 * Math.PI);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      diff /= arcLength;
      const selected = diff < 0.1;

      return {
        ...input,
        shadowOpacity: 0.3,
        radialOffsetY: -(
          radii[0] +
          (index / palette.paints.length) *
            (radii[1] - radii[0]) *
            (0.5 + Math.max(0.1 - diff, 0))
        ),
        scaleX: selected ? 1.1 : 1,
        scaleY: selected ? 1.1 : 1,
        zIndex: Math.round((1 - diff) * 100) + eLayers.background - index,
        rotateZ: rot,
        rotateX: 0,
      };
    },
  };

  const sideA = useVerse<boolean>(true);
  function fOnLeave() {
    "worklet";

    const arcLength = Math.min((4 / 7) * vPalettes.shared.value.length, 44 / 7);
    const nearestPalette = Math.max(
      0,
      Math.min(
        wDefaultAngleToChord(
          vRotationROffset.value,
          arcLength,
          vPalettes.shared.value.length,
          0,
        ),
        vPalettes.shared.value.length - 1,
      ),
    );
    const nearestAngle = wDefaultChordToAngle(
      nearestPalette,
      arcLength,
      vPalettes.shared.value.length,
      0,
    );
    vSelection.dispatch(nearestPalette);
    vRotationROffset.value = withTiming(nearestAngle, {
      duration: 300,
    });
  }
  useEffect(() => {
    sideA.dispatch(!sideA.shared.value);
  }, [vSelection.state]);

  useAnimatedReaction(
    () => vPanPos.value,
    (pos) => {
      if (vPanState.value === "drag") {
        const angleDiff = vPanPos.value.angle - vStartAngle.value;
        const r = dragStartAngle.value - angleDiff;
        vRotationROffset.value = r;
      }
    },
    [],
  );

  useAnimatedReaction(
    () => vPanState.value,
    (state) => {
      console.log("Wheel pan state changed:", state);
      switch (state) {
        case "enter":
          vStartAngle.value = vPanPos.value.angle;
          dragStartAngle.value = vRotationROffset.value;
          break;
        case "leave":
          fOnLeave();
          break;
        case "release":
          fOnLeave();
          break;
        case "drag":
          break;
        case "tap":
          fOnLeave();
          break;
      }
    },
    [],
  );

  useEffect(() => {
    registerHitBox({
      origin,
      id: "paletteLibrary",
      radii: [0, radii[1] - 100],
      rotationR: 22 / 7,
      arcLength: 30 / 7,
      vPanPos,
      vPanState,
      priority: 5,
    });
    registerModifier(modifier);
    return () => {
      unregisterHitBox("paletteLibrary");
      unregisterModifier(modifier.modID);
    };
  }, []);

  const loadPalletes = async () => {
    try {
      const value = await AsyncStorage.getItem("palettes");
      if (value !== null) {
        console.log("data:" + value);
        return JSON.parse(value);
      } else {
        console.log("setting empty data");
        let pal = await storePalettes();
        return [pal];
      }
    } catch (e) {
      console.log(e);
    }
  };
  const storePalettes = async () => {
    try {
      const jsonValue = JSON.stringify(vPalettes.state);
      await AsyncStorage.setItem("palettes", jsonValue);
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    loadPalletes().then((data) => vPalettes.dispatch(data as tPalette[]));
  }, []);
  useEffect(() => {
    storePalettes();
  }, [vPalettes.state]);

  function fSwapPalette() {
    const arcLength = Math.min((4 / 7) * vPalettes.state.length, 44 / 7);
    const selectedPaletteIndex = Math.min(
      Math.max(
        wDefaultAngleToChord(
          vRotationROffset.value,
          arcLength,
          vPalettes.state.length,
          0,
        ),
        0,
      ),
      vPalettes.state.length - 1,
    );
    const selectedPalette = vPalettes.state[selectedPaletteIndex];
    let newPalettes = [...vPalettes.state];
    if (userPalette.paints.length > 0) {
      newPalettes[selectedPaletteIndex] = userPalette;
    } else {
      newPalettes.splice(selectedPaletteIndex, 1);
      vSelection.dispatch(Math.max(0, selectedPaletteIndex - 1));
    }
    vPalettes.dispatch(newPalettes);
    setUserPalette(selectedPalette);
  }
  function fSavePalette() {
    vPalettes.dispatch([...vPalettes.state, userPalette]);
    setUserPalette({
      paints: [],
      name: Math.random().toString(36).substring(2, 7),
    });
    vSelection.dispatch(vPalettes.state.length);
  }
  function fDeletePalette() {
    vPalettes.dispatch(
      vPalettes.state.filter((_, index) => index !== vSelection.state),
    );
    vSelection.dispatch(Math.max(0, vSelection.state - 1));
  }
  return (
    <>
      <SwapButton
        onPress={() => fSwapPalette()}
        size={100}
        origin={[100, 150]}
      />
      {userPalette.paints.length > 0 && (
        <SaveButton
          onPress={() => fSavePalette()}
          size={100}
          origin={[300, 150]}
        />
      )}
      <DeleteButton
        onPress={() => fDeletePalette()}
        size={100}
        origin={[300, Dimensions.get("window").height - 150]}
      />
      {vPalettes.state.map((palette, index) => (
        <ChipRow
          key={index}
          id={index * 10 + eLayers.background + 10}
          paints={palette.paints}
          rotationR={wDefaultChordToAngle(
            index,
            Math.min((4 / 7) * vPalettes.state.length, 44 / 7),
            vPalettes.state.length,
            wheelCenter,
          )}
          rotationOffset={22 / 7}
          radii={radii}
          origin={origin}
          grouped={false}
        />
      ))}
      <SweepDisplay
        origin={origin}
        radii={[0, radii[1] - 100]}
        layer={eLayers.panManager - 1}
        opacity={0.25}
      />
      <ChipFan
        groupLayer={eLayers.chipFan}
        paintsA={vPalettes.state[vSelection.state].paints}
        size={"default"}
        radius={radii[1]}
        origin={origin}
        rotationR={wheelCenter - 11 / 7}
        arcLength={13 / 7}
        sideA={sideA.state}
      />
    </>
  );
}

const swapPath =
  "M-26 14-32 17C-31 18-30 19-29 20-20 19-14 17-5 13L-5-7C-6-8-7-9-9-10L-9 6C-19 11-22 12-29 12L-29 12ZM-70 5-70 5C-61 10-59 11-50 11L-48 1-30 11C-22 11-16 9-10 5L-10-15C-17-18-26-20-29-20-36-16-43-11-50-4-48-13-46-15-42-20-53-20-62-18-70-12L-70-12ZM36 20C42 21 55 20 71 13L71-7C70-8 69-9 67-10L67 6C52 12 46 13 42 13ZM34 13 24 19C20 18 13 16 11 14L11 9C20 12 27 13 33 13ZM6 5 6 5C10 9 28 13 35 12L45 4 42 12C45 12 57 10 66 5L66-15C59-18 53-20 46-20L43-2 20-15 27-18 25-20C20-19 16-19 6-15ZM44-23 41-5 24-15 30-18C11-40-29-27-48-8-29-44 14-45 38-21ZM-49 22-47 4-29 14-35 17C-16 39 24 26 43 7 24 43-19 44-43 20ZM-64 9-64 14C-58 18-55 18-51 19L-50 12C-56 12-59 12-64 9";
export function SwapButton({
  origin = [100, 100],
  size = 50,
  onPress,
}: {
  origin?: [number, number];
  size?: number;
  onPress: () => void;
}) {
  const { vAccentC, vAccentL, vAccentAR, vColorModel } = useUserContext();

  return (
    <Svg
      onTouchStart={onPress}
      style={{
        position: "absolute",
        left: origin[0] - size / 2,
        top: origin[1] - size / 2,
        width: size,
        height: size,
        zIndex: eLayers.buckets + 100,
      }}
      viewBox="-80 -80 160 160"
    >
      <Circle
        cx="0"
        cy="0"
        r="80"
        fill={fCLARColorToString(
          {
            c: 0.5,
            l: 0.5,
            ar: vAccentAR.state,
          },
          vColorModel.state,
        )}
      />
      <Path d={swapPath} fill="white" />
    </Svg>
  );
}
const savePath =
  "M-50 0A1 1 0 0150 0 1 1 0 01-50 0ZM-30 8C-15 19 15 19 30 9L30-11C29-12 28-13 26-14L26 2C12 11-11 12-30 5ZM-25 17C-10 27 20 27 35 17L35-3C34-4 33-5 31-6L31 10C20 17-2 21-25 13ZM-35 1C-20 11 10 11 25 1L25-19C7-26-8-26-17-24L-17-22-7-22-7-10-17-10-17 0-30 0-30-9-35-9ZM-29-10-29-1-18-1-18-11-8-11-8-21-18-21-18-31-28-31-28-21-38-21-38-10Z";
export function SaveButton({
  origin = [100, 100],
  size = 50,
  onPress,
}: {
  origin?: [number, number];
  size?: number;
  onPress: () => void;
}) {
  const { vAccentC, vAccentL, vAccentAR, vColorModel } = useUserContext();

  return (
    <Svg
      onTouchStart={onPress}
      style={{
        position: "absolute",
        left: origin[0] - size / 2,
        top: origin[1] - size / 2,
        width: size,
        height: size,
        zIndex: eLayers.buckets + 100,
      }}
      viewBox="-50 -50 100 100"
    >
      <Circle cx="0" cy="0" r="50" fill={"white"} opacity={1} />
      <Path
        d={savePath}
        fill={fCLARColorToString(
          {
            c: 0.5,
            l: 0.5,
            ar: vAccentAR.state,
          },
          vColorModel.state,
        )}
      />
    </Svg>
  );
}
const deletePath =
  "M-50 0A1 1 0 0150 0 1 1 0 01-50 0ZM-30 8C-15 19 15 19 30 9L30-11C29-12 28-13 26-14L26 2C12 11-11 12-30 5ZM-25 17C-10 27 20 27 35 17L35-3C34-4 33-5 31-6L31 10C20 17-2 21-25 13ZM-35 1C-20 11 10 11 25 1L25-19C15-24 7-25 1-25L2-24-7-14 2-5l-8 8L-15-6-24 3-32-5-23-14-30-21-30-21-35-19ZM-21-14-30-5-24 1-15-8-6 1 0-5-9-14 0-24-6-30-15-20-25-30-31-24ZM-18-25-15-22-12-25Z";
export function DeleteButton({
  origin = [100, 100],
  size = 50,
  onPress,
}: {
  origin?: [number, number];
  size?: number;
  onPress: () => void;
}) {
  const { vAccentC, vAccentL, vAccentAR, vColorModel } = useUserContext();

  return (
    <Svg
      onTouchStart={onPress}
      style={{
        position: "absolute",
        left: origin[0] - size / 2,
        top: origin[1] - size / 2,
        width: size,
        height: size,
        zIndex: eLayers.buckets + 100,
      }}
      viewBox="-50 -50 100 100"
    >
      <Circle cx="0" cy="0" r="50" fill={"white"} opacity={1} />
      <Path
        d={deletePath}
        fill={fCLARColorToString(
          {
            c: 0.5,
            l: 0.5,
            ar: vAccentAR.state,
          },
          vColorModel.state,
        )}
      />
    </Svg>
  );
}
