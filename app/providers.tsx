"use client";

import { StoreProvider } from "@/lib/store/StoreProvider";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Hide the inline initial-loader once React has hydrated
  // We use display: none instead of remove() because React owns this node
  // and removing it manually will cause "Failed to execute 'removeChild'" errors on route transitions.
  useEffect(() => {
    const splash = document.getElementById("__initial_splash__");
    if (splash) {
      splash.style.opacity = "0";
      splash.style.transition = "opacity 0.35s ease";
      setTimeout(() => {
        splash.style.display = "none";
      }, 380);
    }
  }, []);

  return (
    <StoreProvider>
      <Toaster position="top-right" />
      {children}
    </StoreProvider>
  );
}
