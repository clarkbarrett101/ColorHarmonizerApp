import { sub } from "@shopify/react-native-skia";
import ButtonSector from "./ButtonSector";
import React, { useEffect } from "react";
import { View, Animated } from "react-native";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

export default function HarmonizerWheel({
  totalSectors,
  innerRadius,
  outerRadius,
  style,
  isTouching,
  subSectors = 4,
  satRange = [75, 75],
  litRange = [40, 90],
  rotationModifier = 0,
  extraSelected = -1,
}) {
  const [selected, setSelected] = React.useState(-1);
  const sizeBoost = 0.25;
  function getSubSectors() {
    if (extraSelected > -1) {
      return 1 + subSectors;
    } else {
      return 1 + subSectors / 2;
    }
  }
  const getSizeModifier = (i) => {
    const rotation = selected / (360 / totalSectors);
    if (i > rotation - 0.5 && i < rotation + 0.5) {
      return 1 + sizeBoost;
    } else {
      if (i === extraSelected) {
        return 1 + sizeBoost / 2;
      } else {
        return 1;
      }
    }
  };

  const anim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isTouching) {
      Animated.timing(anim, {
        toValue: 3,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      anim.setValue(0);
    }
  }, [isTouching]);

  function getSectors() {
    let sectors = [];
    let hueStep = 360 / totalSectors;
    let angleStep = 360 / totalSectors;
    for (let i = 0; i < totalSectors; i++) {
      sectors.push(
        <ButtonSector
          key={hueStep * i}
          hue={hueStep * i}
          angle={angleStep * getSizeModifier(i)}
          startRotation={-90}
          endRotation={angleStep * i + rotationModifier}
          outerRadius={outerRadius * getSizeModifier(i)}
          innerRadius={innerRadius * (getSizeModifier(i) > 1 ? 0 : 1) * 0.35}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: getSizeModifier(i) > 1 ? 2 : 0,
            shadowColor: "black",
            shadowOpacity: getSizeModifier(i) > 1 ? 0.2 : 0,
            shadowRadius: 5,
          }}
          sectors={subSectors}
          satRange={satRange}
          litRange={[
            getSizeModifier(i) > 1
              ? litRange[0]
              : (litRange[0] + litRange[1]) * 0.3,
            litRange[1],
          ]}
        />
      );
    }
    extraSelected !== -1
      ? sectors.push(
          <ButtonSector
            hue={extraSelected * (360 / totalSectors)}
            angle={359.9}
            startRotation={-90}
            endRotation={-90}
            outerRadius={innerRadius}
            innerRadius={innerRadius * 0.35}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1,
              shadowColor: "black",
              shadowOffset: { width: -10, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
            }}
            sectors={subSectors / 2}
            satRange={satRange}
            litRange={[litRange[0], (litRange[1] + litRange[0]) * 0.5]}
          />
        )
      : null;
    return sectors;
  }
  useEffect(() => {
    let currentCenter = 180 - rotationModifier;
    currentCenter = currentCenter % 360;
    if (currentCenter < 0) {
      currentCenter += 360;
    }
    setSelected(currentCenter);
  }, [rotationModifier]);

  return (
    <Animated.View
      style={{
        ...style,

        transform: [
          {
            rotate: anim.interpolate({
              inputRange: [0, 1, 2, 3],
              outputRange: ["0deg", "-5deg", "2deg", "0deg"],
            }),
          },
        ],
      }}
    >
      {getSectors()}
    </Animated.View>
  );
}
