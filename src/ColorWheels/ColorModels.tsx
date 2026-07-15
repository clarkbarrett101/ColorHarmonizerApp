import { Dimensions, Text, View } from "react-native";
import React, { use, useEffect } from "react";
import { type tColorModel } from "../utils/CLAcolor";
import { useUserContext } from "../Contexts/UserContext";
import { ColorScheme } from "../Harmonizer/SchemeSelector";
import { tAttributeModifier } from "../utils/Actor";
import { RadialContext } from "../Radials/RadialContext";
import { eLayers } from "../Contexts/UserContext";
import { ePanEvent, usePanManager } from "../Contexts/PanManager";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { useBucketContext } from "../Buckets/BucketContext";
import { tVerse, useVerse, useVerseRelay } from "../utils/Verse";
import { tRadialObject } from "../Radials/SectorTypes";

export type tColorModels = {
  radii?: [number, number];
  ring?: number;
};
export function ColorModels({ radii = [10, 70], ring = 4 }: tColorModels) {
  const vActive = useVerse<boolean>(false);
  const { vDropScreen } = useBucketContext();
  useEffect(() => {
    if (vActive.state && vDropScreen?.state === false) {
      vActive.dispatch(false);
    }
  }, [vDropScreen?.state]);
  const examples = [
    [0.65, 0.5, 0.0, 0.15],
    [0.3, 0.45, 0.95, 0.8],
  ];
  if (vActive.state) {
    return (
      <>
        <ColorModelSelector
          origin={[
            Math.round(Dimensions.get("window").width / 2),
            Math.round(Dimensions.get("window").height * 0.15),
          ]}
          radii={radii}
          colorModel="RYGB"
          vActive={vActive}
          ring={ring}
          description="Hues are distributed based on the spectral wavelengths of light"
          examples={examples}
        />
        <ColorModelSelector
          origin={[
            Math.round(Dimensions.get("window").width / 2),
            Math.round(Dimensions.get("window").height * 0.4),
          ]}
          radii={radii}
          colorModel="RYB"
          vActive={vActive}
          ring={ring}
          description="Traditional color model with red, yellow, and blue as primary colors"
          examples={examples}
        />
        <ColorModelSelector
          origin={[
            Math.round(Dimensions.get("window").width / 2),
            Math.round(Dimensions.get("window").height * 0.65),
          ]}
          radii={radii}
          colorModel="RGB"
          vActive={vActive}
          ring={ring}
          label={"RGB / CYM"}
          description="Modern color model where hues are distributed based on which colors average to gray when combined"
          examples={examples}
        />
      </>
    );
  } else {
    return (
      <>
        <ColorModelIcon
          origin={[
            Math.round(Dimensions.get("window").width * 0.15),
            Math.round(Dimensions.get("window").height * 0.17),
          ]}
          radii={[radii[0] * 0.5, radii[1] * 0.5]}
          vActive={vActive}
          ring={ring - 1}
          fontSize={radii[1] * 0.25}
        />
      </>
    );
  }
}

export type tColorModelPreview = tRadialObject & {
  colorModel?: tColorModel;
  vActive?: tVerse<boolean>;
  label?: string;
  description?: string;
  examples?: number[][];
  fontSize?: number;
};

function ColorModelIcon({
  origin,
  radii,
  ring,
  vActive,
  fontSize,
}: tColorModelPreview) {
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const { vColorModel } = useUserContext();
  const { vDropScreen } = useBucketContext();

  useEffect(() => {
    if (vActive.state && vDropScreen?.state === false) {
      vActive.dispatch(false);
    }
  }, [vDropScreen?.state]);
  const vColorModelRelay = useVerseRelay(vColorModel);
  const vPanState = useSharedValue<ePanEvent>("leave");
  useEffect(() => {
    registerHitBox({
      id: "ColorModel" + origin,
      origin,
      radii: [0, radii[1]],
      arcLength: 43.9 / 7,
      vPanState,
      priority: 10,
      rotationR: 33 / 7,
    });
    return () => {
      unregisterHitBox("ColorModel" + origin);
    };
  }, []);
  useAnimatedReaction(
    () => vPanState.value,
    (state) => {
      "worklet";
      if (state === "enter" || state === "tap") {
        vDropScreen?.dispatch(true);
        vActive?.dispatch(true);
      }
    },
  );
  return (
    <ColorModelPreview
      colorModel={vColorModelRelay.state}
      origin={origin}
      radii={radii}
      ring={ring}
      fontSize={fontSize}
    />
  );
}

