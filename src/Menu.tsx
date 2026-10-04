import { Dimensions } from "react-native";
import { useDemo } from "./Contexts/DemoContext";
import { fCLARColorToRGB } from "./utils/CLAcolor";
import { RadialGraphic } from "./Radials/RadialGraphic";
import { useEffect } from "react";
import Svg, {
  Text,
  G,
  TextProps,
  Defs,
  RadialGradient,
  Stop,
  Rect,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  withSpring,
  useAnimatedProps,
  useDerivedValue,
  runOnJS,
} from "react-native-reanimated";
import { tRadialObject, tSector, tSectorGroup } from "./Radials/SectorTypes";
import { tAttributeModifier, tAttributeMap } from "./utils/Actor";
import { RadialContext, wDefaultAngleToChord } from "./Radials/RadialContext";
import { useVerseRelay } from "./utils/Verse";
import { ePanEvent, usePanManager } from "./Contexts/PanManager";
import { eLayers, ePages, useUserContext } from "./Contexts/UserContext";
import {
  cDimH,
  cDimW,
  cRaxelW,
  cRaxelH,
  cWide,
} from "./utils/ScreenDimensions";
import Paths from "./utils/Paths";
import { SharedValue } from "react-native-gesture-handler/lib/typescript/v3/types";
import Button from "./Buttons/Button";
import { scheduleOnRN } from "react-native-worklets";
import { useSoundContext } from "./Contexts/SoundContext";
import { usePurchaseContext } from "./Contexts/PurchaseContext";
import React from "react";
const mainPages = [
  "ReColor Camera",
  "Undertone Camera",
  "Palette Library",
  "Color Search",
  "Color Seasons",
  "Color Mixer",
  "Color Wheel",
  "Color Harmonizer",
] as const satisfies readonly ePages[];
const searchPages = ["Main Menu", ,] as const satisfies readonly ePages[];
type tMenuPage = (typeof mainPages)[number] | (typeof searchPages)[number];

