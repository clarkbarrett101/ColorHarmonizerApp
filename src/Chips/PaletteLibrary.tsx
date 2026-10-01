import { Dimensions, View, Text } from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { usePanManager } from "../Contexts/PanManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fAverageColor,
  fCLARColorToString,
  fDefaultPalettes,
  fToList,
  tCLARColor,
  tPalette,
} from "../utils/CLAcolor";
import { CleanPalette, eLayers, useUserContext } from "../Contexts/UserContext";
import { fLerpModifierFactory, tAttributeModifier } from "../utils/Actor";
import { useChipContext } from "./ChipContext";
import {
  withTiming,
  useAnimatedReaction,
  useSharedValue,
  useDerivedValue,
} from "react-native-reanimated";
import { ePanEvent } from "../Contexts/PanManager";
import {
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "../Radials/RadialContext";
import { SweepDisplay } from "../Buttons/SweepDisplay";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { ChipFan, ChipRow } from "./ChipStack";
import { Paths } from "../utils/Paths";
import Button, { tButton } from "../Buttons/Button";
import * as Clipboard from "expo-clipboard";
import { cDimW, cDimH } from "../utils/ScreenDimensions";
import { StringFormat } from "expo-clipboard";

export default function PaletteLibrary({
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
  /// O N  M O U N T
  const DimWidth = Dimensions.get("window").width;
  const DimHeight = Dimensions.get("window").height;
  const { registerModifier, unregisterModifier } = useChipContext();
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const vPalettes = useVerse<tPalette[]>([]);
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const vPanState = useSharedValue<ePanEvent>("leave");
  const vStartAngle = useSharedValue(0);
  const dragStartAngle = useSharedValue(0);
  const vRotationROffset = useSharedValue(0);
  const { vUserPalette, vAccentC, vAccentL, vAccentAR } = useUserContext();
  const vSelection = useVerse<number>(0);
  const sideA = useVerse<boolean>(true);
  const archLength = useDerivedValue(() => {
    return Math.min((4 / 7) * vPalettes.shared.value.length, 44 / 7);
  });
  const vTextBoxActive = useVerse<boolean>(false);
  const getSelectedPaints = () => {
    const selected = vPalettes.state[vSelection.state];
    return selected?.paints ?? [];
  };

  /// C H I P  M O D I F I E R

  const modifier: tAttributeModifier = {
    modID: 30,
    deps: [vRotationROffset, vPalettes.shared],
    modifier: (input) => {
      "worklet";
      if (input.id >= eLayers.chipFan || input.held === 1) return input;

      const arcLength = archLength.value;
      let group = Math.floor((input.id - eLayers.background - 10) / 10);
      let index = (input.id - eLayers.background - 10) % 10;
      const palette = vPalettes.shared.value[group];
      if (!palette) {
        return input;
      }
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

  /// P A N  G E S T U R E
  const vAverageColor = useVerse<tCLARColor>(
    fAverageColor(getSelectedPaints()),
  );

  function fUpdateAvgColor() {
    "worklet";
    if (
      vPalettes.shared.value.length === 0 ||
      !vPalettes.shared.value[vSelection.shared.value]
    ) {
      return;
    }
    const avgColor = fAverageColor(
      vPalettes.shared.value[vSelection.shared.value].paints,
    );
    vAverageColor.dispatch(avgColor);
    vAccentAR.dispatch(avgColor.ar);
    vAccentC.dispatch(avgColor.c);
    vAccentL.dispatch(avgColor.l);
  }

  function fOnLeave() {
    "worklet";
    console.log("Pan gesture left");
    const arcLength = archLength.value;
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
    vRotationROffset.value = withTiming(
      nearestAngle,
      {
        duration: 300,
      },
      fUpdateAvgColor,
    );
  }
  useEffect(() => {
    sideA.dispatch(!sideA.shared.value);
    fUpdateAvgColor();
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

  /// P A L E T T E S

  const loadPalletes = async () => {
    try {
      const value = await AsyncStorage.getItem("palettes");
      if (value !== null) {
        console.log("data:" + value);
        let palettes = JSON.parse(value);
        for (let i = 0; i < palettes.length; i++) {
          palettes[i] = CleanPalette(palettes[i]);
        }
        return palettes;
      } else {
        console.log("setting empty data");
        const fallback = [...fDefaultPalettes()].map((pal) =>
          CleanPalette(pal),
        );
        return fallback;
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
    console.log("loaded palettes:");
    fOnLeave();
  }, []);

  useEffect(() => {
    for (let i = 0; i < vPalettes.state.length; i++) {
      vPalettes.state[i] = CleanPalette(vPalettes.state[i]);
    }
    storePalettes();
  }, [vPalettes.state]);

  /// P A L E T T E  F U N C T I O N S

  function fSwapPalette() {
    const selectedPalette = vPalettes.shared.value[vSelection.shared.value];
    let newPalettes = [...vPalettes.shared.value];
    if (vUserPalette.shared.value.paints.length > 0) {
      newPalettes[vSelection.shared.value] = vUserPalette.shared.value;
    } else {
      newPalettes.splice(vSelection.shared.value, 1);
    }
    vPalettes.dispatch(newPalettes);
    vUserPalette.dispatch(selectedPalette);
    fOnLeave();
  }

  function fSavePalette() {
    vPalettes.dispatch([...vPalettes.state, vUserPalette.shared.value]);
    vUserPalette.dispatch({
      paints: [],
      name: "New Palette",
    });
    vSelection.dispatch(vPalettes.shared.value.length - 1);
    fOnLeave();
  }

  function fDeletePalette() {
    vPalettes.dispatch(
      vPalettes.shared.value.filter(
        (_, index) => index !== vSelection.shared.value,
      ),
    );
    if (vPalettes.shared.value.length === 0) {
      vPalettes.dispatch([
        {
          paints: [],
          name: "New Palette",
        },
      ]);
    }
    fOnLeave();
  }
  const [copyText, setCopyText] = useState("Copy to Clipboard");
  function fClipBoard() {
    const list = fToList(vPalettes.state[vSelection.state]?.paints || []);
    Clipboard.setStringAsync(list, {
      inputFormat: StringFormat.PLAIN_TEXT,
    }).then(() => {
      Clipboard.getStringAsync().then((str) => console.log(str));
      setCopyText("Copied!");
      setTimeout(() => setCopyText("Copy to Clipboard"), 2000);
    });
  }
  /// R E N D E R
  const color = useMemo(
    () =>
      fCLARColorToString(
        {
          c: vAverageColor.state.c ** 2,
          l: vAverageColor.state.l ** 0.2,
          ar: vAverageColor.state.ar,
        },
        "RYGB",
      ),
    [vAverageColor.state],
  );
  const borderColor = fCLARColorToString(
    {
      c: vAverageColor.state.c ** 0.5,
      l: vAverageColor.state.l * 0.5,
      ar: vAverageColor.state.ar,
    },
    "RYGB",
  );
  return (
    <>
      <Button
        path={Paths.swap}
        onPress={() => fSwapPalette()}
        size={cDimW(0.3)}
        origin={[cDimW(-0.2), cDimH(-0.15)]}
        viewRadius={100}
        textCircle={{
          topText: "Use This",
          radii: [58, 74],
          topTextProps: {
            fontSize: 22,
            fill: "white",
            fontFamily: "Outfit",
            letterSpacing: 1,
          },
          bottomText: "Palette",
          bottomTextProps: {
            fontSize: 21,
            fill: "white",
            fontFamily: "Outfit",
            letterSpacing: 8,
          },
        }}
      />

      {vTextBoxActive.state ? (
        <View
          style={{
            padding: 20,
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            left: DimWidth * 0.05,
            right: DimWidth * 0.05,
            top: DimHeight * 0.15,
            zIndex: eLayers.dropScreen,
            backgroundColor: color,
            borderRadius: 50,
            shadowColor: "#000",
            shadowOffset: { width: -2, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 3,
            borderWidth: 5,
            borderColor: borderColor,
          }}
        >
          <Text
            style={{ fontSize: 16, textAlign: "center", fontFamily: "Outfit" }}
          >
            {fToList(vPalettes.state[vSelection.state]?.paints || [])}
          </Text>
          <Text
            style={{
              fontSize: 16,
              textAlign: "center",
              fontFamily: "Outfit",
              backgroundColor: borderColor,
              borderRadius: 50,
              shadowColor: "#000",
              shadowOffset: { width: -2, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 3.84,
              borderWidth: 1,
              borderColor: color,
              color: "white",
              padding: 10,
              fontWeight: "bold",
              marginTop: 10,
            }}
            onPress={fClipBoard}
          >
            {copyText}
          </Text>
          <Button
            path={Paths.x}
            onPress={() => vTextBoxActive.dispatch(!vTextBoxActive.state)}
            size={cDimW(0.15)}
            origin={[cDimW(0.85), cDimH(0.01)]}
            viewRadius={75}
            layer={eLayers.dropScreen + 1}
          />
        </View>
      ) : null}
      <Button
        path={Paths.list}
        onPress={() => vTextBoxActive.dispatch(!vTextBoxActive.state)}
        size={cDimW(0.15)}
        origin={[cDimW(0.15), cDimH(0.2)]}
        viewRadius={75}
      />

      {vUserPalette.shared.value.paints.length > 0 && (
        <Button
          path={Paths.save}
          onPress={() => fSavePalette()}
          size={cDimW(0.2)}
          origin={[cDimW(0.15), cDimH(0.2)]}
          viewRadius={60}
          textCircle={{
            topText: "Save",
            radii: [40, 50],
            topTextProps: {
              fontSize: 16,
              fill: "white",
              fontFamily: "Outfit",
              letterSpacing: 1,
            },
            bottomText: "Palette",
            bottomTextProps: {
              fontSize: 14,
              fill: "white",
              fontFamily: "Outfit",
              letterSpacing: 4,
            },
          }}
        />
      )}
      <Button
        path={Paths.delete}
        onPress={() => fDeletePalette()}
        size={cDimW(0.15)}
        origin={[cDimW(-0.15), cDimH(0.2)]}
        viewRadius={60}
        textCircle={{
          topText: "Delete",
          radii: [40, 50],
          topTextProps: {
            fontSize: 16,
            fill: "white",
            fontFamily: "Outfit",
            letterSpacing: 1,
          },
          bottomText: "Palette",
          bottomTextProps: {
            fontSize: 14,
            fill: "white",
            fontFamily: "Outfit",
            letterSpacing: 4,
          },
        }}
      />
      {vPalettes.state.length > 0 &&
        vPalettes.state.map((palette, index) => (
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
        radii={[100, radii[1] - 150]}
        layer={eLayers.panManager - 1}
        opacity={0.25}
      />
      {vPalettes.state.length > 0 &&
        vSelection.state < vPalettes.state.length && (
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
        )}
    </>
  );
}
