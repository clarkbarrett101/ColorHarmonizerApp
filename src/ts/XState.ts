import { Ref, RefObject, useEffect, useRef, useState } from "react";
import { SharedValue, useAnimatedReaction ,useSharedValue} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export type tXVerse<T> = {
    last: T;
    shared: SharedValue<T>;
    dispatch: (val: T) => void; 
};
export function useXVerse<T>(init: T): tXVerse<T> {
    const [state, setState] = useState<T>(init);
    const shared = useSharedValue<T>(init);
    const dispatch = (val: T) => {
        "worklet";
        shared.value = val;
        scheduleOnRN(setState,val);
    }
    return {
        last: shared.value,
        shared,
        dispatch
    };
}