import React from "react";
import { DerivedValue, SharedValue, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

export type tVerse<type> = {
    asState: () => type;
    updateState: (value?: type) => void;
    setValue: (value: type) => void;
    asShared: DerivedValue<type>;
    assignPassThru: (newPassThru: (value: type) => type) => void;
};

export function useVerse<type>(init: type): tVerse<type> {
    const [_state, _setState] = React.useState(init);
    const _shared = useSharedValue(init);
    let _wPassThru: ((value: type) => type) | undefined = undefined;
    function assignPassThru(newPassThru: (value: type) => type) {
        _wPassThru = newPassThru;
    }
    function asState() {
        return _state;
    }
    const asShared = useDerivedValue(() => {
                if (_wPassThru) {
          return  _wPassThru(_shared.value);
        }
        return _shared.value;
    });
    const setValue = (value: type) => {
        'worklet';
        _shared.value = value;
    }
    function updateState(value?: type) {
        'worklet';
        const newValue = value ?? asShared.value;
        _shared.value = newValue;
        runOnJS(_setState)(newValue);
    }
    return {
        asState,
        updateState,
        asShared,
        assignPassThru,
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
        if (matrix.t) {vT.updateState(matrix.t);}else {vT.updateState();}
        if (matrix.r) {vR.updateState(matrix.r);}else {vR.updateState();}
        if (matrix.s) {vS.updateState(matrix.s);}else {vS.updateState();}
        if (matrix.offset) {vOffset.updateState(matrix.offset);}else {vOffset.updateState();}
        if (matrix.tilt) {vTilt.updateState(matrix.tilt);}else {vTilt.updateState();}
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
        const vOffsetValue = vOffset._shared.value;
        const cosR = Math.cos(vR.asShared.value);
        const sinR = Math.sin(vR.asShared.value);
        const tx = vT.asShared.value.x + vOffsetValue * cosR;
        const ty = vT.asShared.value.y + vOffsetValue * sinR;
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