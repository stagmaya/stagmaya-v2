"use client";
import ScrollAnimation from "@/app/animations/ScrollAnimation";
import { createContext, useContext, useState, ReactNode } from "react";

interface OverlayContextType {
    "is_display": boolean;
    "hide_display": boolean;
    "closeFirstTime": () => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

export function useOverlay(): OverlayContextType {
    const context = useContext(OverlayContext);
    if (!context) throw new Error("useOverlay must be used inside OverlayProvider");
    return context;
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [is_display, setIsDisplay] = useState(true);
  const [hide_display, setHideDisplay] = useState(false);

  const value: OverlayContextType = {
        "is_display": is_display,
        "hide_display": hide_display,
        "closeFirstTime": () => {
            setIsDisplay(false);
            setTimeout(() => {
                setHideDisplay(true);
            }, 600);
        }
  };

  return (
      <OverlayContext.Provider value={value}>
          <ScrollAnimation />
          {children}
      </OverlayContext.Provider>
  );
}