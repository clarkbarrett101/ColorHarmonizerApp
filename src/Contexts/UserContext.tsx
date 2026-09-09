import React, {
  createContext,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fGetRandomPalette,
  tCLARColor,
  tColorModel,
  tPaint,
  tPalette,
} from "../utils/CLAcolor";
import { tVerse, useVerse } from "../utils/Verse";
import { tActor } from "../utils/Actor";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export type tUserContext = {
  userPalette: tPalette;
  setUserPalette?: React.Dispatch<React.SetStateAction<tPalette>>;
  addPaint: (paint: tPaint, index?: number) => void;
  removePaint: (paint: tPaint) => void;
  paintsPresent?: tPaint[];
  vColorModel?: tVerse<tColorModel>;
  vAccentC?: tVerse<number>;
  vAccentL?: tVerse<number>;
  vAccentAR?: tVerse<number>;
  vSelected?: tVerse<number[]>;
};

export const Context = createContext<tUserContext>({
  userPalette: null,
  addPaint: () => {},
  removePaint: () => {},
  paintsPresent: [],
  vColorModel: null,
  vAccentC: null,
  vAccentL: null,
  vAccentAR: null,
  vSelected: null,
});
export const useUserContext = () => useContext(Context);

export default function UserContext({ children }: { children: ReactNode }) {
  const allChipActors = useRef<Record<number, tActor>>({}).current;
  const paintsPresent = useRef<Record<number, [tPaint, tPaint?]>>({}).current;
  const vColorModel = useVerse<tColorModel>("RYGB");
  const vAccentC = useVerse<number>(1);
  const vAccentL = useVerse<number>(1);
  const vAccentAR = useVerse<number>(0);
  const vSelected = useRef(useVerse<number[]>([])).current;
  const [userPalette, setUserPalette] = useState<tPalette>({
    paints: [],
    name: Math.random().toString(36).substring(2, 7),
  });
  const loadPalette = async () => {
    try {
      const value = await AsyncStorage.getItem("userPalette");
      if (value !== null) {
        console.log("data:" + value);
        return JSON.parse(value);
      } else {
        console.log("setting empty data");
        let pal = await storePalette();
        return pal;
      }
    } catch (e) {
      console.log(e);
    }
  };
  const storePalette = async () => {
    try {
      const jsonValue = JSON.stringify(userPalette);
      await AsyncStorage.setItem("userPalette", jsonValue);
      return userPalette;
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    loadPalette().then((pal) => {
      if (pal) {
        setUserPalette(pal);
      }
    });
  }, []);
  useEffect(() => {
    storePalette();
  }, [userPalette]);
  const addPaint = useCallback((paint: tPaint, index?: number) => {
    setUserPalette((prev) => {
      if (index !== undefined) {
        const newPalette = { ...prev };
        newPalette.paints.splice(index, 0, paint);
        return newPalette;
      }
      return { ...prev, paints: [...prev.paints, paint] };
    });
  }, []);
  const removePaint = useCallback((paint: tPaint) => {
    setUserPalette((prev) => {
      const newPalette = { ...prev };
      newPalette.paints = newPalette.paints.filter((p) => p !== paint);
      return newPalette;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      userPalette,
      addPaint,
      removePaint,
      vColorModel,
      paintsPresent: Object.values(paintsPresent).map((pair) => pair[0]),
      vAccentAR,
      vAccentC,
      vAccentL,
      setUserPalette,
      vSelected,
    }),
    [userPalette],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
