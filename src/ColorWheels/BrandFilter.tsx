import { View } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { fCLARColorToRGB, tBrand } from "../utils/CLAcolor";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { Text, TSpan } from "react-native-svg";
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useRadialContext, RadialContext } from "../Radials/RadialContext";
import { tSector, tSectorGroup } from "../Radials/SectorTypes";
import { SectorGroup } from "../Radials/SectorGroup";
import { SharedValue } from "react-native-gesture-handler/lib/typescript/v3/types";
import { scheduleOnRN } from "react-native-worklets";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { useBucketContext } from "../Buckets/BucketContext";
import DropScreen from "../Buckets/DropScreen";

export type tBrandFilter = {
  width?: number;
  height?: number;
  setBrand: (brand: tBrand) => void;
  brand: tBrand;
  totalArcLength?: number;
  mainRotationR?: number;
  origin?: [number, number];
  dC?: SharedValue<number>;
  dL?: SharedValue<number>;
  dAR?: SharedValue<number>;
  layer?: number;
};

export const BrandFilter = (props: tBrandFilter) => {
  const brands: tBrand[] = [
    "All Brands",
    "Behr",
    "Benjamin Moore",
    "Sherwin Williams",
    "PPG",
    "Valspar",
  ];
  const ctx = useRadialContext();
  const { vDropScreen } = useBucketContext();
  const origin = props.origin || ctx.origin || [0, 0];
  const totalArcLength = props.totalArcLength || ctx.totalArcLength || 11 / 7;
  const mainRotationR = props.mainRotationR || ctx.mainRotationR || 22 / 7;
  const dC = props.dC || ctx.dC;
  const dL = props.dL || ctx.dL;
  const dAR = props.dAR || ctx.dAR;
  const collapseAnim = useSharedValue(0);
  const radius =
    Math.sqrt(
      Math.pow(props.width || 200, 2) + Math.pow(props.height || 200, 2),
    ) / 2;
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const vPanState = useSharedValue<ePanEvent>("leave");
  const selection = useDerivedValue(() => {
    "worklet";
    const ring = Math.floor(
      (vPanPos.value.radius / (brands.length * radius)) * brands.length,
    );
    return ring;
  }, []);
  const {
    registerHitBox: registerZone,
    unregisterHitBox: unregisterZone,
    calculateBounds,
  } = usePanManager();

  const fToggle = () => {
    "worklet";
    collapseAnim.value = withTiming(collapseAnim.value === 0 ? 1 : 0, {
      duration: 500,
    });
    scheduleOnRN(props.setBrand, brands[selection.value]);
  };

  useAnimatedReaction(
    () => collapseAnim.value > 0.5,
    (v) => {
      if (collapseAnim.value !== 0 && collapseAnim.value !== 1)
        calculateBounds();
      vDropScreen.dispatch(v);
    },
  );

  useAnimatedReaction(
    () => vPanState.value,
    (state) => {
      switch (state) {
        case "enter":
          fToggle();
          break;
        case "leave":
          fToggle();
          break;
        case "drag":
          break;
        case "tap":
          fToggle();
          break;
      }
    },
    [],
  );

  useEffect(() => {
    registerZone({
      id: "brandFilter",
      shape: "capsule",
      priority: 12,
      origin: origin || [0, 0],
      arcLength: totalArcLength,
      radii: [radius, radius * brands.length],
      capsuleMod: collapseAnim,
      rotationR: mainRotationR,
      vPanState,
      vPanPos,
      layer: props.layer || eLayers.chipHand,
    });
    return () => {
      unregisterZone("brandFilter");
      vDropScreen.dispatch(false);
    };
  }, []);
  const { vColorModel } = useUserContext();
  const mColorModifier: tAttributeModifier = {
    modID: 0,
    deps: [dAR, dC, vColorModel.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const rdc = Math.pow(0.1, 1 / Math.max(brands.length - 1, 1));
      const rdl = Math.pow(0.3, 1 / Math.max(brands.length - 1, 1));
      let l = Math.pow(rdl, input.ring);
      let c = Math.pow(rdc, input.ring) * dC.value;
      let ar = dAR.value - 2 / 7 + (input.chord / 12) * (4 / 7);
      const [r, g, b] = fCLARColorToRGB({ c, l, ar }, vColorModel.shared.value);
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };
  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [collapseAnim, selection],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const x = (input.ring * collapseAnim.value - 0.5) * radius;

      return {
        ...input,
        translateX: x,
        zIndex:
          brands.length -
          Math.abs(selection.value - input.ring) +
          eLayers.chipHand -
          10,
        shadowRadius:
          input.shadowRadius *
          (input.ring === selection.value ? 1 : collapseAnim.value),
      };
    },
  };
  const adjustedRotation = Math.round(mainRotationR / (11 / 7)) * (-11 / 7);
  const sectors = useCallback(() => {
    const group = [];
    for (let i = 0; i < brands.length; i++) {
      const sector: tSector = {
        arcLength: totalArcLength,
        chord: 0,
        ring: i,
        radii: [radius * 0.2, radius * 1.2],
      };
      let brandString = (brands[i] as string).split(/[\s-]/);
      const text = (
        <Text
          key={i}
          fontFamily="Outfit"
          fontSize={18}
          textAnchor="middle"
          fontWeight={2000}
          opacity={0.65}
          fill={i / (brands.length - 1) > 0.5 ? "white" : "black"}
          verticalAlign={0.1}
          transform={[
            { rotate: `${adjustedRotation}rad` },
            { translateY: radius * 0.6 },
          ]}
          pointerEvents="none"
        >
          {brandString.map((line, index) => (
            <TSpan
              key={index}
              x={0}
              dy={brandString.length > 1 ? (index === 0 ? -8 : 16) : 0}
              pointerEvents="none"
            >
              {line}
            </TSpan>
          ))}
        </Text>
      );
      const sectorGroup: tSectorGroup = {
        arcLength: totalArcLength,
        chord: 0,
        rotationR: mainRotationR,
        sectorGroupID: i,
        ring: i,
        children: [text],
        sectors: [sector],
        origin,
      };
      group.push(<SectorGroup key={i} {...sectorGroup} />);
    }
    return group;
  }, [brands]);

  return (
    <RadialContext
      value={{
        origin,
        mColorModifier,
        radii: [radius, radius * brands.length],
        mTransformModifier,
        totalArcLength,
        mainRotationR,
      }}
    >
      {sectors()}
    </RadialContext>
  );
};
