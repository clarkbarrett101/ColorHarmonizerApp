import { createContext, useContext, useRef } from "react";
import { tPaint } from "../utils/CLAcolor";

export type tPaletteManager = {
  currentKey: string;
  currentPalette: tPaint[];
  addPaint: (paint: tPaint) => void;
  removePaint: (paint: tPaint) => void;
  allPalettes: Record<string, tPaint[]>;
};
const context = createContext<tPaletteManager>({
  currentKey: "",
  currentPalette: [],
  addPaint: () => {},
  removePaint: () => {},
  allPalettes: {},
});
export const usePaletteManager = () => useContext(context);
export default function PaletteManager({
  children,
}: {
  children: React.ReactNode;
}) {
  const paletteMap: Record<string, tPaint[]> = {};
  const currentKey = useRef(Object.keys(paletteMap)[0] || "").current;
  const addPaint = (paint: tPaint) => {
    if (!paletteMap[currentKey]) paletteMap[currentKey] = [];
    paletteMap[currentKey].push(paint);
  };
  const removePaint = (paint: tPaint) => {
    if (!paletteMap[currentKey]) return;
    paletteMap[currentKey] = paletteMap[currentKey].filter((p) => p !== paint);
  };
  return (
    <context.Provider
      value={{
        currentKey,
        currentPalette: paletteMap[currentKey] || [],
        addPaint,
        removePaint,
        allPalettes: paletteMap,
      }}
    >
      {children}
    </context.Provider>
  );
}
