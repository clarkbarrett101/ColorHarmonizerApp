import ButtonSector from "./ButtonSector";
import React, { useEffect } from "react";
import { View, Animated } from "react-native";

export default function HueWheel({
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
  const sizeBoost = 0.4;
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
  function getInnerRadius(i) {
    if (extraSelected > -1) {
      return innerRadius + (outerRadius - innerRadius) / 3;
    } else {
      return innerRadius;
    }
  }
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
          innerRadius={getInnerRadius(i)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: getSizeModifier(i) > 1 ? 2 : 0,
            backgroundColor: "transparent",
            shadowColor: "black",
            shadowOpacity: getSizeModifier(i) > 1 ? 0.5 : 0,
            shadowRadius: 3,
            shadowOffset: {
              width: 0,
              height: 0,
            },
          }}
          sectors={subSectors + getSizeModifier(i) - 1}
          satRange={satRange}
          litRange={litRange}
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
            outerRadius={innerRadius + (outerRadius - innerRadius) / 3}
            innerRadius={0}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 0,
            }}
            sectors={subSectors}
            satRange={[satRange[1], satRange[0]]}
            litRange={[litRange[1], litRange[0]]}
          />
        )
      : null;
    return sectors;
  }
  useEffect(() => {
    let currentCenter = 360 - rotationModifier - 180;
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
