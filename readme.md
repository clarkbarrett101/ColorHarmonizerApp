# Source Code of Color Harmonizer

## Web development

Start the Expo web development server with:

```bash
npm run web
```

The web build initializes Skia through CanvasKit WASM and uses the same
interactive driver as the native app. If the Skia dependency changes, refresh
the WASM asset with:

```bash
npm run setup-skia-web
```

The camera pages show a web-compatible notice because VisionCamera is
currently native-only. Use a mobile target to exercise the camera features.

## Organization:
## Special Systems:
### Actors:
Actors are a means of animating effects on objects from multiple components at once.  Actors have specific Attributes (translateX, rotateZ, zIndex, etc.) and Modifiers with an associated worklet that will alter the attributes, and a dependency list.  AnimatedStyle can then call Actor.get(), and use the attribute values as needed.  This allows dependencies to be defined at runtime ie not in the same component.  Relies on makeMutable() which no longer works in the newest versions of worklets and I can't find any way of getting the same effect in the new architecture.
### Verse:
Short for Versitile Variable, combines a State and a SharedValue into a single linked package, is is nessecary because JSX usually isnt allowed to reference shared values and worklets usually have stale references to states.  
