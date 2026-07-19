import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fGetRandomPalette,
  tCLARColor,
  tColorModel,
  tPaint,
} from "../utils/CLAcolor";
import { tVerse, useVerse } from "../utils/Verse";
import { tActor } from "../utils/Actor";

export const eLayers = {
  superMax: 2000,
  grabbedChip: 1000,
  buckets: 800,
  chipHand: 600,
  dropScreen: 400,
  chipFan: 200,
  panManager: 150,
  colorMixer: 100,
  background: 10,
};

export type tUserContext = {
  userPalette: tPaint[];
  addPaint: (paint: tPaint, index?: number) => void;
  removePaint: (paint: tPaint) => void;
  paintsPresent?: tPaint[];
  vColorModel?: tVerse<tColorModel>;
  vAccentC?: tVerse<number>;
  vAccentL?: tVerse<number>;
  vAccentAR?: tVerse<number>;
};

export const Context = createContext<tUserContext>({
  userPalette: [],
  addPaint: () => {},
  removePaint: () => {},
  paintsPresent: [],
  vColorModel: null,
  vAccentC: null,
  vAccentL: null,
  vAccentAR: null,
});
export const useUserContext = () => useContext(Context);

export default function UserContext({ children }: { children: ReactNode }) {
  const allChipActors = useRef<Record<number, tActor>>({}).current;
  const paintsPresent = useRef<Record<number, [tPaint, tPaint?]>>({}).current;
  const vColorModel = useVerse<tColorModel>("RYGB");
  const vAccentC = useVerse<number>(1);
  const vAccentL = useVerse<number>(1);
  const vAccentAR = useVerse<number>(0);
  const [userPalette, setUserPalette] = useState<tPaint[]>(
    fGetRandomPalette(4).paints,
  );

  const addPaint = useCallback((paint: tPaint, index?: number) => {
    setUserPalette((prev) => {
      if (index !== undefined) {
        const newPalette = [...prev];
        newPalette.splice(index, 0, paint);
        return newPalette;
      }
      return [...prev, paint];
    });
  }, []);
  const removePaint = useCallback((paint: tPaint) => {
    setUserPalette((prev) => prev.filter((p) => p !== paint));
  }, []);

  const contextValue = useMemo(
    () => ({
      userPalette,
      addPaint,
      allChipActors,
      removePaint,
      vColorModel,
      paintsPresent: Object.values(paintsPresent).map((pair) => pair[0]),
      vAccentAR,
      vAccentC,
      vAccentL,
    }),
    [userPalette],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
