import { useEffect, useRef } from "react";
import {
  DerivedValue,
  SharedValue,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";

/// The objective of the actor is to allow animations from multiple sources across different components. For example, a component that pulls a dragged component towards it if within a radius

export type tAttribute =
  | "ring"
  | "chord"
  | "rotateZ"
  | "zIndex"
  | "scaleX"
  | "scaleY"
  | "translateX"
  | "id"
  | "translateY"
  | "rotateX"
  | "shadowX"
  | "shadowY"
  | "shadowRadius"
  | "red"
  | "green"
  | "blue"
  | "held"
  | "shadowColor"
  | "shadowOpacity"
  | "strokeWidth"
  | "radialOffsetX"
  | "radialOffsetY";

export type tAttributeMap = { [key in tAttribute]?: number };

export type wModifier = (
  input: tAttributeMap,
  last?: tAttributeMap,
) => tAttributeMap;
/**
 * Ideally the modifier should be assigned through a context provider or memo, because its constantly updating
 * @param modID - a specifc ID that determines the order of operations and will be overwritten if a modifier with the same ID is added.
 * @param deps - an array of any shared values that are referenced by the modifier and thus depends on
 * @param modifier - a worklet function that takes in the current attribute map and returns a new attribute map. Most modifiers will return {...input, attribute: newValue} so any attributes not modified will be passed through.
 */
export type tAttributeModifier = {
  modID: number;
  deps?: SharedValue<any>[];
  modifier: wModifier;
};

export type tActor = {
  attributes: SharedValue<tAttributeMap>;
  addModifier: (attributeModifier: tAttributeModifier) => void;
  removeModifier: (id: number) => void;
  get: (callback: (attributes: tAttributeMap) => any) => any;
  deps?: SharedValue<any>[];
};
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
  red: 0,
  blue: 0,
  green: 0,
  held: 0,
  shadowColor: 0,
  shadowOpacity: 0,
  strokeWidth: 0,
};
/**
 *
 * @param initialAttributes is the starting values for each attribute before each modifier is applied, every attribute will be zeroed and even when it's not relevant to the component
 */
export function useActor(initialAttributes: tAttributeMap): tActor {
  const attributes: SharedValue<tAttributeMap> = useSharedValue<tAttributeMap>({
    ...defaultAttributes,
    ...initialAttributes,
  });
  useEffect(() => {
    attributes.value = { ...defaultAttributes, ...initialAttributes };
  }, [initialAttributes]);
  const modifiers = useSharedValue<{ [key: number]: wModifier }>({});
  const deps = useRef<SharedValue<any>[]>([]).current;

  function addModifier(attributeModifier: tAttributeModifier) {
    scheduleOnUI(() => {
      //Must be on the UI thread
      "worklet";
      const mods = modifiers.value;
      let idx = attributeModifier.modID;
      modifiers.value = { ...mods, [idx]: attributeModifier.modifier };
      if (attributeModifier.deps) {
        for (const dep of attributeModifier.deps) {
          if (!deps.includes(dep)) {
            deps.push(dep);
          }
        }
      }
    });
  }

  function removeModifier(id: number) {
    scheduleOnUI(() => {
      "worklet";
      const mods = modifiers.value;
      if (mods[id]) {
        delete mods[id];
        modifiers.value = { ...mods };
      }
    });
  }
  /**
   * The get uses an intermediary callback so that animatedStyle will recognize the dependencies
   * @param callback the function that is finally takes the modified attributes and decides how they are implemented
   * @returns usually returns the object for an animatedStyle or animatedProps,
   * @example
   * const actor = useActor({ translateX: 0 });
   * const animatedStyle = useAnimatedStyle(() => {
   *   return actor.get((attributes) => {
   *     return {
   *       transform: [{ translateX: attributes.translateX }],
   *     };
   *   });
   * });
   */
  const get = (callback: (attributes: tAttributeMap) => any) => {
    "worklet";
    const depsValues = deps.map((dep) => dep.value); // This line is necessary so that the depedencies are all reference in the closure
    let modifiedAttributes = { ...attributes.value };
    for (let id in modifiers.value) {
      const modifier = modifiers.value[id];
      modifiedAttributes = modifier(modifiedAttributes);
    }
    return callback(modifiedAttributes);
  };
  return {
    attributes,
    addModifier,
    removeModifier,
    get,
    deps,
  };
}

export type tLiveAttributeMap = { [key in tAttribute]?: DerivedValue<number> };
export type tAttributeRangeMap = { [key in tAttribute]?: [number, number] };

export function fLerpModifierFactory(
  id: number,
  targetMap: tLiveAttributeMap,
  weight: SharedValue<number>,
  deps: SharedValue<any>[],
): tAttributeModifier {
  return {
    modID: id,
    deps: [weight, ...deps],
    modifier: (input: tAttributeMap) => {
      "worklet";
      const output: tAttributeMap = { ...input };
      for (let key in targetMap) {
        const targetValue = targetMap[key as tAttribute]?.value || 0;
        const inputValue = input[key as tAttribute] || 0;
        output[key as tAttribute] =
          inputValue + (targetValue - inputValue) * weight.value;
      }
      return output;
    },
  };
}
