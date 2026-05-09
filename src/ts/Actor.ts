import { add } from "@shopify/react-native-skia";
import { useRef } from "react";
import { DerivedValue, makeMutable, SharedValue, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { runOnUI, scheduleOnUI } from "react-native-worklets";
export type tAttribute = 'ring' | 'chord' | 'rotationZ' | 'zIndex' | 'scale' | 'translateX'|'groupID';
export type wModifier = (input:{ [key in tAttribute]?: number }) => { [key in tAttribute]?: number };
export type tAttributeModifier = {deps?: SharedValue<any>[], modifier: wModifier};

export type tAttributeMap = { [key in tAttribute]?: number };
export type tActor = {
    attributes: SharedValue<tAttributeMap>;
    addModifier: (id:string, modifier: tAttributeModifier, deps?: SharedValue<any>[]) => void;
    removeModifier: (id:string) => void;
    get: (callback: (attributes: tAttributeMap) => any) => any;
    deps?: SharedValue<any>[];
}
const defaultAttributes: tAttributeMap = {
    ring: 0,
    chord: 0,
    rotationZ: 0,
    zIndex: 0,
    scale: 1,
    translateX: 0,
    groupID: 0,
};
export function useActor(initialAttributes: tAttributeMap): tActor {
    const attributes = useSharedValue<tAttributeMap>({ ...defaultAttributes, ...initialAttributes });
    const modifiers = useSharedValue<{ [key: string]: SharedValue<wModifier> }>({});
    const deps = useRef<SharedValue<any>[]>([]).current;

    function addModifier(id: string, attributeModifier: tAttributeModifier) {
        const mod = makeMutable(attributeModifier.modifier);
        scheduleOnUI(() => {
            'worklet';
            const mods = modifiers.value;
            if (!mods[id]) {
                mods[id] = mod;
                modifiers.value = { ...mods };
                if (attributeModifier.deps) {
                    deps.push(...attributeModifier.deps);
                }
            }
        });
    }

    function removeModifier(id: string) {
        scheduleOnUI(() => {
            'worklet';
            const mods = modifiers.value;
            if (mods[id]) {
                delete mods[id];
                modifiers.value = { ...mods };
            }
            
        });
    }
    function get(callback: (attributes: tAttributeMap) => any) {
        'worklet';
                const depsValues = deps.map(dep => dep.value);
        let modifiedAttributes = { ...attributes.value };
        for (const id in modifiers.value) {
            const modifier = modifiers.value[id].value;
            modifiedAttributes = modifier(modifiedAttributes);
        }
        console.log("Computed attributes:", modifiedAttributes);
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

