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

export function PaletteLibrary({
  radii = [100, 400],
  origin = [
    Dimensions.get("window").width + radii[0] * 0.5,
    Dimensions.get("window").height * 0.7,
  ],
  wheelCenter = 40 / 7,
}: {
  origin?: [number, number];
  wheelCenter?: number;
  radii?: [number, number];
}) {
  const { registerModifier, unregisterModifier } = useChipContext();
  const [palettes, setPalettes] = useState<tPalette[]>([
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
  const arcLength = Math.min((4 / 7) * palettes.length, 44 / 7);
  const { userPalette, setUserPalette } = useUserContext();

  const modifier: tAttributeModifier = {
    modID: 30,
    deps: [vRotationROffset],
    modifier: (input) => {
      "worklet";
      if (input.id >= eLayers.chipHand || input.held === 1) return input;
      let group = Math.floor((input.id - eLayers.background - 10) / 10);
      let index = (input.id - eLayers.background - 10) % 10;
      const palette = palettes[group];
      const rot = (input.rotateZ - vRotationROffset.value) % (2 * Math.PI);
      let diff = Math.abs(rot - wheelCenter) % (2 * Math.PI);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      console.log(rot, diff);
      const selected = diff < 0.1;
      const bonus = Math.max(0, 0.1 - diff) / 0.1;
      const radialOffset =
        -(
          radii[0] +
          (radii[1] - radii[0]) * ((index + 0.5) / palette.paints.length)
        ) *
        (0.7 + bonus * 0.5);
      return {
        ...input,
        rotateZ: rot,
        radialOffsetY: radialOffset,
        shadowOpacity: 0,
        scaleX: selected ? 1.1 : 1,
        scaleY: selected ? 1.1 : 1,
        zIndex: input.zIndex + (selected ? 50 : 0),
        rotateX: 0,
      };
    },
  };
  function nearestPaletteAngle(rotationR = 22 / 7) {
    "worklet";
    const nearestPalette = Math.min(
      Math.max(
        wDefaultAngleToChord(rotationR, arcLength, palettes.length, 0),
        0,
      ),
      palettes.length - 1,
    );
    const nearestAngle = wDefaultChordToAngle(
      nearestPalette,
      arcLength,
      palettes.length,
      0,
    );
    return nearestAngle;
  }

  function fOnLeave() {
    "worklet";
    const nearestAngle = nearestPaletteAngle(vRotationROffset.value);
    vRotationROffset.value = withTiming(nearestAngle, {
      duration: 300,
    });
  }
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
          // fOnLeave();
          break;
        case "release":
          // fOnLeave();
          break;
        case "drag":
          break;
        case "tap":
          // fOnLeave();
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

  /*
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
      const jsonValue = JSON.stringify(palettes);
      await AsyncStorage.setItem("palettes", jsonValue);
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    loadPalletes().then((data) => setPalettes(data));
  }, []);
  */
  function fSwapPalette() {
    const selectedPaletteIndex = Math.min(
      Math.max(
        wDefaultAngleToChord(
          vRotationROffset.value,
          arcLength,
          palettes.length,
          wheelCenter,
        ),
        0,
      ),
      palettes.length - 1,
    );
    const selectedPalette = palettes[selectedPaletteIndex];

    setPalettes((prev) => {
      const newPalettes = [...prev];
      newPalettes[selectedPaletteIndex] = userPalette;
      return newPalettes;
    });
    setUserPalette(selectedPalette);
  }
  return (
    <>
      <SwapButton
        onPress={() => fSwapPalette()}
        size={100}
        origin={[100, 150]}
      />
      {palettes.map((palette, index) => (
        <ChipRow
          key={index}
          id={index * 10 + eLayers.background + 10}
          paints={palette.paints}
          rotationR={wDefaultChordToAngle(
            index,
            arcLength,
            palettes.length,
            wheelCenter,
          )}
          radii={radii}
          origin={origin}
        />
      ))}
      <SweepDisplay
        origin={origin}
        radii={[0, radii[1] - 100]}
        layer={eLayers.panManager - 1}
      />
    </>
  );
}

type tChipRow = tRadialObject & {
  paints: tPaint[];
  id: number;
};
export function ChipRow({ id, paints, ...radialProps }: tChipRow) {
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        shadowColor: "#000",
        shadowOffset: { width: -2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        zIndex: id,
      }}
    >
      {paints.map((paint, index) => (
        <PaintChip
          key={`${id}-${index}`}
          paintA={paint}
          chipID={[id, index]}
          {...radialProps}
        />
      ))}
    </View>
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
      viewBox="-90 -40 180 80"
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
