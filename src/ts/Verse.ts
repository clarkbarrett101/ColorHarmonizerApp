import React from "react";
import { DerivedValue, SharedValue, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

export type tVerse<type> = {
    asState: () => type;
    fUpdateState: (value?: type) => void;
    setValue: (value: type) => void;
    asShared: DerivedValue<type>;
};

export function useVerse<type>(init: type): tVerse<type> {
    const [_state, _setState] = React.useState(init);
    const _shared = useSharedValue(init);

    function asState() {
        return _state;
    }
    const asShared = useDerivedValue(() => {

        return _shared.value;
    });
    const setValue = (value: type) => {
        'worklet';
        _shared.value = value;
    }
    function fUpdateState(value?: type) {
        'worklet';
        const newValue = value ?? asShared.value;
        _shared.value = newValue;
        runOnJS(_setState)(newValue);
    }
    return {
        asState,
        fUpdateState,
        asShared,
        setValue,
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
        if (matrix.t) {vT.fUpdateState(matrix.t);}else {vT.fUpdateState();}
        if (matrix.r) {vR.fUpdateState(matrix.r);}else {vR.fUpdateState();}
        if (matrix.s) {vS.fUpdateState(matrix.s);}else {vS.fUpdateState();}
        if (matrix.offset) {vOffset.fUpdateState(matrix.offset);}else {vOffset.fUpdateState();}
        if (matrix.tilt) {vTilt.fUpdateState(matrix.tilt);}else {vTilt.fUpdateState();}
    }
    function wSetMatrix(matrix: Partial<tMatrix>) {
        'worklet';
        if (matrix.t) vT.setValue(matrix.t);
        if (matrix.r) vR.setValue(matrix.r);
        if (matrix.s) vS.setValue(matrix.s);
        if (matrix.offset) vOffset.setValue(matrix.offset);
        if (matrix.tilt) vTilt.setValue(matrix.tilt);
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