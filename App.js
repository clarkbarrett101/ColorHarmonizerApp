import Driver from "./src/Driver";
import { Dimensions, Platform } from "react-native";
import React from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "react-native-purchases";
import { LOG_LEVEL } from "react-native-purchases";
import PayWall from "./src/PayWall";
import AppIconTest from "./src/AppIconTest";

export default class App extends React.Component {
  state = {
    isPremium: false,
    paywall: false,
  };
  async componentDidMount() {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    if (Platform.OS === "android") {
      this.setState({ isPremium: true });
    } else if (Platform.OS === "ios") {
      await Purchases.configure({
        apiKey: "appl_VkkRztDNPposokHuqhRQIbgbIbV",
      });

      try {
        const customer = await Purchases.getCustomerInfo();
        if (customer.entitlements.active["Premium Features"]) {
          this.setState({ isPremium: true });
        }
      } catch (e) {
        console.log("Error getting offerings: ", e);
      }
    }
  }
  restore = async () => {
    try {
      const restore = await Purchases.restorePurchases();
      if (
        typeof restore.entitlements.active["Premium Features"] !== "undefined"
      ) {
        this.setState({ isPremium: true });
      }
    } catch (e) {
      console.log("Error restoring purchases: ", e);
    }
  };
  purchase = async () => {
    const offerings = await Purchases.getOfferings();
    const product = offerings.current.availablePackages[0];
    try {
      const { customerInfo } = await Purchases.purchasePackage(product);
      if (
        typeof customerInfo.entitlements.active["Premium Features"] !==
        "undefined"
      ) {
        this.setState({ isPremium: true });
      }
    } catch (e) {
      if (!e.userCancelled) {
        showError(e);
      }
    }
  };
  render() {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        {this.state.paywall ? (
          <PayWall
            restore={this.restore}
            purchase={this.purchase}
            setPaywall={(paywall) => this.setState({ paywall: paywall })}
          />
        ) : (
          <Driver
            premium={this.state.isPremium}
            setPaywall={(paywall) => this.setState({ paywall: paywall })}
          />
        )}
      </GestureHandlerRootView>
    );
  }
}
