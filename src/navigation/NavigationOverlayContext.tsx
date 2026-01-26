import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type NavigationOverlayState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const NavigationOverlayContext = createContext<NavigationOverlayState | undefined>(undefined);

export const NavigationOverlayProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
    }),
    [isOpen, open, close, toggle]
  );

  return <NavigationOverlayContext.Provider value={value}>{children}</NavigationOverlayContext.Provider>;
};

export const useNavigationOverlay = () => {
  const context = useContext(NavigationOverlayContext);
  if (!context) {
    throw new Error("useNavigationOverlay must be used within a NavigationOverlayProvider");
  }
  return context;
};

export const useNavigationOverlayOpen = () => {
  const context = useContext(NavigationOverlayContext);
  return context?.isOpen ?? false;
};
