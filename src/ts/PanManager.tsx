import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from "react-native-gesture-handler";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { fMakeSectorPath } from "./sectorTypes";
import { Dimensions, Share, View } from "react-native";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { eLayers } from "./UserContext";
import { tVerse, useVerse, useVerseRelay } from "./Verse";

export type ePanEvent = "enter" | "leave" | "drag" | "tap";

type tRadialHitBox = {
  shape?: "sector" | "capsule";
  id: string;
  origin: [number, number];
  radii: [number, number];
  capsuleMod?: SharedValue<number>;
  arcLength: number;
  rotationR: number;
  vPanState?: SharedValue<ePanEvent>;
  vPanPos?: SharedValue<{ angle: number; radius: number }>;
  highlight?: boolean;
  priority?: number;
};

//M 0 11 A 11 11 90 0 1 0 -11 H 13 A 11 11 90 0 1 13 11 Z
const RadialHitbox = ({
  origin,
  radii,
  arcLength,
  rotationR,
  shape = "sector",
  highlight = false,
}: tRadialHitBox) => {
  const capsulePath = `M 0 ${radii[0]} A ${radii[0]} ${radii[0]} 90 0 1 0 ${-radii[0]} H ${radii[1] - radii[0]} A ${radii[0]} ${radii[0]} 90 0 1 ${radii[1] - radii[0]} ${radii[0]} Z`;
  const path =
    shape === "capsule"
      ? capsulePath
      : fMakeSectorPath(radii, arcLength, radii[1]);
  ``;

  return (
    <G
      x={origin?.[0]}
      y={origin?.[1]}
      transform={`rotate(${(rotationR * 180) / Math.PI})`}
    >
      <Path
        d={path}
        fill={highlight ? "rgba(255,0,0,0.25)" : "rgba(255,255,255,0.25)"}
        stroke="rgba(0,0,0,0.1)"
      />
    </G>
  );
};

