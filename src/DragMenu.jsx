import React from "react";
import { View, Text } from "react-native";
export default function DragMenu({ isSaved }) {
  console.log(isSaved);
  const activeStyle = {
    backgroundColor: "rgba(0,0,0,.2)",
    borderColor: "white",
    borderWidth: 5,
    justifyContent: "center",
    flex: 3,
  };
  return (
    <View
      style={{
        flex: 1,
        display: "flex",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: "absolute",
        zIndex: 10,
      }}
    >
      <View style={isSaved ? activeStyle : { flex: 4 }}>
        {isSaved ? <Text style={{ color: "white" }}>Remove</Text> : null}
      </View>
      <View style={isSaved ? activeStyle : { flex: 4 }}>
        {isSaved ? (
          <Text style={{ color: "white" }}>Use Color Settings</Text>
        ) : null}
      </View>
      <View style={isSaved ? { flex: 2 } : activeStyle}>
        {isSaved ? null : (
          <Text style={{ color: "white" }}>Add to Pallette</Text>
        )}
      </View>
    </View>
  );
}
