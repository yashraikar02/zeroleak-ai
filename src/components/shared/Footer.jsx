import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Github,
  Linkedin,
  Twitter,
  Youtube,
  Send,
  ShieldCheck
} from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid business email address.");
      return;
    }
    toast.success("Thank you! The DPDP enterprise checklist is on its way.");
    setEmail("");
  };

  return (
    <footer className="w-full border-t border-[#2A2A2A] bg-[#0A0A0A] relative z-10 px-4 sm:px-6 md:px-12 lg:px-16 pb-10 pt-16 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-6">
        {/* Column 1: PLATFORM */}
        <div className="space-y-4">
          <h3 className="text-[#F5F5F5] text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase font-mono">
            PLATFORM
          </h3>
          <ul className="space-y-2.5">
            <li>
              <Link to="/app/overview" className="text-[#9A9A9A] hover:text-[#F5F5F5] text-xs transition-colors duration-200">
                Overview
              </Link>
            </li>
            <li>
              <Link to="/app/gateway" className="text-[#9A9A9A] hover:text-[#F5F5F5] text-xs transition-colors duration-200">
                Privacy Gateway
              </Link>
            </li>
            <li>
              <Link to="/app/intelligence" className="text-[#9A9A9A] hover:text-[#F5F5F5] text-xs transition-colors duration-200">
                Privacy Intelligence
              </Link>
            </li>
            <li>
              <Link to="/app/policies" className="text-[#9A9A9A] hover:text-[#F5F5F5] text-xs transition-colors duration-200">
                Policy Control
              </Link>
            </li>
            <li>
              <Link to="/app/explainability" className="text-[#9A9A9A] hover:text-[#F5F5F5] text-xs transition-colors duration-200">
                Explainability
              </Link>
            </li>
            <li>
              <Link to="/app/audit" className="text-[#9A9A9A] hover:text-[#F5F5F5] text-xs transition-colors duration-200">
                Audit History
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: DETECTION */}
        <div className="space-y-4">
          <h3 className="text-white text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase">
            DETECTION
          </h3>
          <ul className="space-y-2.5">
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                Aadhaar
              </span>
            </li>
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                PAN
              </span>
            </li>
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                GSTIN
              </span>
            </li>
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                Voter ID
              </span>
            </li>
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                Passport
              </span>
            </li>
          </ul>
        </div>

        {/* Column 3: COMPLIANCE */}
        <div className="space-y-4">
          <h3 className="text-white text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase">
            COMPLIANCE
          </h3>
          <ul className="space-y-2.5">
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                DPDP Act 2023
              </span>
            </li>
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                DPDP Rules 2025
              </span>
            </li>
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                Security Safeguards
              </span>
            </li>
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                Data Retention
              </span>
            </li>
          </ul>
        </div>

        {/* Column 4: TEAM */}
        <div className="space-y-4">
          <h3 className="text-white text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase">
            TEAM
          </h3>
          <ul className="space-y-2.5">
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                Our Story
              </span>
            </li>
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                MineArena 1.0
              </span>
            </li>
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                Code Commit
              </span>
            </li>
            <li>
              <span className="text-white/50 hover:text-white/80 text-xs transition-colors duration-200 cursor-default">
                BIET Davangere
              </span>
            </li>
          </ul>
        </div>

        {/* Column 5 & 6: Col-span-2 block for Newsletter & Socials */}
        <div className="col-span-2 space-y-5">
          <div>
            <h3 className="text-white text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase mb-2">
              GET THE PRIVACY CHECKLIST
            </h3>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              Step-by-step technical safeguards to achieve DPDP compliance for generative AI pipelines.
            </p>

            <form onSubmit={handleSubscribe} className="flex max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@enterprise.com"
                className="flex-1 bg-white text-[#050B0D] px-3.5 py-2.5 text-xs rounded-l-md outline-none placeholder:text-neutral-500 font-medium"
                aria-label="Enterprise Email"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-[#00D2BE] to-[#2EF2E0] text-[#041013] font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-r-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>SEND IT</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* CONNECT */}
          <div>
            <h4 className="text-white text-[10px] font-bold tracking-[0.15em] uppercase mb-2">
              CONNECT
            </h4>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                aria-label="GitHub repository"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                aria-label="LinkedIn profile"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                aria-label="Twitter profile"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                aria-label="YouTube channel"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          <p className="text-[11px] text-muted/80 leading-relaxed font-mono">
            Prototype aligned with DPDP principles. Not legal advice.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#2A2A2A] flex flex-wrap items-center justify-between text-[11px] text-[#9A9A9A] font-mono gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#E5484D]" />
          <span>ZeroLeak AI · DPDP-Ready Enterprise LLM Gateway</span>
        </div>
        <div>
          <span>© 2026 ZeroLeak AI · Architecture</span>
        </div>
      </div>
    </footer>
  );
}
