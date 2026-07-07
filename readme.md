# Source Code of Color Harmonizer
## Organization:
## Special Systems:
### Actors:
Actors are a means of animating effects on objects from multiple components at once.  Actors have specific Attributes (translateX, rotateZ, zIndex, etc.) and Modifiers with an associated worklet that will alter the attributes, and a dependency list.  AnimatedStyle can then call Actor.get(), and use the attribute values as needed.  This allows dependencies to be defined at runtime ie not in the same component.  Relies on makeMutable() which no longer works in the newest versions of worklets and I can't find any way of getting the same effect in the new architecture.
### Verse:
Short for Versitile Variable, combines a State and a SharedValue into a single linked package, is is nessecary because JSX usually isnt allowed to reference shared values and worklets usually have stale references to states.  

