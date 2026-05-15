import { add } from "@shopify/react-native-skia";
import { useEffect, useRef } from "react";
import { DerivedValue, makeMutable, SharedValue, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { runOnUI, scheduleOnUI } from "react-native-worklets";
export type tAttribute = 'ring' | 'chord' | 'rotateZ' | 'zIndex' | 'scaleX'|'scaleY' | 'translateX'|'id'|'translateY'|'rotateX'|'shadowX'|'shadowY'|'shadowRadius'|'red'|'green'|'blue';
export type wModifier = (input:tAttributeMap,last?:tAttributeMap) => tAttributeMap;
export type tAttributeModifier = {modID: number, deps?: SharedValue<any>[], modifier: wModifier};
export type tAttributeMap = { [key in tAttribute]?: number };
export type tActor = {
    attributes: SharedValue<tAttributeMap>;
    addModifier: (attributeModifier: tAttributeModifier) => void;
    removeModifier: (id:number) => void;
    get: (callback: (attributes: tAttributeMap) => any) => any;
    deps?: SharedValue<any>[];
}
const defaultAttributes: tAttributeMap = {
    ring: 0,
    chord: 0,
    rotateZ: 0,
    zIndex: 0,
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    id: 0,
    translateY: 0,
    rotateX: 0,
    shadowX: 0,
    shadowY: 0,
    shadowRadius: 0,
    red:0,
    blue:0,
    green:0
};
export function useActor(initialAttributes: tAttributeMap): tActor {
    const attributes : SharedValue<tAttributeMap> = useSharedValue<tAttributeMap>({ ...defaultAttributes, ...initialAttributes });
    const lastAttributes : SharedValue<tAttributeMap> = useSharedValue<tAttributeMap>(attributes.value);
    useEffect(() => {
        attributes.value = { ...defaultAttributes, ...initialAttributes };
    }, [initialAttributes]);
    const modifiers = useSharedValue<{ [key: number]: SharedValue<wModifier> }>({});
    const deps = useRef<SharedValue<any>[]>([]).current;
    const depsMap = useRef<{ [key: string]: SharedValue<any>[] }>({}).current;
    function addModifier( attributeModifier: tAttributeModifier) {
        const mod = makeMutable(attributeModifier.modifier);
        console.log("Registering modifier with ID:", attributeModifier.modID, initialAttributes.id);
        scheduleOnUI(() => {
            'worklet';
            const mods = modifiers.value;
            let idx = attributeModifier.modID;
            while(mods[idx]) {
               idx+=10;
            }
            if (!mods[idx]) {
                mods[idx] = mod;
                modifiers.value = { ...mods };
                if (attributeModifier.deps) {
                    deps.push(...attributeModifier.deps);
                    depsMap[idx] = attributeModifier.deps;
                }
            }
        });
    }

    function removeModifier(id: number) {
        scheduleOnUI(() => {
            'worklet';
            const mods = modifiers.value;
            if (mods[id]) {
                delete mods[id];
                modifiers.value = { ...mods };
                if (depsMap[id]) {
                    for (const dep of depsMap[id]) {
                        const index = deps.indexOf(dep);
                        if (index !== -1) {
                            deps.splice(index, 1);
                        }
                    }
                    delete depsMap[id];
                }
            }
        });
    }
    function get(callback: (attributes: tAttributeMap) => any) {
        'worklet';
                const depsValues = deps.map(dep => dep.value);
        let modifiedAttributes = { ...attributes.value };

        for (let id in modifiers.value) {
            const modifier = modifiers.value[id].value;
            modifiedAttributes = modifier(modifiedAttributes, lastAttributes.value);
        }
        lastAttributes.value = modifiedAttributes;
        return callback(modifiedAttributes);
    }
    return {
        attributes,
        addModifier,
        removeModifier,
        get,
        deps
    };
}

export type tLiveAttributeMap = { [key in tAttribute]?: DerivedValue<number> };
export type tAttributeRangeMap = { [key in tAttribute]?: [number, number] };

export function fLerpModifierFactory(id: number, targetMap: tLiveAttributeMap, weight: SharedValue<number>,deps: SharedValue<any>[]): tAttributeModifier {
    return {
        modID: id,
        deps: [weight, ...deps],
        modifier: (input: tAttributeMap) => {
            'worklet';
            const output: tAttributeMap = { ...input };
            for (let key in targetMap) {
                const targetValue = targetMap[key as tAttribute]?.value || 0;
                const inputValue = input[key as tAttribute] || 0;
                output[key as tAttribute] = inputValue + (targetValue - inputValue) * weight.value;
            }
            return output;
        }
    };
}
