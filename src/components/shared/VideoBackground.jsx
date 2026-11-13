import React, { useState, useEffect } from "react";
import { HERO_VIDEO_URL, HERO_POSTER_URL } from "../../config";

export default function VideoBackground() {
  const [videoFailed, setVideoFailed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  const showFallback = prefersReducedMotion || videoFailed;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 bg-[#0A0A0A]">
      {showFallback ? (
        /* CSS Fallback: subtle dark radial gradient */
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,184,121,0.12),transparent)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        </div>
      ) : (
        /* HTML5 Looping Background Video */
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_POSTER_URL}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
      )}

      {/* Dark overlay & bottom fade into --bg */}
      <div className="absolute inset-0 bg-[#0A0A0A]/70" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#0A0A0A]/80 to-[#0A0A0A]" />
    </div>
  );
}
