import { Dimensions, PanResponder, View } from "react-native";
import { fCLARColorToRGB } from "./utils/CLAcolor";
import { RadialGraphic } from "./Radials/RadialGraphic";
import { ReactNode, useEffect } from "react";
import { Text } from "react-native-svg";
import {
  useSharedValue,
  useAnimatedReaction,
  withSpring,
} from "react-native-reanimated";
import { tRadialObject, tSector, tSectorGroup } from "./Radials/SectorTypes";
import { tAttributeModifier, tAttributeMap } from "./utils/Actor";
import { RadialContext, wDefaultAngleToChord } from "./Radials/RadialContext";
import { tVerse, useVerse } from "./utils/Verse";
import { ePanEvent, usePanManager } from "./Contexts/PanManager";
import { eLayers, ePages, useUserContext } from "./Contexts/UserContext";

const allPages: ePages[] = [
  "Palette Library",
  "Undertone Camera",
  "ReColor Camera",
  "Color Harmonizer",
  "Color Wheel",
  "Color Mixer",
  "Color Seasons",
  "Color Search",
];

export default function Menu({
  radii = [200, 500],
  rotationR = 22 / 7,
  arcLength = 9 / 7,
  chord = allPages.length,
  ring = 5,
  origin = [
    Dimensions.get("window").width + radii[0],
    Dimensions.get("window").height / 2,
  ],
}: tRadialObject) {
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const { vPage } = useUserContext();
  const vPanPos = useSharedValue({ angle: 21 / 7, radius: 0 });
  const vPanState = useSharedValue<ePanEvent>("enter");
  const vSlowAngle = useSharedValue<number>(0);
  useEffect(() => {
    registerHitBox({
      id: "menu",
      origin,
      radii: [0, Dimensions.get("window").width * 1.5],
      rotationR,
      arcLength,
      vPanPos,
      vPanState,
    });
    return () => {
      unregisterHitBox("menu");
    };
  }, []);
  const { vAccentAR, vAccentC, vAccentL } = useUserContext();
  useEffect(() => {
    vAccentC.shared.value = 0.75;
    vAccentL.shared.value = 0.9;
  }, [vAccentC, vAccentL]);
  useAnimatedReaction(
    () => vPanState.value,
    (state) => {
      if (state === "release" || state === "tap") {
        const adjustedAngle = vPanPos.value.angle - rotationR + arcLength / 2;
        const nearestChord = Math.max(
          Math.min(Math.floor(adjustedAngle / (arcLength / chord)), chord - 1),
          0,
        );
        vPage?.dispatch(allPages[nearestChord]);
      }
    },
  );
  useAnimatedReaction(
    () => vPanPos.value,
    (pos) => {
      vSlowAngle.value = withSpring(pos.angle, {
        damping: 100,
        stiffness: 1000,
      });
      const pChord = wDefaultAngleToChord(
        pos.angle,
        arcLength,
        chord,
        rotationR,
      );
      vAccentAR.shared.value = withSpring(
        22 / 7 + (pChord / (chord - 1)) * (22 / 7),
      );
    },
  );

  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [vSlowAngle],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let diff = 1 - Math.abs(input.rotateZ - vSlowAngle.value) / arcLength;
      return {
        ...input,
        translateX: input.translateX + diff * radii[0] * 0.2,
        scaleX: 1 + Math.max(0, diff - 0.9),
        scaleY: 1 + Math.max(0, diff - 0.9),
        zIndex: eLayers.colorMixer + Math.round(diff * chord),
      };
    },
  };
  function fSectorModifier(sector: tSector) {
    const rgb = fCLARColorToRGB(
      {
        c: (sector.ring / (ring - 1)) * 0.4 + 0.4,
        l: (sector.ring / (ring - 1)) * 0.4 + 0.4,
        ar: 22 / 7 + (sector.chord / (chord - 1)) * (22 / 7),
      },
      "RYGB",
    );
    return {
      ...sector,
      arcLength: sector.arcLength,
      rgb,
    };
  }
  function fSectorGroupModifier(sectorGroup: tSectorGroup) {
    return {
      ...sectorGroup,
      children: (
        <Text
          fill="white"
          x={(radii[0] + radii[1]) * -0.5}
          y={7}
          fontSize={30}
          fontFamily="Outfit"
          textAnchor="middle"
          fontWeight={600}
          transform={[{ rotate: 22 / 7 + "rad" }]}
        >
          {allPages[sectorGroup.sectorGroupID]}
        </Text>
      ),
    };
  }
  return (
    <RadialContext
      value={{
        mTransformModifier,
        origin,
        totalRings: ring,
        totalChords: chord,
        radii,
      }}
    >
      <RadialGraphic
        radii={radii}
        chord={chord}
        ring={ring}
        arcLength={arcLength}
        rotationR={rotationR}
        fSectorModifier={fSectorModifier}
        fSectorGroupModifier={fSectorGroupModifier}
        origin={origin}
      />
    </RadialContext>
  );
}
