import React, { RefObject, useRef, useState } from "react";
import { DerivedValue, SharedValue, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { runOnJS, scheduleOnRN } from "react-native-worklets";

export type tVerse<type> = {
    asState: type;
    wUpdateState: (value?: type) => void;
    asShared: SharedValue<type>;
};

export function useVerse<type>(init: type): tVerse<type> {
    const [asState, _setState] = useState(init);
    const asShared = useSharedValue(init);

    function wUpdateState(value?: type) {
        'worklet';
        const newValue = value ?? asShared.value;
        asShared.value = newValue;
        scheduleOnRN(_setState, newValue);
    }
    return {
        asState,
        wUpdateState,
        asShared,
    };
}
export type tMatrix = {
  t?: { x: number; y: number };
  r?: number;
  s?: { x: number; y: number };
  offset?: number;
  tilt?: number;
};
export type tVerseTransform = {
    vT: tVerse<{ x: number; y: number }>;
    vR: tVerse<number>;
    vTilt: tVerse<number>;
    vS: tVerse<{ x: number; y: number }>;
    vOffset: tVerse<number>;
    dTransform: DerivedValue<{ transform: any[] }>;
    dPosition: DerivedValue<{ x: number; y: number }>;
    fUpate: (matrix: Partial<tMatrix>) => void;
    wSetMatrix: (matrix: Partial<tMatrix>) => void;
};
export function useVerseTransform(init?: Partial<tMatrix>): tVerseTransform {
    const vT = useVerse(init?.t ?? { x: 0, y: 0 });
    const vR = useVerse(init?.r ?? 0);
    const vS = useVerse(init?.s ?? { x: 1, y: 1 });
    const vOffset = useVerse(init?.offset ?? 0);
    const vTilt = useVerse(init?.tilt ?? 0);
    function fUpate(matrix: Partial<tMatrix>) {
        'worklet';
        if (matrix.t) {vT.wUpdateState(matrix.t);}else {vT.wUpdateState();}
        if (matrix.r) {vR.wUpdateState(matrix.r);}else {vR.wUpdateState();}
        if (matrix.s) {vS.wUpdateState(matrix.s);}else {vS.wUpdateState();}
        if (matrix.offset) {vOffset.wUpdateState(matrix.offset);}else {vOffset.wUpdateState();}
        if (matrix.tilt) {vTilt.wUpdateState(matrix.tilt);}else {vTilt.wUpdateState();}
    }
    function wSetMatrix(matrix: Partial<tMatrix>) {
        'worklet';
        if (matrix.t) vT.wUpdateState(matrix.t);
        if (matrix.r) vR.wUpdateState(matrix.r);
        if (matrix.s) vS.wUpdateState(matrix.s);
        if (matrix.offset) vOffset.wUpdateState(matrix.offset);
        if (matrix.tilt) vTilt.wUpdateState(matrix.tilt);
    }
    const dPosition = useDerivedValue(() => {

        const cosR = Math.cos(vR.asShared.value);
        const sinR = Math.sin(vR.asShared.value);
        const tx = vT.asShared.value.x + vOffset.asShared.value * cosR;
        const ty = vT.asShared.value.y + vOffset.asShared.value * sinR;
        return { x: tx, y: ty };
    });
    const dTransform = useDerivedValue(() => {
        return {
            transform: [
                { translateX: dPosition.value.x },
                { translateY: dPosition.value.y },
                { rotateZ: `${vR.asShared.value}rad` },
                { scaleX: vS.asShared.value.x },
                { scaleY: vS.asShared.value.y },
                { rotateX: `${vTilt.asShared.value}rad` },
            ],
        };
    }
    );
    return {
        vT,
        vR,
        vS,
        vOffset,
        vTilt,
        dTransform,
        dPosition,
        fUpate,
        wSetMatrix,
    };
}

