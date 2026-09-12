import { View } from "react-native";
import React, { useCallback } from "react";
import { fCLARColorToRGB, tBrand } from "../utils/CLAcolor";
import { tAttributeMap, tAttributeModifier } from "../utils/Actor";
import { Text, TSpan } from "react-native-svg";
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from "react-native-gesture-handler";
import {
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { useRadialContext, RadialContext } from "../Radials/RadialContext";
import { tSector, tSectorGroup } from "../Radials/SectorTypes";
import { SectorGroup } from "../Radials/SectorGroup";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tVerse, useVerse } from "../utils/Verse";
import { BlurScreen } from "../Buckets/DropScreen";
import { fTextWrapSVG } from "../Buttons/Tutorial";

type tPanEvent = "enter" | "leave" | "drag" | "tap" | "release";
export type tBrandFilter = {
  radius: number;
  vBrand: tVerse<tBrand>;
  totalArcLength?: number;
  mainRotationR?: number;
  origin?: [number, number];
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
  const vBlur = useVerse(false);
  const origin = props.origin || ctx.origin || [0, 0];
  const totalArcLength = props.totalArcLength || ctx.totalArcLength || 11 / 7;
  const mainRotationR = props.mainRotationR || ctx.mainRotationR || 22 / 7;
  const { vAccentC, vAccentL, vAccentAR } = useUserContext();
  const collapseAnim = useSharedValue(0);
  const radius = props.radius || 50;
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const vPanState = useSharedValue<tPanEvent>("leave");
  const vInZone = useSharedValue(false);
  const selection = useDerivedValue(() => {
    "worklet";
    const ring = Math.floor(
      (vPanPos.value.radius / (brands.length * radius)) * brands.length,
    );
    return ring;
  }, []);

  const fToggle = () => {
    "worklet";
    collapseAnim.value = withTiming(collapseAnim.value === 0 ? 1 : 0, {
      duration: 500,
    });
    props.vBrand.dispatch(brands[selection.value]);
  };

  useAnimatedReaction(
    () => collapseAnim.value > 0.5,
    (v) => {
      vBlur.dispatch(v);
    },
  );

  useAnimatedReaction(
    () => vPanState.value,
    (state) => {
      if (state === "tap" || state === "release" || state === "enter") {
        fToggle();
        if (state === "tap") {
          state = "leave";
        }
      }
    },
    [],
  );

  const fPanUpdate = (e: { absoluteX: number; absoluteY: number }) => {
    "worklet";
    const dx = e.absoluteX - origin[0];
    const dy = e.absoluteY - origin[1];
    let angle = Math.atan2(dy, dx);
    if (angle < 0) {
      angle += 44 / 7;
    }
    const distance = Math.sqrt(dx * dx + dy * dy);
    vPanPos.value = { angle, radius: distance };

    const localX =
      dx * Math.cos(-mainRotationR) - dy * Math.sin(-mainRotationR);
    const localY =
      dx * Math.sin(-mainRotationR) + dy * Math.cos(-mainRotationR);
    const clampedX = Math.max(
      0,
      Math.min(collapseAnim.value * (radius * (brands.length - 1)), localX),
    );
    const distX = localX - clampedX;
    const inZone = distX * distX + localY * localY <= radius * radius;

    if (inZone) {
      if (!vInZone.value) {
        vPanState.value = "enter";
      } else {
        vPanState.value = "drag";
      }
      vInZone.value = true;
    } else if (vInZone.value) {
      vPanState.value = "leave";
      vInZone.value = false;
    }
  };

  const fTapUpdate = (e: { absoluteX: number; absoluteY: number }) => {
    "worklet";
    fPanUpdate(e);
    if (vInZone.value) {
      vPanState.value = "tap";
      vInZone.value = false;
    }
  };

  const tap = useTapGesture({
    onActivate: fTapUpdate,
  });

  const pan = usePanGesture({
    minDistance: 5,
    onActivate: fPanUpdate,
    onUpdate: fPanUpdate,
    onDeactivate: () => {
      "worklet";
      if (vInZone.value) {
        vPanState.value = "release";
        vInZone.value = false;
      }
    },
  });

  const compGesture = useSimultaneousGestures(tap, pan);
  const { vColorModel } = useUserContext();
  const mColorModifier: tAttributeModifier = {
    modID: 0,
    deps: [vAccentAR.shared, vAccentC.shared, vColorModel.shared],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const rdc = Math.pow(0.1, 1 / Math.max(brands.length - 1, 1));
      const rdl = Math.pow(0.3, 1 / Math.max(brands.length - 1, 1));
      let l = Math.pow(rdl, input.ring);
      let c = Math.pow(rdc, input.ring) * vAccentC.shared.value;
      let ar = vAccentAR.shared.value - 2 / 7 + (input.chord / 12) * (4 / 7);
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
          brands.length - Math.abs(selection.value - input.ring) + props.layer,
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
      const text = fTextWrapSVG(brandString, radius * 0.7, radius * 0.65, {
        fontFamily: "Outfit",
        fontSize: 18,
        textAnchor: "middle",
        fontWeight: 2000,
        opacity: 0.65,
        fill: i / (brands.length - 1) > 0.5 ? "white" : "black",
        transform: [{ rotate: `${adjustedRotation}rad` }],
        verticalAlign: "middle",
        alignmentBaseline: "middle",
      } as React.ComponentProps<typeof Text>);

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

  const gestureBoundsStyle = useAnimatedStyle(() => {
    const bodyLength = collapseAnim.value * (radius * (brands.length - 1));
    const endX = origin[0] + bodyLength * Math.cos(mainRotationR);
    const endY = origin[1] + bodyLength * Math.sin(mainRotationR);
    const minX = Math.min(origin[0], endX) - radius;
    const minY = Math.min(origin[1], endY) - radius;
    const maxX = Math.max(origin[0], endX) + radius;
    const maxY = Math.max(origin[1], endY) + radius;

    return {
      borderWidth: 1,
      borderRadius: radius,
      left: minX,
      top: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }, [origin, mainRotationR, radius, brands.length]);

  return (
    <>
      <Animated.View
        style={{
          position: "absolute",
          zIndex: eLayers.superMax,
        }}
        pointerEvents="box-none"
      >
        <Animated.View style={[{ position: "absolute" }, gestureBoundsStyle]}>
          <GestureDetector gesture={compGesture}>
            <View style={{ width: "100%", height: "100%" }} />
          </GestureDetector>
        </Animated.View>
      </Animated.View>
      <BlurScreen vActive={vBlur} layer={props.layer - 1} />
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
    </>
  );
};
