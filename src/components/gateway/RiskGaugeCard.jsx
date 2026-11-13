import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, Shield } from "lucide-react";
import { useAnimations } from "../../context/AnimationContext";
import { gsap } from "../../gsap";
import { cn } from "../../lib/utils";

export default function RiskGaugeCard({ risk }) {
  const { animationsEnabled } = useAnimations();
  const score = risk?.score || 0;
  const level = risk?.level || "low";
  const breakdown = risk?.breakdown || [];

  const [displayScore, setDisplayScore] = useState(animationsEnabled ? 0 : score);
  const circleRef = useRef(null);

  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89

  let strokeColor = "#E5484D"; // emerald
  let levelBadge = "bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/30";
  let LevelIcon = ShieldCheck;

  if (level === "medium") {
    strokeColor = "#F5A524"; // amber
    levelBadge = "bg-[#F5A524]/15 text-[#F5A524] border-[#F5A524]/30";
    LevelIcon = AlertTriangle;
  } else if (level === "high") {
    strokeColor = "#E5484D"; // red
    levelBadge = "bg-[#E5484D]/15 text-[#E5484D] border-[#E5484D]/30";
    LevelIcon = AlertOctagon;
  }

  useEffect(() => {
    if (!animationsEnabled) {
      setDisplayScore(score);
      if (circleRef.current) {
        const offset = circumference - (circumference * score) / 100;
        circleRef.current.style.strokeDashoffset = `${offset}`;
      }
      return;
    }

    const counter = { val: displayScore };
    const targetOffset = circumference - (circumference * score) / 100;

    const tl = gsap.timeline();
    tl.to(counter, {
      val: score,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayScore(Math.round(counter.val));
      },
    });

    if (circleRef.current) {
      tl.to(
        circleRef.current,
        {
          strokeDashoffset: targetOffset,
          duration: 0.6,
          ease: "power2.out",
        },
        0
      );
    }
  }, [score, animationsEnabled, circumference]);

  return (
    <div className="rounded-lg bg-[#141414] border border-[#2A2A2A] p-5 flex flex-col justify-between space-y-4 font-sans h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F5] flex items-center gap-2">
            <span>DPDP Privacy Risk Score</span>
          </h3>
          <p className="text-[11px] text-[#9A9A9A] mt-0.5">
            Sensitivity index based on detected Indian PII classifications
          </p>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase border", levelBadge)}>
          <LevelIcon className="w-3.5 h-3.5" />
          <span>{level} Risk</span>
        </div>
      </div>

      {/* Main Gauge + Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center flex-1">
        {/* Circular SVG Gauge */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center p-2">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-[#1A1A1A]"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                ref={circleRef}
                cx="50"
                cy="50"
                r={radius}
                stroke={strokeColor}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>

            {/* Centered Score Counter */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold font-mono tracking-tight text-[#F5F5F5]">
                {displayScore}
              </span>
              <span className="text-[10px] font-mono uppercase text-[#9A9A9A]">
                / 100
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="sm:col-span-7 space-y-2 border-t sm:border-t-0 sm:border-l border-[#2A2A2A] pt-3 sm:pt-0 sm:pl-4">
          <div className="text-[11px] font-medium text-[#9A9A9A] uppercase tracking-wider">
            Risk Factor Breakdown
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {breakdown.length === 0 ? (
              <div className="text-xs text-[#9A9A9A] py-2">
                Scan document to view weighted risk breakdown.
              </div>
            ) : (
              breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#1A1A1A] border border-[#2A2A2A]"
                >
                  <span className="text-[#F5F5F5] font-mono text-[11px] truncate mr-2">
                    {item.label}
                  </span>
                  <span className="font-mono text-[11px] text-[#E5484D] font-medium flex-shrink-0">
                    +{item.points} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
