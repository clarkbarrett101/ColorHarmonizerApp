import React, { ReactNode, useMemo, useState } from "react";
import { PurchaseContext } from "./Contexts/PurchaseContext";

export default function Purchases({ children }: { children: ReactNode }) {
  const [paywall, setPaywall] = useState(false);
  const value = useMemo(
    () => ({
      premium: true,
      setPaywall,
      restore: async () => {},
      purchase: async () => {},
    }),
    [],
  );

  return (
    <PurchaseContext.Provider value={value}>
      {children}
      {paywall && null}
    </PurchaseContext.Provider>
  );
}
