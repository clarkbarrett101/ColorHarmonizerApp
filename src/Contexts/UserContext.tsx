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
  tPalette,
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
  userPalette: tPalette;
  setUserPalette?: React.Dispatch<React.SetStateAction<tPalette>>;
  addPaint: (paint: tPaint, index?: number) => void;
  removePaint: (paint: tPaint) => void;
  paintsPresent?: tPaint[];
  vColorModel?: tVerse<tColorModel>;
  vAccentC?: tVerse<number>;
  vAccentL?: tVerse<number>;
  vAccentAR?: tVerse<number>;
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
});
export const useUserContext = () => useContext(Context);

export default function UserContext({ children }: { children: ReactNode }) {
  const allChipActors = useRef<Record<number, tActor>>({}).current;
  const paintsPresent = useRef<Record<number, [tPaint, tPaint?]>>({}).current;
  const vColorModel = useVerse<tColorModel>("RYGB");
  const vAccentC = useVerse<number>(1);
  const vAccentL = useVerse<number>(1);
  const vAccentAR = useVerse<number>(0);
  const [userPalette, setUserPalette] = useState<tPalette>(
    fGetRandomPalette(4),
  );

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
    }),
    [userPalette],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
