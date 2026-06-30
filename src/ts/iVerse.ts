import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {    ISharedValue, useSharedValue, useRunOnJS } from "react-native-worklets-core";
import { tVerse } from "./Verse";
import { scheduleOnRN } from "react-native-worklets";
export type tIVerse<type> = Omit<tVerse<type>, "shared"> & {
    shared: ISharedValue<type>;
};

export function useIVerse<type>(init: type): tIVerse<type> {
    const [state, _setState] = useState(init);
    const shared = useSharedValue(init);
    const listeners = useRef(new Set<(value: type) => void>()).current;
    const runDispatch = useRunOnJS((value?: type) => {
        console.log("Dispatching value:", value);
        _setState(value !== undefined ? value : shared.value);
    }, []);
    const dispatch = useCallback((value?: type) => {
        "worklet";
        if (value !== undefined && Object.is(value, shared.value)) return;
        const newValue = value !== undefined ? value : shared.value;
        shared.value = newValue;
        runDispatch(newValue);
    }, []);

    const subscribe = useCallback((callback: (value: type) => void) => {
        listeners.add(callback);
        return () => listeners.delete(callback);
    }, []);

    const unSubscribe = useCallback((callback: (value: type) => void) => {
        listeners.delete(callback);
    }, []);

    useEffect(() => {
        listeners.forEach((callback) => callback(state));
    }, [state]);

    return useMemo(
        () => ({
            state,
            dispatch,
            shared,
            subscribe,
            unSubscribe,
        }),
        [state],
    );
}