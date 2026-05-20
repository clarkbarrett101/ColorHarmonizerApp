import React, { useCallback, useEffect, useState } from "react";
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from "react-native-gesture-handler";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import { fMakeSectorPath } from "./Sector";
import { View } from "react-native";
import { runOnJS } from "react-native-worklets";
import { useRadialContext } from "./RadialContext";
import { eLayers } from "./UserContext";

type tRadialZone = {
  vPanPos: SharedValue<{ angle: number; radius: number }>;
  vDrag?: SharedValue<number>;
  origin: [number, number];
  radii: [number, number];
  arcLength: number;
  rotationR: number;
  fOnEnter?: (angle: number, radius: number) => void;
  fOnLeave?: () => void;
  fOnTap?: () => void;
  highlight?: boolean;
  tickRate?: number;
  priority?: number;
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
        fill={highlight ? "rgba(255,255,255,0.25)" : "transparent"}
        stroke="rgba(0,0,0,0.1)"
      />
    </G>
  );
};

type tPanManager = {
  registerZone: (zone: tRadialZone) => () => void;
  selectedZone: number;
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
  drawSectors = false,
}: {
  children: React.ReactNode;
  drawSectors?: boolean;
}) {
  const vPanPos = useSharedValue([0, 0]);
  const vZones = useSharedValue<tRadialZone[]>([]);
  const vStartAngle = useSharedValue(0);
  const vDragStart = useSharedValue(0);
  const vCurrentZone = useSharedValue(-1);
  const [zoneRefs, setZoneRefs] = useState<tRadialZone[]>([]);
  const [zoneState, setZoneState] = useState(-1);
  const { direction = 1, radii, origin } = useRadialContext();
  useEffect(() => {
    vZones.value = zoneRefs;
  }, [zoneRefs]);
  useEffect(() => {
    vCurrentZone.value = zoneState;
    console.log("selected zone", zoneState);
  }, [zoneState]);

  const registerZone = useCallback((zone: tRadialZone) => {
    setZoneRefs((refs) => {
      const newZone = {
        ...zone,
        priority: zone.priority || 0,
      };
      const updated = [...refs, newZone].sort(
        (a, b) => (b.priority || 0) - (a.priority || 0),
      );
      return updated;
    });
    return () => unregisterZone(zone);
  }, []);

  const unregisterZone = useCallback((zone: tRadialZone) => {
    setZoneRefs((refs) => refs.filter((z) => z !== zone));
  }, []);
  const releaseZone = () => {
    "worklet";
    if (vCurrentZone.value !== -1) {
      if (vZones.value[vCurrentZone.value].fOnLeave) {
        runOnJS(vZones.value[vCurrentZone.value].fOnLeave)();
      }
      runOnJS(setZoneState)(-1);
      vCurrentZone.value = -1;
    }
  };
  const panUpdate = (e: { absoluteX: number; absoluteY: number }) => {
    `worklet`;
    let foundZone = false;
    vPanPos.value = [e.absoluteX, e.absoluteY];
    for (let i = 0; i < vZones.value.length; i++) {
      const zone = vZones.value[i];
      const x = e.absoluteX;
      const y = e.absoluteY;
      const dx = x - zone.origin[0];
      const dy = y - zone.origin[1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);
      if (angle < 0) {
        angle += 44 / 7;
      }
      if (direction === -1) {
        angle = 44 / 7 - angle;
      }
      const inArc =
        angle > zone.rotationR - zone.arcLength / 2 &&
        angle < zone.rotationR + zone.arcLength / 2;
      const inRadius =
        distance >= (zone.radii?.[0] || 0) &&
        distance <= (zone.radii?.[1] || Infinity);

      if (inArc && inRadius) {
        zone.vPanPos.value = { angle: angle, radius: distance };
        foundZone = true;

        if (vCurrentZone.value !== i) {
          vStartAngle.value = angle;
          if (
            vCurrentZone.value !== -1 &&
            vZones.value[vCurrentZone.value].fOnLeave
          ) {
            runOnJS(vZones.value[vCurrentZone.value].fOnLeave)();
          }
          if (zone.vDrag) {
            vDragStart.value = zone.vDrag.value;
          }
          if (zone.fOnEnter) {
            runOnJS(zone.fOnEnter)(angle, distance);
          }
          runOnJS(setZoneState)(i);
        }
        vCurrentZone.value = i;
        if (zone.vDrag) {
          zone.vDrag.value = vStartAngle.value + vDragStart.value - angle;
        }
        break;
      }
    }
    if (!foundZone) {
      releaseZone();
    }
  };

  const tapUpdate = (e: { absoluteX: number; absoluteY: number }) => {
    "worklet";
    panUpdate(e);
    if (vCurrentZone.value !== -1) {
      const zone = vZones.value[vCurrentZone.value];
      if (zone.fOnTap) {
        runOnJS(zone.fOnTap)();
      }
      releaseZone();
    }
  };
  const tap = useTapGesture({
    onActivate: tapUpdate,
  });
  const pan = usePanGesture({
    minDistance: 5,
    onActivate: panUpdate,
    onUpdate: panUpdate,
    onDeactivate() {
      releaseZone();
    },
  });
  const compGesture = useSimultaneousGestures(tap, pan);
  return (
    <Ctx.Provider
      value={{
        registerZone,
        selectedZone: zoneState,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      >
        {children}
      </View>

      <GestureDetector gesture={compGesture}>
        <Svg
          style={{
            position: "absolute",
            top: origin[1] - radii[1] * 1.25,
            left: origin[0] - radii[1] * 1.25,
            width: radii[1] * 2.5,
            height: radii[1] * 2.5,
            zIndex: eLayers.panManager,
          }}
          viewBox={`${origin[0] - radii[1] * 1.25} ${origin[1] - radii[1] * 1.25} ${radii[1] * 2.5} ${radii[1] * 2.5}`}
        >
          {drawSectors &&
            zoneRefs.map((zone, index) => (
              <RadialZone
                {...zone}
                rotationR={
                  direction === 1 ? zone.rotationR : 44 / 7 - zone.rotationR
                }
                key={index}
                highlight={zoneState === index}
              />
            ))}
        </Svg>
      </GestureDetector>
    </Ctx.Provider>
  );
}
