import React, { createContext, useContext, useState, useEffect } from "react";
import { prefersReducedMotion } from "../gsap";

const AnimationContext = createContext({
  animationsEnabled: true,
  toggleAnimations: () => {},
});

export function AnimationProvider({ children }) {
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const saved = localStorage.getItem("zeroleak_animations") || localStorage.getItem("privaguard_animations");
    if (saved !== null) return saved === "true";
    return !prefersReducedMotion();
  });

  useEffect(() => {
    localStorage.setItem("zeroleak_animations", String(animationsEnabled));
    localStorage.setItem("privaguard_animations", String(animationsEnabled));
  }, [animationsEnabled]);

  const toggleAnimations = () => setAnimationsEnabled(prev => !prev);

  return (
    <AnimationContext.Provider value={{ animationsEnabled, toggleAnimations }}>
      {children}
    </AnimationContext.Provider>
  );
}

export const useAnimations = () => useContext(AnimationContext);
