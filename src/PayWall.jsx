import React from "react";
import { Text, View, Image, TouchableOpacity, Dimensions } from "react-native";
import HomeRadialIcon from "./HomeRadialIcon";
export default function PayWall({ setPaywall, purchase, restore }) {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  let sizeMod = 1;
  if (screenHeight < 2 * screenWidth) {
    sizeMod = screenHeight * 0.6;
  } else {
    sizeMod = screenWidth;
  }
  let fontMod = sizeMod / 400;
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#ffeeff",
      }}
    >
      <TouchableOpacity
        style={{
          width: screenHeight * 0.08,
          height: screenHeight * 0.08,
          position: "absolute",
          top: "5%",
          left: "2%",
          zIndex: 100,
          position: "absolute",
        }}
        onPress={() => setPaywall(false)}
      >
        <HomeRadialIcon
          selectedColor={[280, 100, 45]}
          height={screenHeight * 0.08}
          width={screenHeight * 0.08}
        />
      </TouchableOpacity>
      <Text
        adjustsFontSizeToFit={true}
        style={{
          fontSize: 30 * fontMod,
          textAlign: "center",
          position: "absolute",
          width: "100%",
          fontFamily: "-",
          top: "5%",
          height: "10%",
          color: "#aa44cc",
          shadowColor: "#aaaaff",
          shadowOffset: { width: 2, height: 5 },
          shadowOpacity: 1,
          shadowRadius: 3,
          position: "absolute",
        }}
      >
        {`Premium \nFeatures`}
      </Text>
      <View
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "50%",
          top: "15%",
          backgroundColor: "#aa88ff",
        }}
      >
        <Image
          source={require("../assets/Undertone.png")}
          style={{ width: "50%", height: "100%", resizeMode: "contain" }}
        />
        <Image
          source={require("../assets/Wall.png")}
          style={{ width: "50%", height: "100%", resizeMode: "contain" }}
        />
      </View>
      <Text
        adjustsFontSizeToFit={true}
        style={{
          fontSize: 17 * fontMod,
          textAlign: "center",
          position: "absolute",
          width: "100%",
          fontFamily: "Outfit",
          top: "66%",
          height: "40%",
          padding: "1.5%",
          color: "#8800cc",
        }}
      >
        With the Undertone Camera you can find the perfect color combinations
        using your camera, then see what your colors would look like in real
        time with the Wall Paint Visualizer.
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: "#aa44ff",
          width: "75%",
          height: "6%",
          position: "absolute",
          top: "80%",
          borderRadius: 50,
          alignSelf: "center",
          position: "absolute",
        }}
        onPress={purchase}
      >
        <Text
          adjustsFontSizeToFit={true}
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 20,
            textAlign: "center",
            position: "absolute",
            width: "100%",
            fontFamily: "Outfit",
            padding: "3%",
          }}
        >
          Unlock All For $1.99
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          position: "absolute",
          width: "50%",
          height: "4%",
          position: "absolute",
          top: "87%",
          borderRadius: 50,
          alignSelf: "center",
          borderWidth: 2,
          borderColor: "#aa44ff",
        }}
        onPress={restore}
      >
        <Text
          adjustsFontSizeToFit={true}
          style={{
            color: "#aa44ff",
            fontWeight: "bold",
            fontSize: 16 * fontMod,
            textAlign: "center",
            position: "absolute",
            width: "100%",
            fontFamily: "Outfit",
            padding: "2%",
          }}
        >
          Restore Purchase
        </Text>
      </TouchableOpacity>
    </View>
  );
}
