import { Dimensions } from "react-native";
import React, { Profiler, useEffect, useState } from "react";
import { fMakePetalPath, tRadialObject, tSector } from "../Radials/SectorTypes";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { fCLARColorToRGB, tBrand, tCLARColor } from "../utils/CLAcolor";
import { tVerse, useVerse } from "../utils/Verse";
import { ColorChipFan } from "../Chips/ChipStack";
import { RadialContext, wDefaultAngleToChord } from "../Radials/RadialContext";
import { tAttributeModifier, tAttributeMap } from "../utils/Actor";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { tHarmonizerPhase } from "./ColorHarmonizer";
import { BackIcon } from "../Buttons/BackIcon";
import { ColorFan } from "./ColorFan";
import { BrandFilter } from "../ColorWheels/BrandFilter";
import { useChipContext } from "../Chips/ChipContext";
import { usePanHitBox } from "../Buttons/PanHitBox";

export type tSchemeChipSelector = tRadialObject & {
  vPhase?: tVerse<tHarmonizerPhase>;
  vSelected?: tVerse<number[]>;
};

export function SchemeChipSelector({
  origin = [
    Dimensions.get("window").width,
    Dimensions.get("window").height / 2,
  ],
  radii = [125, 250],
  arcLength = 21 / 7,
  rotationR = 22 / 7,
  vPhase,
  vSelected,
}: tSchemeChipSelector) {
  const chordLength = Math.min(arcLength / vSelected.state.length, 1.3);
  console.log("vSelected state:", vSelected?.state);
  usePanHitBox({
    id: "chipSelector",
    origin,
    radii: [0, radii[0] - 30],
    rotationR,
    arcLength,
    fOnUpdate: (vPanState, vPanPos) => {
      "worklet";
      if (vPanState.value === "tap" || vPanState.value === "release") {
        vSelected.dispatch([
          vSelected.shared.value[0],
          vSelected.shared.value.slice(-1)[0],
        ]);
      }
    },
  });
  const [brandFilter, setBrandFilter] = useState<tBrand>("All Brands");
  return (
    <>
      {vSelected.state.map((color, index) => (
        <ChipSelector
          key={index}
          color={color}
          arcLength={chordLength * 0.8}
          rotationR={
            rotationR + chordLength * (index - vSelected.state.length / 2 + 0.5)
          }
          origin={origin}
          radii={radii}
          ring={5}
          chord={4}
          layer={eLayers.chipFan + index * 20}
          multiplier={vSelected.state.length < 4 ? 0.9 : 0.8}
        />
      ))}
      <ColorFan
        hues={vSelected.state}
        origin={origin}
        radii={[10, radii[0] - 30]}
        arcLength={chordLength * vSelected.state.length * 0.8}
        rotationR={rotationR}
        ring={3}
        bend={0.7}
      />
      <BrandFilter
        brand={brandFilter}
        setBrand={setBrandFilter}
        origin={[
          Dimensions.get("window").width - 40,
          Dimensions.get("window").height / 2,
        ]}
        mainRotationR={11 / 7}
        totalArcLength={2 / 7}
        width={100}
        height={50}
      />
      <BackIcon
        zIndex={eLayers.dropScreen - 1}
        color="white"
        size={75}
        origin={[
          Dimensions.get("window").width - 40,
          Dimensions.get("window").height / 2,
        ]}
      />
    </>
  );
}

export type tChipSelector = tRadialObject & {
  color: number;
  layer?: number;
  multiplier?: number;
};

