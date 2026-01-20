import { createContext, useContext, useMemo, useState } from "react";

type XRSessionState = {
  xrSessionActive: boolean;
  setXrSessionActive: (active: boolean) => void;
};

const XRSessionStateContext = createContext<XRSessionState | undefined>(undefined);

export const XRSessionStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [xrSessionActive, setXrSessionActive] = useState(false);

  const value = useMemo(
    () => ({
      xrSessionActive,
      setXrSessionActive,
    }),
    [xrSessionActive]
  );

  return <XRSessionStateContext.Provider value={value}>{children}</XRSessionStateContext.Provider>;
};

export const useXRSessionState = () => {
  const context = useContext(XRSessionStateContext);
  if (!context) {
    throw new Error("useXRSessionState must be used within a XRSessionStateProvider");
  }
  return context;
};
