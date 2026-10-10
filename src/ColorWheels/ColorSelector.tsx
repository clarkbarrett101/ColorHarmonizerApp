import { useCallback, useEffect } from "react";
import { fCLARColorToRGB, tBrand, tCLARColor, tPaint } from "../utils/CLAcolor";
import { ColorWheel } from "../ColorWheels/ColorWheel";
import { TintSelector } from "../ColorWheels/TintSelector";
import { Dimensions } from "react-native";
import {
  RadialContext,
  wDefaultAngleToChord,
  wDefaultChordToAngle,
} from "../Radials/RadialContext";
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { ColorChipFan } from "../Chips/ChipStack";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { eChipSizes } from "../Chips/PaintChip";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { useBucketContext } from "../Buckets/BucketContext";
import { tAttributeModifier } from "../utils/Actor";
import { tRadialObject } from "../Radials/SectorTypes";
import { BrandFilter } from "../ColorWheels/BrandFilter";
import { Paths } from "../utils/Paths";
import React from "react";
import { useDemo } from "../Contexts/DemoContext";
import {
  cDimW,
  cDimH,
  cRaxelW,
  cRaxelH,
  cWide,
} from "../utils/ScreenDimensions";
import Button from "../Buttons/Button";
import { useChipContext } from "../Chips/ChipContext";
import { useSoundContext } from "../Contexts/SoundContext";
import { scheduleOnRN } from "react-native-worklets";

type tColorSelector = tRadialObject & {
  wheelCenter?: number;
  direction?: 1 | -1;
  litDimensions?: [number, number];
  litRange?: [number, number];
  chromaRange?: [number, number];
  chromaDimensions?: [number, number];
  chromaArcRotation?: [number, number];
  lightnessArcRotation?: [number, number];
};

