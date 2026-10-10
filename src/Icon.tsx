import { Dimensions, Text } from "react-native";
import {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
  Svg,
} from "react-native-svg";
import { RadialContext } from "./Radials/RadialContext";
import { RadialGraphic } from "./Radials/RadialGraphic";
import { fMakePetalPath, tSector, tSectorGroup } from "./Radials/SectorTypes";
import { fCLARColorToRGB } from "./utils/CLAcolor";
import { tAttributeModifier, tAttributeMap } from "./utils/Actor";
import { View } from "react-native";
import { cDimH, cDimW } from "./utils/ScreenDimensions";
import { eLayers } from "./Contexts/UserContext";
import { Canvas, RoundedRect, Shadow } from "@shopify/react-native-skia";

export default function Icon() {
  const innerRadius = 450;
  const length = 250;
  const radii = [innerRadius, length + innerRadius];
  const centerX = 600 + length;
  const centerY = cDimH(0.5);
  const arcLength = 12 / 7;
  const offset = 100;
  const chord = 13;
  const halfC = Math.floor(chord / 2);
  function fSectorModifier(sector: tSector) {
    const rgb = fCLARColorToRGB(
      {
        c: ((4 - sector.ring) / 4) * 0.3 + 0.7,

        l: (sector.ring / 4) * 0.4 + 0.5,
        ar: (sector.chord / (chord - 1)) * (40 / 7) - 9 / 7,
      },
      "RYGB",
    );
    return {
      ...sector,
      rgb,
    };
  }
  function fSectorGroupModifier(sectorGroup: tSectorGroup) {
    return {
      ...sectorGroup,
      layer: chord - Math.round(Math.abs(chord * 0.45 - sectorGroup.chord)),
      origin: [centerX, centerY],
    };
  }

  const mTransformModifier: tAttributeModifier = {
    modID: 3,
    deps: [],
    modifier: (input: tAttributeMap): tAttributeMap => {
      "worklet";
      const [r, g, b] = fCLARColorToRGB(
        {
          c: 1,
          l: 1,
          ar: (input.chord / (chord - 1)) * (40 / 7) - 9 / 7,
        },
        "RYGB",
      );
      console.log(input.chord, r, g, b);
      const relativeChord = (input.chord - halfC) / halfC;
      const distanceFromCenter = 1.1 - Math.abs(relativeChord);
      const zIndex = 1 + Math.round(distanceFromCenter * chord);
      const tx =
        input.translateX +
        distanceFromCenter * offset * Math.cos(input.rotateZ || 0);
      const ty =
        input.translateY +
        distanceFromCenter * offset * Math.sin(input.rotateZ || 0);
      return {
        ...input,
        zIndex,
        scaleX: distanceFromCenter ** 3 * 0.1 + 1,
        scaleY: distanceFromCenter ** 3 * 0.15 + 1,
        //  shadowColor: b | (g << 8) | (r << 16),
        shadowRadius: 20 * distanceFromCenter ** 2,
      };
    },
  };
  return (
    <>
      <Svg
        style={{
          height: 500,
          width: 1200,
          position: "absolute",
          top: 100,
          zIndex: 0,
          borderWidth: 1,
        }}
        viewBox="0 0 1200 500"
      >
        <Defs>
          <RadialGradient id="grad" cx=".5" cy=".8" r={0.8}>
            <Stop offset="0%" stopColor="rgb(100,20,255)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgb(0,200,175)" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect width="1200" height="500" fill="url(#grad)" />
      </Svg>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          flex: 1,
          shadowColor: "black",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.75,
          shadowRadius: 100,
          transform: [
            { translateX: 0 },
            { translateY: 0 },
            { rotate: "90deg" },
          ],
        }}
      >
        <RadialContext
          value={{
            radii: [radii[0], radii[1]],
            totalArcLength: arcLength,
            totalChords: chord,
            totalRings: 5,
            origin: [centerX, centerY],
            mainRotationR: 22 / 7,
            mTransformModifier,
            fPathFunction: (r, a) => {
              "worklet";
              return fMakePetalPath(r, a, radii[1], 0, 0.2);
            },
          }}
        >
          <RadialGraphic
            fSectorModifier={fSectorModifier}
            fSectorGroupModifier={fSectorGroupModifier}
          />
        </RadialContext>
      </View>
      <Canvas
        style={{
          height: 500,
          width: 1200,
          top: 100,
          left: 0,
          position: "absolute",
          borderWidth: 1,
        }}
      >
        <RoundedRect
          x={0}
          y={0}
          width={1200}
          height={500}
          r={0}
          color="lightblue"
        >
          <Shadow
            dx={0}
            dy={-20}
            blur={35}
            color="rgba(0,0,0,0.75)"
            inner
            shadowOnly
          />
        </RoundedRect>
      </Canvas>

      <View
        style={{
          position: "absolute",
          top: 600,
          zIndex: 10000,
          width: 1200,
          height: 1200,
          backgroundColor: "white",
        }}
      />
    </>
  );
}
