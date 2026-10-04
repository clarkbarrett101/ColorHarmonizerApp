import { Dimensions, TextInput, Text } from "react-native";
import {
  fCLARColorToRGB,
  fCLARColorToString,
  tBrand,
  fDirectColorSearch,
  fAverageColor,
} from "../utils/CLAcolor";
import { RadialContext } from "../Radials/RadialContext";
import { RadialGraphic } from "../Radials/RadialGraphic";
import { fMakePetalPath, tRadialObject, tSector } from "../Radials/SectorTypes";
import { ChipFan } from "../Chips/ChipStack";
import { tPaint } from "../utils/CLAcolor";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { tSectorGroup } from "../Radials/SectorTypes";
import { eLayers, useUserContext } from "../Contexts/UserContext";
import { tAttributeModifier } from "../utils/Actor";
import { PetalBox } from "../Buttons/PetalBox";
import { useDerivedValue } from "react-native-reanimated";
import {
  eChipSizes,
  PaintChip,
  PaintChipPlaceholder,
} from "../Chips/PaintChip";
import { BrandFilter } from "./BrandFilter";
import { useVerse, useVerseRelay } from "../utils/Verse";
import { PetalButton } from "../Buttons/PetalButton";
import { cDimH, cDimW, cRaxelW, cWide } from "../utils/ScreenDimensions";

