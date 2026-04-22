import React from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

export type tVerse = {
    asState: () => number;
    updateState: (value?: number) => void;
    asShared: SharedValue<number>;
};

export function useVerse(init: number): tVerse {
    const [state, setState] = React.useState(init);
    const asShared = useSharedValue(init);
    function asState() {
        return state;
    }
    function updateState(value?: number) {
        'worklet';
        const newValue = value ?? asShared.value;
        asShared.value = newValue;
      runOnJS(setState)(newValue);
    }
    return {
        asState,
        updateState,
        asShared,
    };
}