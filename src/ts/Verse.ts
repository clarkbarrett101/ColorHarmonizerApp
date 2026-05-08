import React, { RefObject, useEffect, useRef, useState } from "react";
import { DerivedValue, SharedValue, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { runOnJS, scheduleOnRN } from "react-native-worklets";

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

    function dispatch(value?: type) {
        'worklet';
        if(value !== undefined && value === shared.value) return;
        let newValue = value !== undefined ? value : shared.value;
        shared.value = newValue;
        scheduleOnRN(_setState, newValue);
    }
    function subscribe(callback: (value: type) => void) {
        listeners.add(callback);
        return () => listeners.delete(callback);
    }
    function unSubscribe(callback: (value: type) => void) {
        listeners.delete(callback);
    }
    useEffect(() => {
        listeners.forEach((callback) => callback(state));
    }, [state]);

    return {
        state,
        dispatch,    
        shared,
        subscribe,
        unSubscribe,
    };
}



export function useVerseRelay<type>(verse: tVerse<type>, callback?: (value: type) => type): tVerse<type> {
    const { state, dispatch, shared, subscribe, unSubscribe } = verse;
    const [localState, setLocalState] = useState(state);
    useEffect(() => {
        subscribe?.((value) => {
            const newValue = callback ? callback(value) : value;
            setLocalState(newValue);
        });
        return () => unSubscribe?.((value) => {
            const newValue = callback ? callback(value) : value;
            setLocalState(newValue);
        });
    }, []);
    
    return {
        state: localState,
        dispatch,
        shared,
        subscribe,
        unSubscribe,
    };
}