export default function ColorSelector({
  wheelCenter = 22 / 7,
  radii = [cRaxelW(0.1, 0.1), cRaxelH(0.28, 0.38)],
  litDimensions = [4, 5],
  litRange = [0.15, 1],
  chromaRange = [0.1, 0.8],
  chromaDimensions = [4, 4],
  chromaArcRotation = [4.4 / 7, 16 / 7],
  lightnessArcRotation = [5.5 / 7, 28 / 7],
  origin = [cDimW() + radii[1] * 0.2, cDimH(0.45)],
}: tColorSelector) {
  /// O N  M O U N T ///

  const vSideA = useVerse(true);
  const vTargetColor = useVerse<tCLARColor>({
    c: 0.5,
    l: 0.5,
    ar: 33 / 7,
  });
  const vBrand = useVerse<tBrand>("All Brands");
  const vChromaPanPos = useSharedValue({
    angle: chromaArcRotation[1] + chromaArcRotation[0] / 3,
    radius: radii[1],
  });
  const vLightnessPanPos = useSharedValue({
    angle: lightnessArcRotation[1],
    radius: radii[1],
  });
  const { registerBucket, unregisterBucket } = useBucketContext();

  useEffect(() => {
    registerBucket({
      origin: [cDimW() - eChipSizes.default[0] / 3, cDimH(0.5)],
      radii: [radii[1] - 75, radii[1]],
      callback: fOnDrop,
      targetLayerRange: [eLayers.chipHand, eLayers.chipHand + 100],
      id: 20,
      path: Paths.search,
    });
    return () => {
      unregisterBucket("" + 20);
    };
  }, []);

  const { vAccentC, vAccentAR, vAccentL, vColorModel, pagesVisited } =
    useUserContext();

  /// C L AR  C O L O R ///

  const dChroma = useDerivedValue(() => {
    let c = Math.max(
      Math.min(
        vChromaPanPos.value.angle,
        chromaArcRotation[1] + chromaArcRotation[0] / 2,
      ),
      chromaArcRotation[1] - chromaArcRotation[0] / 2,
    );
    c =
      (vChromaPanPos.value.angle -
        chromaArcRotation[1] +
        chromaArcRotation[0] / 2) /
      chromaArcRotation[0];
    //  c = (c - 0.5 / chromaDimensions[1]) / (1 - 1 / chromaDimensions[1]);
    c = chromaRange[0] + c * (chromaRange[1] - chromaRange[0]);
    c = Math.max(chromaRange[0], Math.min(c, chromaRange[1]));
    c = Math.round(c * 100) / 100;
    return c;
  });
  const dLuma = useDerivedValue(() => {
    let l = Math.max(
      Math.min(
        vLightnessPanPos.value.angle,
        lightnessArcRotation[1] + lightnessArcRotation[0] / 2,
      ),
      lightnessArcRotation[1] - lightnessArcRotation[0] / 2,
    );
    l =
      1 -
      (l - (lightnessArcRotation[1] - lightnessArcRotation[0] / 2)) /
        lightnessArcRotation[0];
    // l = (l - 0.5 / litDimensions[1]) / (1 - 1 / litDimensions[1]);
    l = litRange[0] + l * (litRange[1] - litRange[0]);
    l = Math.max(litRange[0], Math.min(l, litRange[1]));
    l = Math.round(l * 100) / 100;
    return l;
  });

  const dAngleR = useDerivedValue(() => {
    let ar = ((vAccentAR.shared.value % (44 / 7)) + 44 / 7) % (44 / 7);
    ar = Math.round(ar * 100) / 100;
    return ar;
  });

  function wUpdateState() {
    "worklet";
    vTargetColor.dispatch({
      c: dChroma.value,
      l: dLuma.value,
      ar: dAngleR.value,
    });
    vSideA.dispatch(!vSideA.shared.value);
    console.log(
      "Dispatching color",
      vTargetColor.shared.value,
      "to chip selector",
      "vSideA.shared.value",
      vSideA.shared.value,
    );
  }
  const dChromaSubdivision = useDerivedValue(() => {
    return wDefaultAngleToChord(
      vChromaPanPos.value.angle,
      chromaArcRotation[0],
      chromaDimensions[1],
      chromaArcRotation[1],
    );
  });
  const dLightnessSubdivision = useDerivedValue(() => {
    return wDefaultAngleToChord(
      vLightnessPanPos.value.angle,
      lightnessArcRotation[0],
      litDimensions[1],
      lightnessArcRotation[1],
    );
  });
  const dHueSubdivision = useDerivedValue(() => {
    return wDefaultAngleToChord(vAccentAR.shared.value, 44 / 7, 24, 0);
  });
  useAnimatedReaction(
    () => {
      return [dChroma.value, dLuma.value];
    },
    (clar) => {
      vAccentC.shared.value = clar[0];
      vAccentL.shared.value = clar[1];
    },
  );
  const { fPlayTick } = useSoundContext();
  useAnimatedReaction(
    () => {
      return [
        dChromaSubdivision.value,
        dLightnessSubdivision.value,
        dHueSubdivision.value,
      ];
    },
    (next, prev) => {
      if (
        !prev ||
        next[0] !== prev[0] ||
        next[1] !== prev[1] ||
        next[2] !== prev[2]
      ) {
        scheduleOnRN(fPlayTick);
        wUpdateState();
      }
    },
  );

  const chromaModifier: tAttributeModifier = {
    modID: 0,
    deps: [dChroma, dLuma, dAngleR, vColorModel.shared],
    modifier: (input) => {
      "worklet";
      let chord = input.chord / (chromaDimensions[1] - 1);
      let rd = input.ring / (chromaDimensions[0] - 1);
      let c = chromaRange[0] + chord * (chromaRange[1] - chromaRange[0]);
      rd = 0.5 + rd * 0.5;
      c *= rd;
      const l = dLuma.value * rd;
      const ar = dAngleR.value;
      const [r, g, b] = fCLARColorToRGB({ c, l, ar }, vColorModel.shared.value);
      return {
        ...input,
        red: r,
        green: g,
        blue: b,
      };
    },
  };

  const lightnessModifier: tAttributeModifier = {
    modID: 1,
    deps: [dLuma, dChroma, dAngleR, vColorModel.shared],
    modifier: (input) => {
      "worklet";
      let l = 1 - (input.chord + 0.5) / (litDimensions[1] - 1);
      l = litRange[0] + l * (litRange[1] - litRange[0]);
      let r = input.ring / (litDimensions[0] - 1);
      l *= r * 0.25 + 0.75;
      r = 0.5 + r * 0.5;
      const c = dChroma.value * r;
      const ar = dAngleR.value;
      const [red, green, blue] = fCLARColorToRGB(
        { c, l, ar },
        vColorModel.shared.value,
      );
      return {
        ...input,
        red,
        green,
        blue,
      };
    },
  };
  /// C A L L B A C K S ///
  function fNearestColor(clar: tCLARColor): tCLARColor {
    "worklet";
    const color = { ...clar };
    color.ar = wDefaultChordToAngle(
      wDefaultAngleToChord(color.ar, 44 / 7, 24, 0),
      44 / 7,
      24,
      0,
    );
    color.l = Math.floor(color.l * litDimensions[1]) / (litDimensions[1] - 1);
    color.c =
      Math.floor(color.c * chromaDimensions[1]) / (chromaDimensions[1] - 1);
    return color;
  }

  const fOnDrop = useCallback((paint: tPaint) => {
    const clar = fNearestColor(paint.clar);
    vAccentAR.shared.value = clar.ar;
    vLightnessPanPos.value = {
      angle:
        clar.l * lightnessArcRotation[0] +
        lightnessArcRotation[1] -
        lightnessArcRotation[0] / 2,
      radius: radii[1],
    };
    vChromaPanPos.value = {
      angle:
        clar.c * chromaArcRotation[0] +
        chromaArcRotation[1] -
        chromaArcRotation[0] / 2,
      radius: radii[1],
    };
    wUpdateState();
  }, []);

  useEffect(() => {
    console.log("vBrand.state changed", vBrand.state);
    wUpdateState();
  }, [vBrand.state]);

  const { fPlaySequence } = useDemo();
  const { holdChip } = useChipContext();

  const vPagesVisitedRelay = useVerseRelay(pagesVisited);
  useEffect(() => {
    if (!pagesVisited.shared.value["Color Wheel"]) {
      pagesVisited.dispatch({
        ...pagesVisited.shared.value,
        "Color Wheel": true,
      });
      fPlaySequence([
        {
          touching: 0,
          toPos: [cDimW(0.7), origin[1]],
          duration: 1000,
        },
        {
          touching: 1,
          toPos: [cDimW(0.9), origin[1] + 100],
          duration: 1000,
        },
        {
          touching: 0,
          toPos: [cDimW(0.65), cDimH(0.2)],
          duration: 2000,
        },
        {
          touching: 1,
          toPos: [cDimW(0.6), cDimH(0.3)],
          duration: 1000,
        },
        {
          touching: 0,
          toPos: [cDimW(0.65), cDimH(0.7)],
          duration: 2000,
        },
        {
          touching: 1,
          toPos: [cDimW(0.75), cDimH(0.75)],
          duration: 1000,
        },
        {
          touching: 0,
          toPos: [cDimW(0.2), cDimH(0.5)],
          duration: 2000,
          callback: () => {
            "worklet";
            holdChip(eLayers.chipFan + 5);
          },
        },
        {
          touching: 1,
          toPos: [cDimW(0.5), cDimH(0.5)],
          duration: 2000,
          callback: () => {
            "worklet";
            holdChip();
          },
        },
        {
          touching: 0,
          toPos: [-100, cDimH(0.5)],
          duration: 1000,
        },
      ]);
    } else {
      console.log("Color Wheel has already been visited.");
    }
  }, [vPagesVisitedRelay.state]);

  /// R E N D E R ///

  return (
    <>
      <RadialContext
        value={{
          radii,
          origin,
          wUpdateState,
        }}
      >
        <TintSelector
          key={`Lightness Selector`}
          arcLength={lightnessArcRotation[0]}
          rotationR={lightnessArcRotation[1]}
          ring={litDimensions[0]}
          chord={litDimensions[1]}
          radii={[radii[1] * 0.8, radii[1] * 1.25]}
          vPanPos={vLightnessPanPos}
          colorModifier={lightnessModifier}
        />
        <TintSelector
          key={`Chroma Selector`}
          arcLength={chromaArcRotation[0]}
          rotationR={chromaArcRotation[1]}
          ring={chromaDimensions[0]}
          chord={chromaDimensions[1]}
          radii={[radii[1] * 0.8, radii[1] * 1.25]}
          vPanPos={vChromaPanPos}
          colorModifier={chromaModifier}
        />
        <ColorWheel
          radii={radii}
          ring={5}
          chord={24}
          wheelCenter={wheelCenter}
          draggable={true}
          offsetLevel={cDimW(0.1)}
        />
      </RadialContext>
      <BrandFilter
        vBrand={vBrand}
        layer={eLayers.buckets}
        mainRotationR={11 / 7}
        origin={[cRaxelW(0.87, 0.07), cRaxelH(0.07, 0.23)]}
      />
      <ColorChipFan
        targetColor={vTargetColor.state}
        targetNumber={cWide ? 11 : 9}
        brand={vBrand.state}
        origin={origin}
        size={"default"}
        rotationR={21.5 / 7}
        arcLength={cWide ? 11 / 7 : 13 / 7}
        radius={radii[1] * 1.6}
        cSteps={chromaDimensions[1]}
        lSteps={litDimensions[1]}
        sideA={vSideA.state}
        arSteps={24}
        groupLayer={eLayers.chipFan}
      />
      <Button
        path={Paths.replay}
        layer={eLayers.superMax}
        origin={[cDimH(0.05), cDimH(0.14)]}
        size={cDimH(0.05)}
        viewRadius={30}
        onPress={() => {
          pagesVisited.dispatch({
            ...pagesVisited.shared.value,
            "Color Wheel": false,
          });
        }}
      />
    </>
  );
}
