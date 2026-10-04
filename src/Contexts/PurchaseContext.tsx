import React from "react";
import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

export type tPurchaseContext = {
  premium: boolean;
  setPaywall: (paywall: boolean) => void;
  restore: () => Promise<void>;
  purchase: () => Promise<void>;
};
export const PurchaseContext = React.createContext<tPurchaseContext | null>(
  null,
);
export const usePurchaseContext = () => {
  const context = React.useContext(PurchaseContext);
  if (!context) {
    throw new Error(
      "usePurchaseContext must be used within a PurchaseProvider",
    );
  }
  return context;
};