type tPanManager = {
  registerHitBox: (hitbox: tRadialHitBox) => void;
  unregisterHitBox: (id: string) => void;
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
  zIndex = eLayers.panManager,
}: {
  children: React.ReactNode;
  drawSectors?: boolean;
  zIndex?: number;
}) {
  const vPanPos = useSharedValue({ angle: 0, radius: 0 });
  const vHitBoxes = useVerse<Record<string, tRadialHitBox>>({});
  const vCurrentHitBox = useVerse<string | null>(null);

  const vBounds = useVerse<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }>({
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  });
  const registerHitBox = (hitBox: tRadialHitBox) => {
    scheduleOnUI(() => {
      "worklet";
      /*
      )*/

      console.log("Registering hitbox with id:", hitBox);
      if (hitBox.rotationR < 0) {
        hitBox.rotationR = 44 / 7 + hitBox.rotationR;
      } else if (hitBox.rotationR > 44 / 7) {
        hitBox.rotationR = hitBox.rotationR - 44 / 7;
      }
      const newZone = {
        ...hitBox,
        priority: hitBox.priority || 0,
      };
      const updatedHitBoxes = {
        ...vHitBoxes.shared.value,
        [hitBox.id]: newZone,
      };
      vHitBoxes.shared.value = updatedHitBoxes;
      vHitBoxes.dispatch();
      calculateBounds();
    });
  };

  const unregisterHitBox = (id: string) => {
    /*
     */
    scheduleOnUI(() => {
      "worklet";
      const updated = { ...vHitBoxes.shared.value };
      delete updated[id];
      vHitBoxes.shared.value = updated;
      vHitBoxes.dispatch();
      calculateBounds();
      console.log(
        "Unregistered hitbox. Total hitboxes:",
        Object.keys(vHitBoxes.shared.value).length,
      );
    });
  };
  const releaseZone = () => {
    "worklet";
    if (vCurrentHitBox.shared.value !== null) {
      if (vHitBoxes.shared.value[vCurrentHitBox.shared.value].vPanPos) {
        vHitBoxes.shared.value[vCurrentHitBox.shared.value].vPanPos.value =
          vPanPos.value;
      }
      if (vHitBoxes.shared.value[vCurrentHitBox.shared.value].vPanState) {
        vHitBoxes.shared.value[vCurrentHitBox.shared.value].vPanState.value =
          "leave";
      }
      vCurrentHitBox.dispatch(null);
    }
  };
  const panUpdate = (e: { absoluteX: number; absoluteY: number }) => {
    "worklet";
    let foundZone = false;
    const hitBoxesArray = Object.values(vHitBoxes.shared.value);
    hitBoxesArray.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (let i = 0; i < hitBoxesArray.length; i++) {
      const zone = hitBoxesArray[i];
      const x = e.absoluteX;
      const y = e.absoluteY;
      const dx = x - zone.origin[0];
      const dy = y - zone.origin[1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      let angle = Math.atan2(dy, dx);
      if (angle < 0) {
        angle += 44 / 7;
      }
      vPanPos.value = { angle, radius: distance };
      let inZone = false;
      if (zone.shape === "capsule") {
        const dx = e.absoluteX - zone.origin[0];
        const dy = e.absoluteY - zone.origin[1];
        const localX =
          dx * Math.cos(-zone.rotationR) - dy * Math.sin(-zone.rotationR);
        const localY =
          dx * Math.sin(-zone.rotationR) + dy * Math.cos(-zone.rotationR);
        const clampedX = Math.max(
          0,
          Math.min(
            zone.capsuleMod.value * (zone.radii[1] - zone.radii[0]),
            localX,
          ),
        );
        const distX = localX - clampedX;
        const distY = localY;
        inZone = distX * distX + distY * distY <= zone.radii[0] * zone.radii[0];
      } else {
        const inRadius = distance >= zone.radii[0] && distance <= zone.radii[1];
        const angleDiff = Math.abs(angle - zone.rotationR);
        inZone = inRadius && angleDiff <= zone.arcLength / 2;
      }

      if (inZone) {
        foundZone = true;
        zone.vPanPos && (zone.vPanPos.value = { angle, radius: distance });
        if (vCurrentHitBox.shared.value !== zone.id) {
          if (
            vCurrentHitBox.shared.value !== null &&
            vHitBoxes.shared.value[vCurrentHitBox.shared.value].vPanState
          ) {
            vHitBoxes.shared.value[
              vCurrentHitBox.shared.value
            ].vPanState.value = "leave";
          }
          if (zone.vPanState) {
            console.log("Entering zone:", zone.id);
            zone.vPanState.value = "enter";
          }
          vCurrentHitBox.dispatch(zone.id);
        } else if (zone.vPanState) {
          zone.vPanState.value = "drag";
        }
        break;
      }
    }
    if (!foundZone) {
      releaseZone();
    }
  };
  function calculateBounds() {
    "worklet";
    if (Object.keys(vHitBoxes.shared.value).length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    Object.values(vHitBoxes.shared.value).forEach((zone) => {
      if (zone.shape === "capsule") {
        const capRadius = zone.radii[0];
        const bodyLength = zone.radii[1] + zone.radii[0];

        // Capsule endpoints (centers of the semicircular caps)
        const startX = zone.origin[0];
        const startY = zone.origin[1] - capRadius;
        const endX = zone.origin[0] + bodyLength * Math.cos(zone.rotationR);
        const endY =
          zone.origin[1] + bodyLength * Math.sin(zone.rotationR) - capRadius;

        // Account for the radius extending in all directions from endpoints
        const points = [
          { x: startX - capRadius, y: startY - capRadius },
          { x: startX + capRadius, y: startY - capRadius },
          { x: startX - capRadius, y: startY + capRadius },
          { x: startX + capRadius, y: startY + capRadius },
          { x: endX - capRadius, y: endY - capRadius },
          { x: endX + capRadius, y: endY - capRadius },
          { x: endX - capRadius, y: endY + capRadius },
          { x: endX + capRadius, y: endY + capRadius },
        ];

        points.forEach((p) => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
      } else {
        // Sector (original logic)
        const maxRadius = zone.radii[1];
        const angles = [
          zone.rotationR - zone.arcLength / 2,
          zone.rotationR + zone.arcLength / 2,
          zone.rotationR,
        ];

        angles.forEach((angle) => {
          const x = zone.origin[0] + maxRadius * Math.cos(angle);
          const y = zone.origin[1] + maxRadius * Math.sin(angle);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        });

        // Include inner radius points too
        const minRadius = Math.max(0, zone.radii[0]);
        angles.forEach((angle) => {
          const x = zone.origin[0] + minRadius * Math.cos(angle);
          const y = zone.origin[1] + minRadius * Math.sin(angle);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        });
      }

      // Always include origin
      minX = Math.min(minX, zone.origin[0]);
      minY = Math.min(minY, zone.origin[1]);
      maxX = Math.max(maxX, zone.origin[0]);
      maxY = Math.max(maxY, zone.origin[1]);
    });

    vBounds.dispatch({ minX, minY, maxX, maxY });
  }

  const tapUpdate = (e: { absoluteX: number; absoluteY: number }) => {
    "worklet";
    panUpdate(e);
    if (vCurrentHitBox.shared.value !== null) {
      const zone = vHitBoxes.shared.value[vCurrentHitBox.shared.value];
      if (zone.vPanState) {
        zone.vPanState.value = "tap";
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
  const radiusMod = 3;
  const sectors = () => {
    if (!drawSectors) {
      return null;
    }
    const group = Object.values(vHitBoxes.state).map((zone, index) => (
      <RadialHitbox
        {...zone}
        rotationR={zone.rotationR}
        key={index}
        highlight={vCurrentHitBox.state === zone.id}
      />
    ));
    return group;
  };
  const width = vBounds.state.maxX - vBounds.state.minX;
  const height = vBounds.state.maxY - vBounds.state.minY;
  return (
    <Ctx.Provider
      value={{
        registerHitBox,
        unregisterHitBox,
      }}
    >
      {children}
      <View
        style={{
          position: "absolute",
          zIndex: zIndex,
          left: 0,
          top: 0,
        }}
      >
        <GestureDetector gesture={compGesture}>
          <Svg
            style={{
              position: "absolute",
              borderWidth: drawSectors ? 1 : 0,
              backgroundColor: drawSectors ? "rgba(0,0,0,0.05)" : "transparent",
              width: width,
              height: height,
              top: vBounds.state.minY,
              left: vBounds.state.minX,
            }}
            viewBox={`${vBounds.state.minX} ${vBounds.state.minY} ${width} ${height}`}
          >
            {sectors()}
          </Svg>
        </GestureDetector>
      </View>
    </Ctx.Provider>
  );
}