export function ChipSelector(props: tChipSelector) {
  const { arcLength, chord, ring, rotationR, radii } = props;
  const vPanPos = useSharedValue<{ angle: number; radius: number }>({
    angle: rotationR,
    radius: (radii[0] + radii[1]) / 2,
  });
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const { registerModifier, unregisterModifier } = useChipContext();
  const [sideA, setSideA] = useState(true);
  const vTargetColor = useVerse<tCLARColor>({
    c: 0.5,
    l: 0.5,
    ar: props.color,
  });
  const { vColorModel } = useUserContext();
  useEffect(() => {
    setSideA((prev) => !prev);
  }, [vTargetColor.state]);
  const selection = useSharedValue([0, 0]);
  useAnimatedReaction(
    () => {
      return vPanPos.value;
    },
    (pos) => {
      const selectedChord = wDefaultAngleToChord(
        pos.angle,
        arcLength,
        chord,
        rotationR,
      );
      const selectedRing = Math.ceil(
        ((pos.radius - radii[0]) / (radii[1] - radii[0])) * ring,
      );
      if (
        selectedChord !== selection.value[0] ||
        selectedRing !== selection.value[1]
      ) {
        selection.value = [selectedChord, selectedRing];
        const c = (selectedChord / (chord - 1)) * 0.7 + 0.2;
        const l = (selectedRing / (ring - 1)) * 0.7 + 0.2;
        vTargetColor.dispatch({ c, l, ar: props.color });
      }
    },
  );
  function fSectorModifier(sector: tSector): tSector {
    const rgb = fCLARColorToRGB(
      {
        c: (sector.chord / (chord - 1)) * 0.7 + 0.2,
        l: (sector.ring / (ring - 1)) * 0.7 + 0.2,
        ar: props.color,
      },
      vColorModel.state,
    );
    return {
      ...sector,
      rgb,
      sectorGroupID: sector.chord + sector.ring * chord,
    };
  }
  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [vPanPos, vColorModel.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const selectedChord = wDefaultAngleToChord(
        vPanPos.value.angle,
        arcLength,
        chord,
        rotationR,
      );
      const selectedRing = Math.ceil(
        ((vPanPos.value.radius - radii[0]) / (radii[1] - radii[0])) * ring,
      );
      let diff =
        Math.abs(input.chord - selectedChord) +
        Math.abs(input.ring - selectedRing);
      const ar = props.color;
      const [r, g, b] = fCLARColorToRGB(
        { c: 1, l: 0.75, ar },
        vColorModel.shared.value,
      );
      diff = chord + ring - diff;
      diff /= chord + ring;
      return {
        ...input,
        zIndex: eLayers.colorMixer + diff * (ring + chord),
        scaleX: 1 + Math.max(0, diff - 0.8),
        scaleY: 1 + Math.max(0, diff - 0.8),
        translateX: -vPanPos.value.radius * Math.max(0, diff - 0.8),
        shadowColor: diff > 0.9 ? b | (g << 8) | (r << 16) : 0,
        shadowOpacity: diff > 0.9 ? 1 : 0.5,
        shadowRadius: diff > 0.9 ? 10 : 3,
      };
    },
  };
  const mChipModifier: tAttributeModifier = {
    modID: 30,
    deps: [],
    modifier: (input: tAttributeMap) => {
      "worklet";
      if (input.id > eLayers.chipHand - 10 || input.held) {
        return input;
      }
      return {
        ...input,
        scaleX: props.multiplier || 1,
        scaleY: props.multiplier || 1,
      };
    },
  };

  useEffect(() => {
    registerHitBox({
      id: `chipSelector-${rotationR}`,
      origin: props.origin,
      radii: [props.radii[0] - 20, props.radii[1] - 20],
      rotationR: props.rotationR,
      arcLength: props.arcLength,
      vPanPos,
    });
    registerModifier(mChipModifier);
    return () => {
      unregisterHitBox(`chipSelector-${rotationR}`);
      unregisterModifier(mChipModifier.modID);
    };
  }, [props.rotationR]);
  const mColorModifier: tAttributeModifier = {
    modID: 0,
    deps: [vTargetColor.shared, vColorModel.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const selectedChord = wDefaultAngleToChord(
        vPanPos.value.angle,
        arcLength,
        chord,
        rotationR,
      );
      const selectedRing = Math.ceil(
        ((vPanPos.value.radius - radii[0]) / (radii[1] - radii[0])) * ring,
      );
      let diff =
        Math.abs(input.chord - selectedChord) +
        Math.abs(input.ring - selectedRing);
      diff = chord + ring - diff;
      diff /= chord + ring;
      if (diff < 0.9) {
        return input;
      }
      return {
        ...input,
        strokeWidth: 1,
      };
    },
  };
  return (
    <>
      <RadialContext
        value={{
          mTransformModifier,
          radii: [props.radii[0], props.radii[1]],
          mColorModifier,
          fPathFunction: (radii, arcLength, maxRadius, rotationR = 0) =>
            fMakePetalPath(radii, arcLength, maxRadius, rotationR, 0.2),
        }}
      >
        <RadialGraphic {...props} fSectorModifier={fSectorModifier} />
      </RadialContext>
      <ColorChipFan
        {...props}
        sideA={sideA}
        origin={props.origin}
        arcLength={props.arcLength * 1.2}
        targetColor={vTargetColor.state}
        radius={props.radii[1] * 1.6}
        rotationR={rotationR}
        targetNumber={4}
        groupLayer={props.layer || eLayers.chipFan}
      />
    </>
  );
}
