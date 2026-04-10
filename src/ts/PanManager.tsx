import React, { use, useCallback, useEffect, useRef, useState } from "react";
import {
  GestureDetector,
  InterceptingGestureDetector,
  PanGesture,
  usePanGesture,
  VirtualGestureDetector,
  useTapGesture,
  GestureStateManager,
} from "react-native-gesture-handler";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import Svg, { G, Line, Path, Circle } from "react-native-svg";
import { fMakeSectorPath } from "./Sector";
import { Dimensions, View } from "react-native";
import { runOnJS } from "react-native-worklets";

type tRadialZone = {
  panPos: SharedValue<{ angle: number; radius: number }>;
  drag?: SharedValue<number>;
  origin: [number, number];
  radii: [number, number];
  arcLength: number;
  rotationR: number;
  onEnter?: (angle: number, radius: number) => void;
  onLeave?: () => void;
  highlight?: boolean;
  travelLimit?: number;
};
const RadialZone = ({
  origin,
  radii,
  arcLength,
  rotationR,
  highlight = false,
}: tRadialZone) => {
  const path = fMakeSectorPath(radii, arcLength, radii[1]);

  return (
    <G
      x={origin?.[0]}
      y={origin?.[1]}
      transform={`rotate(${(rotationR * 180) / Math.PI})`}
    >
      <Path
        d={path}
        fill={highlight ? "rgba(255,255,255,0.5)" : "transparent"}
        stroke="black"
      />
    </G>
  );
};
type tPanManager = {
  registerZone: (zone: tRadialZone) => number;
  unregisterZone: (i: number) => void;
};

const Ctx = React.createContext<tPanManager | null>(null);

export function usePanManager() {
  const context = React.useContext(Ctx);
  if (!context) {
    throw new Error("usePanManager must be used within a PanManager");
  }
  return context;
}

export default function PanManager({
  children,
}: {
  children: React.ReactNode;
}) {
  const panPos = useSharedValue([0, 0]);
  const zones = useSharedValue<tRadialZone[]>([]);
  const startAngle = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const currentZone = useSharedValue(-1);
  const [zoneRefs, setZoneRefs] = useState<tRadialZone[]>([]);
  const [zoneState, setZoneState] = useState(-1);

  useEffect(() => {
    zones.value = zoneRefs;
  }, [zoneRefs]);
  useEffect(() => {
    currentZone.value = zoneState;
  }, [zoneState]);

  const registerZone = useCallback(
    (zone: tRadialZone) => {
      setZoneRefs((refs) => [...refs, zone]);
      return zoneRefs.length;
    },
    [zoneRefs],
  );

  const unregisterZone = useCallback((i: number) => {
    setZoneRefs((refs) => refs.filter((_, index) => index !== i));
  }, []);
  const panUpdate = (e) => {
    `worklet`;
    let foundZone = false;
    panPos.value = [e.absoluteX, e.absoluteY];
    for (let i = 0; i < zones.value.length; i++) {
      const zone = zones.value[i];
      const x = e.absoluteX;
      const y = e.absoluteY;
      const dx = x - zone.origin[0];
      const dy = y - zone.origin[1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);
      if (angle < 0) {
        angle += 44 / 7;
      }
      const inArc =
        angle > zone.rotationR - zone.arcLength / 2 &&
        angle < zone.rotationR + zone.arcLength / 2;
      const inRadius =
        distance >= (zone.radii?.[0] || 0) &&
        distance <= (zone.radii?.[1] || Infinity);
      if (inArc && inRadius) {
        zone.panPos.value = { angle: angle, radius: distance };
        console.log(zone.panPos.value);
        foundZone = true;
        if (
          currentZone.value !== i ||
          (zone.travelLimit &&
            Math.abs(startAngle.value - angle) > zone.travelLimit)
        ) {
          startAngle.value = angle;
          if (
            currentZone.value !== -1 &&
            zones.value[currentZone.value].onLeave
          ) {
            console.log("Leaving zone:", currentZone.value);
            runOnJS(zones.value[currentZone.value].onLeave)();
          }
          console.log("Activating zone:", i);
          if (zone.drag) {
            dragStart.value = zone.drag.value;
          }
          if (zone.onEnter) {
            runOnJS(zone.onEnter)(angle, distance);
          }
          runOnJS(setZoneState)(i);
        }
        if (zone.drag) {
          zone.drag.value = startAngle.value + dragStart.value - angle;
        }
        break;
      }
    }
    if (!foundZone && currentZone.value !== -1) {
      console.log("Leaving zone:", currentZone.value);
      if (zones.value[currentZone.value].onLeave) {
        runOnJS(zones.value[currentZone.value].onLeave)();
      }
      runOnJS(setZoneState)(-1);
    }
  };
  const pan = usePanGesture({
    onBegin: panUpdate,
    onUpdate: panUpdate,
    onDeactivate() {
      if (currentZone.value !== -1) {
        console.log("Deactivating from zone:", currentZone.value);
        if (zones.value[currentZone.value].drag) {
          console.log("Drag:", zones.value[currentZone.value].drag.value);
        }
        if (zones.value[currentZone.value].onLeave) {
          runOnJS(zones.value[currentZone.value].onLeave)();
        }
        runOnJS(setZoneState)(-1);
      }
    },
  });

  return (
    <Ctx.Provider
      value={{
        registerZone,
        unregisterZone,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
        {children}
      </View>

      <GestureDetector gesture={pan}>
        <Svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          {zoneRefs.map((zone, index) => (
            <RadialZone {...zone} key={index} highlight={zoneState === index} />
          ))}
        </Svg>
      </GestureDetector>
    </Ctx.Provider>
  );
}