export default function ColorSearch({
  radii = [400, cRaxelW(0.9, 0.8)],
  origin = [cDimW(0.8), Dimensions.get("window").height / 2],
  chord = 3,
  ring = 5,
  arcLength = cWide ? 9 / 7 : 13 / 7,
}: tRadialObject) {
  const paintsA = useRef<tPaint[]>([]);
  const paintsB = useRef<tPaint[]>([]);
  const offset = useRef(0);
  const vSideA = useVerse<boolean>(false);
  const { vAccentC, vAccentL, vAccentAR, vColorModel } = useUserContext();
  const vACRelay = useVerseRelay(vAccentC);
  const vALRelay = useVerseRelay(vAccentL);
  const vAARRelay = useVerseRelay(vAccentAR);
  const placeHolder = useCallback((): tPaint => {
    return {
      hex: fCLARColorToString(
        {
          c: vACRelay.state ** (1 / 2),
          l: vALRelay.state ** (1 / 2),
          ar: vAARRelay.state,
        },
        vColorModel.state,
      ),
      rgb: [255, 255, 255],
      name: "",
      brand: "All Brands",
      label: "",
      clar: { c: 0, l: 1, ar: 0 },
      yuv: [1, 0, 0],
      ryb: [1, 0, 0],
      hsluv: [0, 0, 1],
    };
  }, [vACRelay.state, vALRelay.state, vAARRelay.state, vColorModel.state]);
  const textDimensions = {
    width: cDimH(0.13),
    height: cDimH(0.035),
  };
  const vBrand = useVerse<tBrand>("All Brands");
  const [label, setLabel] = useState("");
  const [name, setName] = useState("");
  const allResults = useRef<tPaint[]>([]);
  function updateList() {
    allResults.current = fDirectColorSearch({
      label,
      name,
      brand: vBrand.state,
    });
    offset.current = 0;
    onSubmit();
  }
  function onSubmit() {
    console.log("Updating list with offset:", offset.current);
    let avgColor = null;
    if (!vSideA.shared.value) {
      paintsA.current = allResults.current.slice(
        offset.current,
        offset.current + 9,
      );
      avgColor = fAverageColor(paintsA.current);
    } else {
      paintsB.current = allResults.current.slice(
        offset.current,
        offset.current + 9,
      );
      avgColor = fAverageColor(paintsB.current);
    }
    vSideA.dispatch(!vSideA.shared.value);
    console.log("Average color calculated:", avgColor);
    vAARRelay.dispatch(avgColor.ar);
    vACRelay.dispatch(avgColor.c);
    vALRelay.dispatch(avgColor.l);
  }

  useEffect(() => {
    updateList();
  }, [vBrand.state]);
  useEffect(() => {}, []);
  return (
    <>
      <TextInput
        placeholder="Search by Name..."
        enterKeyHint="search"
        style={{
          ...textDimensions,
          borderColor: "gray",
          borderWidth: 1,
          borderRadius: 20,
          top: origin[1] - textDimensions.height * 1,
          left: origin[0] - textDimensions.width / 2,
          zIndex: eLayers.chipFan,
          position: "absolute",
          paddingHorizontal: 10,
          fontSize: cDimH(0.012),
        }}
        value={name}
        onChangeText={(text) => setName(text)}
        onSubmitEditing={updateList}
      />
      <TextInput
        placeholder="Search by Label..."
        enterKeyHint="search"
        style={{
          ...textDimensions,
          borderColor: "gray",
          borderWidth: 1,
          top: origin[1] + textDimensions.height * 0.1,
          left: origin[0] - textDimensions.width / 2,
          zIndex: eLayers.chipFan,
          position: "absolute",
          paddingHorizontal: 10,
          borderRadius: 20,
          textAlign: "center",
          textAlignVertical: "center",
          fontSize: cDimH(0.012),
        }}
        value={label}
        onChangeText={(text) => setLabel(text)}
        onSubmitEditing={updateList}
      />
      <Text
        style={{
          position: "absolute",
          top:
            origin[1] - textDimensions.height / 2 - eChipSizes.grabbed[1] * 0.8,
          left:
            origin[0] - textDimensions.width / 2 - eChipSizes.grabbed[0] * 0.13,
          zIndex: eLayers.colorMixer + 10,
          fontSize: cDimH(0.02),
          fontWeight: "bold",
          fontFamily: "Outfit",
          opacity: 0.5,
          textAlign: "center",
          textAlignVertical: "center",
        }}
      >
        Total Paints Found:{`\n${allResults.current.length}`}
      </Text>
      <PaintChipPlaceholder
        paintA={placeHolder()}
        origin={origin}
        chipID={[eLayers.colorMixer, 0]}
        size={"grabbed"}
      />
      <BrandFilter
        origin={[origin[0], origin[1] + cDimH(0.1)]}
        vBrand={vBrand}
        mainRotationR={11 / 7}
        layer={eLayers.buckets - 10}
      />
      <ChipFan
        origin={[origin[0] + radii[1] / 3, origin[1]]}
        paintsA={paintsA.current}
        paintsB={paintsB.current}
        arcLength={arcLength}
        sideA={vSideA.state}
        radius={radii[1]}
        rotationR={22 / 7}
        groupLayer={eLayers.chipFan}
        size={"default"}
      />
      {offset.current > 0 && (
        <PaintChipPlaceholder
          paintA={placeHolder()}
          origin={[
            origin[0] +
              radii[1] / 3 +
              Math.cos(22 / 7 + arcLength / 2 + 0.1) * radii[1],
            origin[1] + Math.sin(22 / 7 + arcLength / 2 + 0.1) * radii[1],
          ]}
          chipID={[eLayers.chipFan + 50, 1]}
          size={"small"}
          text="( . . . )"
          rotationR={arcLength / 2 + 0.1}
          onPress={() => {
            offset.current = Math.max(offset.current - 9, 0);
            onSubmit();
          }}
        />
      )}
      {allResults.current.length > 9 &&
        offset.current + 9 < allResults.current.length && (
          <PaintChipPlaceholder
            paintA={placeHolder()}
            origin={[
              origin[0] +
                radii[1] / 3 +
                Math.cos(22 / 7 - arcLength / 2 - 0.1) * radii[1] * 1,
              origin[1] + Math.sin(22 / 7 - arcLength / 2 - 0.1) * radii[1] * 1,
            ]}
            chipID={[eLayers.chipFan + 50, 1]}
            size={"small"}
            text="( . . . )"
            rotationR={-arcLength / 2 - 0.1}
            onPress={() => {
              offset.current = Math.min(
                offset.current + 9,
                allResults.current.length - 9,
              );
              onSubmit();
            }}
          />
        )}
    </>
  );
}
