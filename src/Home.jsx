import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function Home({ pages, setCurrentPage }) {
  function getPages() {
    let pageLinks = [];
    for (let i = 1; i < pages.length; i++) {
      pageLinks.push(PageLink(pages[i], i));
    }
    return pageLinks;
  }
  return (
    <View
      style={{
        display: "flex",
        height: "75%",
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "center",
        gap: 10,
      }}
    >
      {getPages()}
    </View>
  );

  function PageLink(page, index) {
    return (
      <TouchableOpacity
        onPress={() => setCurrentPage(index)}
        style={{
          backgroundColor: "rgba(0, 125, 255, 1)",
          padding: 10,
          width: "40%",
          height: "15%",
          justifyContent: "center",
          borderRadius: 10,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            textAlignVertical: "center",
            color: "white",
            fontSize: 20,
          }}
        >
          {page}
        </Text>
      </TouchableOpacity>
    );
  }
}