export default function Menu({
  radii = [cDimW(0.3), cRaxelW(1.2, 0.9)],
  rotationR = 21 / 7,
  arcLength = cWide ? 9 / 7 : 9 / 7,
  chord = mainPages.length,
  ring = 5,
  origin = [cDimW() + radii[0], cRaxelH(0.5, 0.45)],
}: tRadialObject) {
  const { fPlayTick } = useSoundContext();
  const { registerHitBox, unregisterHitBox } = usePanManager();
  const { vPage, pagesVisited } = useUserContext();
  const [isSearchMenu, setIsSearchMenu] = React.useState(false);
  const activePages = isSearchMenu ? searchPages : mainPages;
  const activeChord = activePages.length;
  const vPanPos = useSharedValue({
    angle: rotationR + arcLength / 2,
    radius: 0,
  });
  const vPanState = useSharedValue<ePanEvent>("enter");
  const vSlowAngle = useSharedValue<number>(0);
  const vIsSearchMenu = useSharedValue(false);
  useEffect(() => {
    vIsSearchMenu.value = isSearchMenu;
  }, [isSearchMenu, vIsSearchMenu]);
  const dSelection = useDerivedValue(() => {
    const selectedChord = vIsSearchMenu.value
      ? searchPages.length
      : mainPages.length;
    let nearestChord = wDefaultAngleToChord(
      vSlowAngle.value,
      arcLength,
      selectedChord,
      rotationR,
    );
    nearestChord = Math.max(Math.min(nearestChord, selectedChord - 1), 0);
    return nearestChord;
  });
  useAnimatedReaction(
    () => dSelection.value,
    (nearestChord) => {
      scheduleOnRN(fPlayTick);
    },
  );
  const { fPlaySequence } = useDemo();

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
  const vPagesVisitedRelay = useVerseRelay(pagesVisited);
  useEffect(() => {
    if (!pagesVisited.shared.value["Main Menu"]) {
      fPlaySequence([
        {
          touching: 0,
          toPos: [cDimW(0.5), cDimH(0.3)],
          duration: 2000,
        },
        {
          touching: 1,
          toPos: [cDimW(0.5), cDimH(0.8)],
          duration: 2000,
        },
        {
          touching: 1,
          toPos: [cDimW(0.5), cDimH(0.2)],
          duration: 2000,
        },
        {
          touching: -1,
          toPos: [-100, -100],
          duration: 100,
        },
      ]);
      pagesVisited.dispatch({
        ...pagesVisited.shared.value,
        "Main Menu": true,
      });
    }
  }, [vPagesVisitedRelay.state]);
  const { vAccentAR, vAccentC, vAccentL, dAccentColor } = useUserContext();
  useEffect(() => {
    vAccentC.shared.value = 0.75;
    vAccentL.shared.value = 0.9;
  }, [vAccentC, vAccentL]);
  useAnimatedReaction(
    () => vPanState.value,
    (state) => {
      if (state === "release" || state === "tap") {
        const selectedChord = vIsSearchMenu.value
          ? searchPages.length
          : mainPages.length;
        const selectedPages = vIsSearchMenu.value ? searchPages : mainPages;
        const adjustedAngle = vPanPos.value.angle - rotationR + arcLength / 2;
        const nearestChord = Math.max(
          Math.min(
            Math.floor(adjustedAngle / (arcLength / selectedChord)),
            selectedChord - 1,
          ),
          0,
        );
        const selectedPage = selectedPages[nearestChord];
        if (selectedPage === "Find a Color" || selectedPage === "Main Menu") {
          vIsSearchMenu.value = !vIsSearchMenu.value;
          scheduleOnRN(setIsSearchMenu, vIsSearchMenu.value);
          return;
        }
        vPage?.dispatch(selectedPage);
      }
    },
  );

  useAnimatedReaction(
    () => vPanPos.value,
    (pos) => {
      const selectedChord = vIsSearchMenu.value
        ? searchPages.length
        : mainPages.length;
      vSlowAngle.value = withSpring(pos.angle, {
        damping: 100,
        stiffness: 1000,
      });
      const pChord = wDefaultAngleToChord(
        pos.angle,
        arcLength,
        selectedChord,
        rotationR,
      );
      vAccentAR.shared.value = withSpring(
        22 / 7 + (pChord / (selectedChord - 1)) * (22 / 7),
      );
    },
  );
  const { premium } = usePurchaseContext();
  const mTransformModifier: tAttributeModifier = {
    modID: 1,
    deps: [vSlowAngle],
    modifier: (input: tAttributeMap) => {
      "worklet";
      let diff = 1 - Math.abs(input.rotateZ - vSlowAngle.value) / arcLength;
      diff = Math.max(diff, 0);
      return {
        ...input,
        translateX: input.translateX + diff * radii[0] * 0.2,
        translateY:
          input.translateY + (1 - input.chord / (mainPages.length - 1)) * 30,
        scaleX: 1 + Math.max(0, diff - 0.9),
        scaleY: 1 + Math.max(0, diff - 0.9),
        zIndex:
          eLayers.colorMixer +
          Math.round(diff * Math.max(mainPages.length, searchPages.length)),
      };
    },
  };
  function fSectorModifier(sector: tSector) {
    const colorChord = Math.max(activeChord - 1, 1);
    const rgb = fCLARColorToRGB(
      {
        c:
          sector.chord > 1 || premium
            ? (sector.ring / (ring - 1)) * 0.4 + 0.4
            : 0.1,
        l: (sector.ring / (ring - 1)) * 0.4 + 0.4,
        ar: (sector.chord / colorChord) * (23 / 7) + 20 / 7,
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
    let label: string = activePages[sectorGroup.sectorGroupID];
    if (label === "Main Menu") label = "Back";
    return {
      ...sectorGroup,
      children: (
        <Text
          fill="white"
          x={(radii[0] + radii[1]) * -0.5}
          y={7}
          fontSize={cDimH(0.03)}
          fontFamily="Outfit"
          textAnchor="middle"
          fontWeight={600}
          transform={[{ rotate: 22 / 7 + "rad" }]}
        >
          {label}
        </Text>
      ),
    };
  }
  const vSelectedPage = useDerivedValue(() => {
    const selectedPages = vIsSearchMenu.value ? searchPages : mainPages;
    return selectedPages[dSelection.value];
  });

  return (
    <>
      <RadialContext
        value={{
          mTransformModifier,
          origin,
          totalRings: ring,
          totalChords: activeChord,
          radii,
        }}
      >
        <RadialGraphic
          radii={radii}
          chord={activeChord}
          ring={ring}
          arcLength={arcLength}
          rotationR={rotationR}
          fSectorModifier={fSectorModifier}
          fSectorGroupModifier={fSectorGroupModifier}
          origin={origin}
        />
      </RadialContext>
      <Svg
        style={{
          position: "absolute",
          left: 0,
          top: cRaxelH(0.1, 0.25),
          zIndex: eLayers.buckets,
        }}
        width={cRaxelW(1, 0.4)}
        height={cRaxelH(0.15, 0.5)}
        viewBox={`-200 -75 400 150`}
      >
        <Defs>
          <RadialGradient id="grad2" cx="50%" cy="50%" r="50%">
            <Stop stopColor={"white"} offset={0} stopOpacity={0.8} />
            <Stop stopColor={"white"} offset={1} stopOpacity={0.2} />
          </RadialGradient>
        </Defs>
        <Rect x={-250} y={-100} width={500} height={200} fill="url(#grad2)" />
        <PageDescription vPage={vSelectedPage} />
      </Svg>
      <Button
        path={Paths.replay}
        layer={eLayers.superMax}
        size={cDimH(0.05)}
        origin={[cDimH(0.05), cDimH(0.07)]}
        viewRadius={30}
        onPress={() => {
          pagesVisited.dispatch({
            ...pagesVisited.shared.value,
            "Main Menu": false,
          });
        }}
      />
    </>
  );
}
const AnimatedGroup = Animated.createAnimatedComponent(G);
function DoubleText({
  targetPage,
  vPage,
  children,
  fill,
  stroke,
  ...props
}: {
  children: React.ReactNode;
  vPage?: SharedValue<tMenuPage>;
  targetPage: tMenuPage;
} & TextProps) {
  const animatedProps = useAnimatedProps(() => {
    "worklet";
    return {
      opacity: vPage?.value === targetPage ? 1 : 0,
    };
  });
  return (
    <AnimatedGroup animatedProps={animatedProps}>
      <Text fill={stroke} stroke={stroke} strokeWidth={2} {...props}>
        {children}
      </Text>
      <Text fill={fill} {...props}>
        {children}
      </Text>
    </AnimatedGroup>
  );
}
function PageDescription({ vPage }: { vPage: SharedValue<tMenuPage> }) {
  const textProps: TextProps & { vPage: SharedValue<tMenuPage> } = {
    x: 0,
    y: 0,
    textAnchor: "middle",
    alignmentBaseline: "middle",
    fill: "white",
    fontFamily: "Outfit",
    fontSize: 20,
    fontWeight: "800",
    vPage,
    letterSpacing: 1,
  };

  return (
    <>
      <DoubleText
        {...textProps}
        fontSize={30}
        stroke="black"
        targetPage="Color Search"
      >
        Find paints by name or label
      </DoubleText>

      <DoubleText
        {...textProps}
        dy={-50}
        stroke="black"
        targetPage="Color Seasons"
      >
        Find paints that are more:
      </DoubleText>
      <DoubleText
        {...textProps}
        fill="rgb(255, 225, 0)"
        stroke="rgb(75, 75, 0)"
        dy={-25}
        dx={-60}
        targetPage="Color Seasons"
      >
        Spring (warm and bright)
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={0}
        fill={"rgb(175, 255, 255)"}
        stroke={"rgb(75, 150, 100)"}
        dx={-30}
        targetPage="Color Seasons"
      >
        Summer (cool and light)
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={25}
        fill={"rgb(200, 100, 50)"}
        dx={30}
        stroke={"rgb(255, 200, 50)"}
        targetPage="Color Seasons"
      >
        Autumn (warm and muted)
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={50}
        fill={"rgb(100, 100, 200)"}
        stroke={"rgb(150, 150, 255)"}
        targetPage="Color Seasons"
        dx={60}
      >
        Winter (cool and deep)
      </DoubleText>

      <DoubleText
        {...textProps}
        stroke="black"
        targetPage="Color Mixer"
        dy={-40}
      >
        Find paints by adding more:
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={0}
        dx={-80}
        stroke="rgb(100,0,0)"
        fill="rgb(255, 200, 200)"
        targetPage="Color Mixer"
        fontSize={24}
      >
        Red
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={-0}
        dx={0}
        stroke="rgb(100,100,0)"
        fill="rgb(255, 255, 200)"
        targetPage="Color Mixer"
        fontSize={24}
      >
        Yellow
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={-0}
        dx={80}
        stroke="rgb(0,0,100)"
        fill="rgb(200, 200, 255)"
        targetPage="Color Mixer"
        fontSize={24}
      >
        Blue
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={40}
        dx={-80}
        stroke="rgb(100,100,100)"
        fill="rgb(255, 255, 255)"
        targetPage="Color Mixer"
        fontSize={24}
      >
        White
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={40}
        dx={0}
        stroke="rgb(0,0,0)"
        fill="rgb(200, 200, 200)"
        targetPage="Color Mixer"
        fontSize={24}
      >
        Gray
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={40}
        dx={80}
        stroke="rgb(150,150,150)"
        fill="rgb(0, 0, 0)"
        targetPage="Color Mixer"
        fontSize={24}
      >
        Black
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={-20}
        dx={0}
        stroke="black"
        targetPage="Color Wheel"
        fontSize={24}
      >
        Use a color wheel to find a paint
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={20}
        dx={0}
        stroke="black"
        targetPage="Color Wheel"
        fontSize={24}
      >
        and it's tints and shades
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={-30}
        dx={0}
        stroke="black"
        targetPage="Color Harmonizer"
        fontSize={24}
      >
        Choose two colors and find
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={0}
        dx={0}
        stroke="black"
        targetPage="Color Harmonizer"
        fontSize={24}
      >
        additional colors that create
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={30}
        dx={0}
        stroke="black"
        targetPage="Color Harmonizer"
        fontSize={24}
      >
        a harmonious color scheme
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={-20}
        dx={0}
        stroke="black"
        targetPage="ReColor Camera"
        fontSize={24}
      >
        Use your camera to change the color
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={20}
        dx={0}
        stroke="black"
        targetPage="ReColor Camera"
        fontSize={24}
      >
        of a surface in real-time
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={-30}
        dx={0}
        stroke="black"
        targetPage="Undertone Camera"
        fontSize={24}
      >
        Use your camera to find the
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={0}
        dx={0}
        stroke="black"
        targetPage="Undertone Camera"
        fontSize={24}
      >
        undertone color of surfaces to
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={30}
        dx={0}
        stroke="black"
        targetPage="Undertone Camera"
        fontSize={24}
      >
        build a harmonious color scheme
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={-0}
        dx={0}
        stroke="black"
        targetPage="Palette Library"
        fontSize={24}
      >
        Save and manage your Color Palettes
      </DoubleText>
      <DoubleText
        {...textProps}
        dy={0}
        dx={0}
        stroke="black"
        targetPage="Find a Color"
        fontSize={24}
      >
        Search for the perfect paint color
      </DoubleText>
    </>
  );
}
