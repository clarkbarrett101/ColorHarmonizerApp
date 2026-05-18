import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export type tVerse<type> = {
    state: type;
    dispatch: (value?: type) => void;
    shared: SharedValue<type>;
    subscribe?: (callback: (value: type) => void) => () => void;
    unSubscribe?: (callback: (value: type) => void) => void;
};

export function useVerse<type>(init: type): tVerse<type> {
    const [state, _setState] = useState(init);
    const shared = useSharedValue(init);
    const listeners = useRef(new Set<(value: type) => void>()).current;

    const dispatch = useCallback((value?: type) => {
        "worklet";
        if (value !== undefined && Object.is(value, shared.value)) return;
        const newValue = value !== undefined ? value : shared.value;
        shared.value = newValue;
        scheduleOnRN(_setState, newValue);
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

export function useVerseRelay<type>(
    verse: tVerse<type>,
    callback?: (value: type) => type,
): tVerse<type> {
    const { state, dispatch, shared, subscribe, unSubscribe } = verse;
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const [localState, setLocalState] = useState(() =>
        callback ? callback(state) : state,
    );

    // Keep relay aligned if parent/state source swaps or callback logic changes.
    useEffect(() => {
        const next = callbackRef.current ? callbackRef.current(state) : state;
        setLocalState(next);
    }, [state]);

    useEffect(() => {
        const unsubscribe = subscribe?.((value) => {
            const next = callbackRef.current ? callbackRef.current(value) : value;
            setLocalState((prev) => (Object.is(prev, next) ? prev : next));
        });

        return () => {
            unsubscribe?.();
        };
    }, [subscribe]);

    return useMemo(
        () => ({
            state: localState,
            dispatch,
            shared,
            subscribe,
            unSubscribe,
        }),
        [localState],
    );
}