export function ColorModelSelector({
  colorModel,
  vActive,
  origin,
  radii,
  ring,
  label = colorModel,
  description,
  examples,
}: tColorModelPreview) {
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const { vColorModel } = useUserContext();
  const { vDropScreen } = useBucketContext();
  const vPanState = useSharedValue<ePanEvent>("leave");
  useEffect(() => {
    registerHitBox({
      id: "ColorModel" + origin,
      origin,
      radii: [0, radii[1]],
      arcLength: 43.9 / 7,
      vPanState,
      priority: 10,
      rotationR: 11 / 7,
    });
    return () => {
      unregisterHitBox("ColorModel" + origin);
    };
  }, []);
  useAnimatedReaction(
    () => vPanState.value,
    (state) => {
      "worklet";
      if (state === "enter" || state === "tap") {
        console.log("Color model selected:", colorModel);
        vColorModel.dispatch(colorModel);
        vActive?.dispatch(false);
        vDropScreen?.dispatch(false);
      }
    },
  );
  function getExampleColors() {
    const schemes = [];
    if (examples) {
      for (let i = 0; i < examples.length; i++) {
        const example = examples[i].map((angle) => angle * (2 * Math.PI));
        schemes.push(
          <ColorScheme
            colors={example}
            origin={origin}
            radii={[radii[1] + 50, radii[1] + 120]}
            arcLength={4 / 7}
            customModel={colorModel}
            rotationR={(i * 22) / 7}
            ring={3}
            chromaRange={[0.5, 0.9]}
            lumaRange={[0.5, 0.7]}
            bend={0.2}
          />,
        );
      }
    }

    return schemes;
  }
  return (
    <RadialContext
      value={{
        mTransformModifier: {
          modID: 1,
          deps: [],
          modifier: (input) => {
            "worklet";
            return {
              ...input,
              zIndex: eLayers.chipHand + 100,
              shadowOpacity: 0.5,
            };
          },
        },
      }}
    >
      <ColorModelPreview
        colorModel={colorModel}
        origin={origin}
        radii={radii}
        ring={ring}
        label={label}
        description={description}
      />

      {getExampleColors()}
    </RadialContext>
  );
}

function ColorModelPreview({
  colorModel,
  origin,
  radii,
  ring,
  label = colorModel,
  description,
  fontSize = radii[1] * 0.3,
}: tColorModelPreview) {
  let chord = colorModel === "RYGB" ? 8 : 6;
  let rotationR = colorModel === "RYGB" ? 4.7 / 7 : 0;
  const arcLength = (4.5 / 7) * chord;
  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [],
    modifier: (input) => {
      "worklet";
      return {
        ...input,
        rotateZ: input.rotateZ + ((44 / 7 - arcLength) / chord) * input.chord,
        shadowOpacity: 0.5,
        zIndex:
          eLayers.chipHand + (input.chord % 2 === 0 ? 1 : -1) - input.chord,
      };
    },
  };
  const modelColorsArray = [];
  for (let i = 0; i < chord; i++) {
    modelColorsArray[i] = (i / chord) * (44 / 7);
  }
  return (
    <RadialContext
      value={{
        mTransformModifier,
      }}
    >
      <ColorScheme
        origin={origin}
        radii={radii}
        colors={modelColorsArray}
        chord={chord}
        ring={ring}
        arcLength={arcLength}
        customModel={colorModel}
        rotationR={rotationR}
        chromaRange={[0.6, 0.9]}
        lumaRange={[0.5, 0.8]}
      />
      <View
        style={{
          position: "absolute",
          left: origin[0] - radii[1],
          top: origin[1] - radii[1],
          width: radii[1] * 2,
          height: radii[1] * 2,
          justifyContent: "center",
          alignItems: "center",
          zIndex: eLayers.chipHand + 100,
        }}
        pointerEvents="none"
      >
        <Text
          style={{
            fontSize: fontSize,
            textAlign: "center",
            fontFamily: "Outfit",
            fontWeight: "bold",
            color: "white",
          }}
        >
          {label}
        </Text>
        {description && (
          <Text
            style={{
              position: "absolute",
              top: radii[1] * 2,
              fontSize: radii[1] * 0.2,
              textAlign: "center",
              fontFamily: "Outfit",
              color: "black",
              width: radii[1] * 4,
            }}
          >
            {description}
          </Text>
        )}
      </View>
    </RadialContext>
  );
}
