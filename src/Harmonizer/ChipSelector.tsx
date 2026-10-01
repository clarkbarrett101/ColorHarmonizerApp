import { Dimensions } from "react-native";
import { Profiler, useEffect, useMemo, useState } from "react";
import { fMakePetalPath, tRadialObject, tSector } from "../Radials/SectorTypes";
import { RadialGraphic } from "../Radials/RadialGraphic";
import {
  fCLARColorToRGB,
  fGetRandomPalette,
  tBrand,
  tCLARColor,
} from "../utils/CLAcolor";
import { tVerse, useVerse, useVerseRelay } from "../utils/Verse";
import { ColorChipFan } from "../Chips/ChipStack";
import { RadialContext, wDefaultAngleToChord } from "../Radials/RadialContext";
import { tAttributeModifier, tAttributeMap } from "../utils/Actor";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { usePanManager } from "../Contexts/PanManager";
import { BackIcon } from "../Buttons/BackIcon";
import { ColorFan } from "./ColorFan";
import { BrandFilter } from "../ColorWheels/BrandFilter";
import { useChipContext } from "../Chips/ChipContext";
import { usePanHitBox } from "../Buttons/PanHitBox";

import { useDemo } from "../Contexts/DemoContext";
import { cDimW, cDimH } from "../utils/ScreenDimensions";
import React from "react";
import Button from "../Buttons/Button";
import Paths from "../utils/Paths";

export default function SchemeChipSelector({
  origin = [
    Dimensions.get("window").width,
    Dimensions.get("window").height / 2,
  ],
  radii = [125, 250],
  arcLength = 21 / 7,
  rotationR = 22 / 7,
}: tRadialObject) {
  const { vSelected, vPage, pagesVisited } = useUserContext();
  const { registerModifier, unregisterModifier } = useChipContext();
  const vSelectedRelay = useVerseRelay(vSelected);
  const chordLength = Math.min(arcLength / vSelectedRelay?.state.length, 1.3);
  const mChipModifier: tAttributeModifier = {
    modID: 30,
    deps: [],
    modifier: (input: tAttributeMap) => {
      "worklet";
      if (input.id > eLayers.chipHand - 10 || input.held > 0) {
        return input;
      }
      const multiplier = vSelectedRelay?.shared.value.length < 4 ? 0.9 : 0.8;
      return {
        ...input,
        scaleX: multiplier,
        scaleY: multiplier,
        radialOffsetX:
          input.radialOffsetX * (multiplier < 0.85 ? 1 : multiplier),
      };
    },
  };
  useEffect(() => {
    registerModifier(mChipModifier);
    return () => {
      unregisterModifier(mChipModifier.modID);
    };
  }, []);

  usePanHitBox({
    id: "chipSelector",
    origin,
    radii: [0, radii[0] - 30],
    rotationR,
    arcLength,
    fOnUpdate: (vPanState, vPanPos) => {
      "worklet";
      if (vPanState.value === "tap" || vPanState.value === "release") {
        vSelectedRelay?.dispatch([
          vSelectedRelay?.shared.value[0],
          vSelectedRelay?.shared.value.slice(-1)[0],
        ]);
        vPage?.dispatch("Scheme Selector");
      }
    },
  });
  const vPagesVisitedRelay = useVerseRelay(pagesVisited);
  const { fPlaySequence } = useDemo();
  const { holdChip } = useChipContext();
  useEffect(() => {
    if (!pagesVisited.shared.value["Chip Selector"]) {
      fPlaySequence([
        {
          touching: 0,
          duration: 1000,
          toPos: [cDimW(0.7), cDimH(0.3)],
        },
        {
          touching: 1,
          duration: 1000,
          toPos: [cDimW(0.9), cDimH(0.4)],
        },
        {
          touching: 0,
          duration: 1000,
          toPos: [cDimW(0.9), cDimH(0.6)],
        },
        {
          touching: 1,
          duration: 1000,
          toPos: [cDimW(0.8), cDimH(0.6)],
        },
        {
          touching: 0,
          duration: 500,
          toPos: [cDimW(0.8), cDimH(0.6)],
        },
        {
          touching: 0,
          duration: 1000,
          toPos: [cDimW(0.2), cDimH(0.5)],
          callback: () => {
            "worklet";
            holdChip(eLayers.chipFan + 22);
          },
        },
        {
          touching: 1,
          duration: 3000,
          toPos: [cDimW(0.5), cDimH(0.5)],
          callback: () => {
            "worklet";
            holdChip();
          },
        },
        {
          touching: 0,
          duration: 300,
          toPos: [-100, cDimH(0.6)],
        },
      ]);
      pagesVisited.dispatch({
        ...pagesVisited.shared.value,
        "Chip Selector": true,
      });
    }
  }, [vPagesVisitedRelay.state]);

  const vBrand = useVerse<tBrand>("All Brands");
  const selector = useMemo(() => {
    return vSelectedRelay?.state.map((color, index) => (
      <ChipSelector
        key={index}
        color={color}
        arcLength={chordLength * 0.8}
        rotationR={
          rotationR +
          chordLength * (index - vSelectedRelay?.state.length / 2 + 0.5)
        }
        origin={origin}
        radii={radii}
        ring={5}
        chord={4}
        layer={eLayers.chipFan + index * 20}
        vBrand={vBrand}
      />
    ));
  }, [
    vSelectedRelay?.state,
    chordLength,
    rotationR,
    origin,
    radii,
    vBrand.state,
  ]);
  return (
    <>
      {selector}
      <ColorFan
        hues={vSelectedRelay?.state}
        origin={origin}
        radii={[10, radii[0] - 30]}
        arcLength={chordLength * vSelectedRelay?.state.length * 0.8}
        rotationR={rotationR}
        ring={3}
        bend={0.7}
      />
      <BrandFilter
        vBrand={vBrand}
        origin={[40, 150]}
        mainRotationR={11 / 7}
        totalArcLength={2 / 7}
        radius={50}
        layer={eLayers.buckets}
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

      <Button
        path={Paths.replay}
        layer={eLayers.superMax}
        origin={[cDimW(0.3), cDimH(0.1)]}
        viewRadius={30}
        onPress={() => {
          pagesVisited.dispatch({
            ...pagesVisited.shared.value,
            "Chip Selector": false,
          });
        }}
      />
    </>
  );
}

export type tChipSelector = tRadialObject & {
  color: number;
  layer?: number;
  vBrand?: tVerse<tBrand>;
};

export function ChipSelector(props: tChipSelector) {
  const { arcLength, chord, ring, rotationR, radii, vBrand } = props;
  const vPanPos = useSharedValue<{ angle: number; radius: number }>({
    angle: rotationR,
    radius: (radii[0] + radii[1]) / 2,
  });
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const [sideA, setSideA] = useState(true);
  const vTargetColor = useVerse<tCLARColor>({
    c: 0.5,
    l: 0.5,
    ar: props.color,
  });
  const { vColorModel } = useUserContext();
  useEffect(() => {
    setSideA((prev) => !prev);
  }, [vTargetColor.state, vBrand.state]);
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

  useEffect(() => {
    registerHitBox({
      id: `chipSelector-${rotationR}`,
      origin: props.origin,
      radii: [props.radii[0] - 20, props.radii[1] - 20],
      rotationR: props.rotationR,
      arcLength: props.arcLength,
      vPanPos,
    });
    return () => {
      unregisterHitBox(`chipSelector-${rotationR}`);
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
          radii: props.radii,
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
        brand={vBrand?.state}
      />
    </>
  );
}
