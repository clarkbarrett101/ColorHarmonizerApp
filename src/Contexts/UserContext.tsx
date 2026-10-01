import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  fGetRandomPalette,
  tCLARColor,
  tColorModel,
  tPaint,
  tPalette,
} from "../utils/CLAcolor";
import { tVerse, useVerse } from "../utils/Verse";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SharedValue, useDerivedValue } from "react-native-reanimated";

export const eLayers = {
  superMax: 2000,
  grabbedChip: 1000,
  buckets: 900,
  chipHand: 800,
  dropScreen: 700,
  chipFan: 600,
  panManager: 500,
  colorMixer: 400,
  background: 10,
};

export type ePages =
  | "Main Menu"
  | "ReColor Camera"
  | "Color Wheel"
  | "Color Mixer"
  | "Undertone Camera"
  | "Color Seasons"
  | "Color Harmonizer"
  | "Palette Library"
  | "Scheme Selector"
  | "Chip Selector"
  | "Color Search"
  | "Find a Color";

export type tPage = {
  vTransition: tVerse<number>;
  vPage: tVerse<ePages>;
};

export type tUserContext = {
  vUserPalette?: tVerse<tPalette>;
  addPaint: (paint: tPaint, index?: number) => void;
  removePaint: (paint: tPaint) => void;
  paintsPresent?: tPaint[];
  vColorModel?: tVerse<tColorModel>;
  vAccentC?: tVerse<number>;
  vAccentL?: tVerse<number>;
  vAccentAR?: tVerse<number>;
  vSelected?: tVerse<number[]>;
  vPage?: tVerse<ePages>;
  dAccentColor?: SharedValue<tCLARColor>;
  pagesVisited?: tVerse<Record<ePages, boolean>>;
};

export const Context = createContext<tUserContext>({
  vUserPalette: null,
  addPaint: () => {},
  removePaint: () => {},
  paintsPresent: [],
  vColorModel: null,
  vAccentC: null,
  vAccentL: null,
  vAccentAR: null,
  vSelected: null,
  vPage: null,
  dAccentColor: null,
  pagesVisited: null,
});
export const useUserContext = () => useContext(Context);

export default function UserContext({
  vPage,
  children,
}: {
  vPage?: tVerse<ePages>;
  children: ReactNode;
}) {
  const paintsPresent = useRef<Record<number, [tPaint, tPaint?]>>({}).current;
  const pagesVisited = useVerse<Record<ePages, boolean>>({
    "Main Menu": false,
    "ReColor Camera": false,
    "Color Wheel": false,
    "Color Mixer": false,
    "Undertone Camera": false,
    "Color Seasons": false,
    "Color Harmonizer": false,
    "Palette Library": false,
    "Scheme Selector": false,
    "Chip Selector": false,
    "Color Search": false,
    "Find a Color": false,
  });
  const vColorModel = useVerse<tColorModel>("RYGB");
  const vAccentC = useVerse<number>(1);
  const vAccentL = useVerse<number>(1);
  const vAccentAR = useVerse<number>(0);
  const dAccentColor = useDerivedValue<tCLARColor>(() => {
    return {
      c: vAccentC.shared.value,
      l: vAccentL.shared.value,
      ar: vAccentAR.shared.value,
    };
  });
  const vSelected = useRef(useVerse<number[]>([])).current;
  const vUserPalette = useVerse<tPalette>({ paints: [], name: "" });
  const loadPalette = async () => {
    try {
      const value = await AsyncStorage.getItem("userPalette");
      if (value !== null) {
        let palette = JSON.parse(value);
        palette = CleanPalette(palette);
        return palette;
      } else {
        console.log("setting empty data");
        const palette = CleanPalette(fGetRandomPalette(5));
        vUserPalette.dispatch(palette);
        let pal = await storePalette();
        return pal;
      }
    } catch (e) {
      console.log(e);
    }
  };
  const storePalette = async () => {
    try {
      const jsonValue = JSON.stringify(vUserPalette.shared.value);
      await AsyncStorage.setItem("userPalette", jsonValue);
      return vUserPalette.shared.value;
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    loadPalette().then((pal) => {
      if (pal) {
        vUserPalette.dispatch(pal);
      }
    });
  }, []);

  useEffect(() => {
    storePalette();
  }, [vUserPalette.state]);

  const addPaint = useCallback(
    (paint: tPaint) => {
      let newPalette = vUserPalette.shared.value;
      newPalette.paints.push(paint);
      vUserPalette.dispatch(CleanPalette(newPalette));
    },
    [vUserPalette.state],
  );

  const removePaint = useCallback(
    (paint: tPaint) => {
      let newPalette = vUserPalette.shared.value;
      newPalette.paints = newPalette.paints.filter((p) => p.hex !== paint.hex);
      console.log(
        "Removing paint:",
        newPalette.paints.map((p) => p.name),
      );
      vUserPalette.dispatch(CleanPalette(newPalette));
    },
    [vUserPalette.state],
  );

  const contextValue = useMemo(
    () => ({
      vUserPalette,
      addPaint,
      removePaint,
      vColorModel,
      paintsPresent: Object.values(paintsPresent).map((pair) => pair[0]),
      vAccentAR,
      vAccentC,
      vAccentL,
      vSelected,
      vPage,
      pagesVisited,
      dAccentColor,
    }),
    [],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
export function CleanPalette(palette: tPalette): tPalette {
  "worklet";
  const pal = { ...palette };
  pal.paints = pal.paints.filter((p) => p !== null && p !== undefined);
  if (pal.paints.length > 0) {
    pal.paints.sort((a, b) => a.clar.l - b.clar.l);
  }
  return pal;
}
