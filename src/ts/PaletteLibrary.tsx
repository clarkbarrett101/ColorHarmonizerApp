import { View, Text, Dimensions } from "react-native";
import React, { use, useEffect, useState } from "react";
import { eChipSizes, PaintChip, tPaintChip } from "./PaintChip";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fGetRandomPalette,
  fRGBToCLARColor,
  tCLARColor,
  tPaint,
  tPalette,
} from "./CLAcolor";
import { eLayers, useUserContext } from "./UserContext";
import { tRadialObject } from "./sectorTypes";
import { fLerpModifierFactory, tAttributeModifier } from "./Actor";

export function PaletteLibrary({
  origin = [
    Dimensions.get("window").width * 1.3,
    Dimensions.get("window").height / 2,
  ],
}: {
  origin?: [number, number];
}) {
  const {
    userPalette,
    addPaint,
    removePaint,
    registerModifier,
    unregisterModifier,
  } = useUserContext();
  const [palettes, setPalettes] = useState<tPalette[]>([
    fGetRandomPalette(4),
    fGetRandomPalette(4),
    fGetRandomPalette(4),
  ]);

  const modifier: tAttributeModifier = {
    modID: 30,
    deps: [],
    modifier: (input) => {
      "worklet";
      if (input.id > eLayers.chipHand) return input;
      return {
        ...input,
        rotateX: 0,
      };
    },
  };

  useEffect(() => {
    registerModifier(modifier);
    return () => {
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
  return (
    <>
      {palettes.map((palette, index) => (
        <ChipRow
          key={index}
          id={index * 10 + eLayers.chipFan}
          paints={palette.paints}
          rotationR={(11 / 7) * ((index + 0.5) / palettes.length) + 16 / 7}
          radii={[125, eChipSizes.default[1] * palette.paints.length * 0.66]}
          origin={origin}
        />
      ))}
    </>
  );
}

type tChipRow = tRadialObject & {
  paints: tPaint[];
  id: number;
};
export function ChipRow({ id, paints, ...radialProps }: tChipRow) {
  return (
    <>
      {paints.map((paint, index) => (
        <PaintChip
          key={`${id}-${index}`}
          paintA={paint}
          chipID={[id, index]}
          rotationOffset={-11 / 7}
          radialOffset={
            radialProps.radii[1] * ((index + 1) / paints.length) +
            radialProps.radii[0]
          }
          {...radialProps}
        />
      ))}
    </>
  );
}
