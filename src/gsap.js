import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register all required GSAP plugins
gsap.registerPlugin(
  useGSAP,
  CustomEase,
  DrawSVGPlugin,
  Flip,
  ScrambleTextPlugin,
  ScrollTrigger
);

// Define custom "race" ease: fast explosive start with a silky soft landing
try {
  CustomEase.create("race", "M0,0 C0.12,0.8 0.25,1 1,1");
} catch (e) {
  console.warn("CustomEase initialization notice:", e);
}

// Utility to check if system prefers reduced motion
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, useGSAP, CustomEase, DrawSVGPlugin, Flip, ScrambleTextPlugin, ScrollTrigger };
