import { View } from "react-native";
import { tRadialHitBox, usePanManager } from "../Contexts/PanManager";
import type { SharedValue } from "react-native-reanimated";
import React, { useEffect } from "react";
import { RadialContext, useRadialContext } from "../Radials/RadialContext";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { tSectorGroup } from "../Radials/SectorTypes";
import { Text } from "react-native-svg";
import { fCLARColorToRGB } from "../utils/CLAcolor";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { PetalBox, tPetalBox } from "./PetalBox";
import { tPanHitBox, usePanHitBox } from "./PanHitBox";
export type tPetalButton = tPetalBox & tPanHitBox;
export function PetalButton(props: tPetalButton) {
  usePanHitBox({
    ...props,
  });
  return <PetalBox {...props} />;
}
