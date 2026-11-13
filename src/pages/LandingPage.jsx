import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Eye,
  Server,
  Cpu,
  Layers,
  FileCheck2,
  Sliders,
  Database,
  Fingerprint,
  ChevronDown,
  Sparkles,
  Zap
} from "lucide-react";
import VideoBackground from "../components/shared/VideoBackground";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";
import DemoPreview from "../components/landing/DemoPreview";

export default function LandingPage() {
  const observerRef = useRef(null);

  useEffect(() => {
    // IntersectionObserver fade-up reveal (graceful fallback if observer is not supported)
    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("opacity-100", "translate-y-0");
              entry.target.classList.remove("opacity-0", "translate-y-6");
              observerRef.current.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );

      const elements = document.querySelectorAll(".reveal-on-scroll");
      elements.forEach((el) => observerRef.current.observe(el));

      return () => {
        if (observerRef.current) observerRef.current.disconnect();
      };
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-[#F5F5F5] selection:bg-[#E5484D]/20 selection:text-[#E5484D] overflow-x-hidden font-sans">
      {/* Fixed Navbar */}
      <Navbar />

      {/* -------------------------------------------------------------
          Section 1: Hero
          ------------------------------------------------------------- */}
      <div className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 md:px-12 pt-28 pb-16 text-center">
        {/* Video Background */}
        <VideoBackground />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Small pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#2A2A2A] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#E5484D] font-semibold">
              DPDP ACT 2023 · ENTERPRISE SENTINEL
            </span>
          </div>

          {/* Two h1 lines */}
          <h1 className="text-[#F5F5F5] font-semibold tracking-tight text-3xl sm:text-5xl md:text-6xl max-w-3xl leading-[1.15] mb-6">
            <span>Use any cloud LLM.</span>
            <br />
            <span className="text-[#E5484D]">Without leaking sensitive personal data.</span>
          </h1>

          {/* Clean metric callout */}
          <div className="my-4 sm:my-6 flex flex-col items-center select-none">
            <span className="text-[80px] sm:text-[130px] md:text-[170px] font-bold text-[#F5F5F5] leading-none tracking-tighter">
              0
            </span>
            <span className="text-xs sm:text-sm font-mono tracking-[0.2em] text-[#E5484D] uppercase font-semibold mt-1">
              RAW PII IN OUTBOUND WIRE PAYLOADS
            </span>
          </div>

          {/* Two buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-6">
            <Link
              to="/app/gateway"
              className="btn-primary text-xs sm:text-sm py-2.5 px-6 shadow-sm"
            >
              <span>Launch Privacy Gateway</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/app/overview"
              className="btn-secondary text-xs sm:text-sm py-2.5 px-6"
            >
              <span>Overview Console</span>
            </Link>
          </div>

          {/* Mono scroll hint at the bottom */}
          <div className="mt-16 flex flex-col items-center gap-1.5 text-[11px] font-mono text-[#9A9A9A]">
            <span>EXPLORE ARCHITECTURE</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-[#E5484D]" />
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          Section 2: Three-Panel Demo Preview
          ------------------------------------------------------------- */}
      <section
        id="demo"
        className="reveal-on-scroll opacity-0 translate-y-6 transition-all duration-700 py-16 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto"
      >
        <DemoPreview />
      </section>

      {/* -------------------------------------------------------------
          Section 3: How It Works (4 Glass Cards in a Grid)
          ------------------------------------------------------------- */}
      <section
        id="how-it-works"
        className="reveal-on-scroll opacity-0 translate-y-6 transition-all duration-700 py-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto space-y-12"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
            Four-Stage Local Pipeline
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            How ZeroLeak Protects Your Data
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Every document is inspected, tokenized, and restored locally. Your confidential records never cross perimeter boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 01: Detect */}
          <div className="liquid-glass-border rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Fingerprint className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs text-primary font-bold">01</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">1. Detect</h3>
              <p className="text-xs text-muted leading-relaxed">
                Scans incoming text with Indic-NER and Verhoeff checksum algorithms for Indian identities.
              </p>
            </div>
          </div>

          {/* Card 02: Mask */}
          <div className="liquid-glass-border rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Lock className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs text-primary font-bold">02</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">2. Mask</h3>
              <p className="text-xs text-muted leading-relaxed">
                Swaps sensitive spans with typed placeholders like &lt;PERSON_1&gt; and &lt;AADHAAR_1&gt;.
              </p>
            </div>
          </div>

          {/* Card 03: Forward */}
          <div className="liquid-glass-border rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Server className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs text-primary font-bold">03</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">3. Forward</h3>
              <p className="text-xs text-muted leading-relaxed">
                Dispatches only sanitized text to external LLMs (Gemini, GPT-4o, Claude) over secure TLS.
              </p>
            </div>
          </div>

          {/* Card 04: Reinsert */}
          <div className="liquid-glass-border rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-mono text-xs text-primary font-bold">04</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">4. Reinsert</h3>
              <p className="text-xs text-muted leading-relaxed">
                Reconstitutes completion text locally by mapping placeholders back to original values in ~38ms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 4: Features Grid
          ------------------------------------------------------------- */}
      <section
        id="features"
        className="reveal-on-scroll opacity-0 translate-y-6 transition-all duration-700 py-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto space-y-12"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
            Enterprise Architecture
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Built for High-Stakes Production LLMs
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Comprehensive privacy controls engineered specifically for the Indian regulatory landscape and DPDP Act 2023.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="glass-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Indian-ID Recognizers</h3>
            <p className="text-xs text-muted leading-relaxed">
              Native checksum and format validators for Aadhaar (Verhoeff), PAN (ITD digit), GSTIN (State ISO code), Voter ID, and Indian Passports.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2">
              <Fingerprint className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Local NER for Names & Addresses</h3>
            <p className="text-xs text-muted leading-relaxed">
              Multi-lingual Spacy and Indic NER models trained on Indian naming conventions, PIN codes, and code-mixed Hindi-English text.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Consistent Placeholders</h3>
            <p className="text-xs text-muted leading-relaxed">
              Preserves syntactic and semantic coherence for LLM reasoning by utilizing typed placeholders such as &lt;PERSON_1&gt; and &lt;AADHAAR_1&gt;.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="glass-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Pluggable LLM Backends</h3>
            <p className="text-xs text-muted leading-relaxed">
              Seamlessly toggle between Google Gemini, OpenAI GPT-4o, Anthropic Claude, and on-premises private clusters without reconfiguring agents.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="glass-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Full Immutable Audit Trail</h3>
            <p className="text-xs text-muted leading-relaxed">
              Tamper-evident logs of every wire transmission, risk score, and canary sentinel check for regulatory audits.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="glass-card p-6 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Purpose-Based Policies & Local SLM</h3>
            <p className="text-xs text-muted leading-relaxed">
              Departmental Allow/Mask/Block rules and instant local SLM fallback when policy bans cloud transmission outright.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 5: Compliance and Metrics
          ------------------------------------------------------------- */}
      <section
        id="compliance"
        className="reveal-on-scroll opacity-0 translate-y-6 transition-all duration-700 py-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto space-y-12"
      >
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
            Empirical Validation
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Compliance & Gateway Benchmarks
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Continuous validation guarantees zero leakage to external endpoints with sub-40ms processing overhead.
          </p>
        </div>

        {/* 3 Bordered Stat Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="liquid-glass-border rounded-2xl p-6 text-center space-y-2">
            <div className="text-4xl sm:text-5xl font-extrabold font-mono text-primary tracking-tight">
              0
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-white font-bold">
              PII Leakage in Outbound Wire
            </div>
            <p className="text-[11px] text-muted">
              Zero unmasked Indian identifiers recorded across 14,000+ benchmark trials.
            </p>
          </div>

          <div className="liquid-glass-border rounded-2xl p-6 text-center space-y-2">
            <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
              99.8%
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-primary font-bold">
              Recognizer Precision / Recall
            </div>
            <p className="text-[11px] text-muted">
              Verified with algorithmic checksum checks on Aadhaar, PAN, and GSTIN strings.
            </p>
          </div>

          <div className="liquid-glass-border rounded-2xl p-6 text-center space-y-2">
            <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
              99.6%
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-primary font-bold">
              Local Reinsertion Accuracy
            </div>
            <p className="text-[11px] text-muted">
              Exact restoration fidelity preserving casing, punctuation, and LLM reasoning.
            </p>
          </div>
        </div>

        {/* Department Policy Matrix Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#1E4045] bg-[#0C1A1D]/80 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <span>Departmental DPDP Policy Governance</span>
            </h3>
            <span className="text-[11px] font-mono text-muted">
              Configurable via Gateway
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E4045] text-muted uppercase text-[10px] tracking-wider bg-white/5">
                  <th className="py-3 px-4">Entity Identifier</th>
                  <th className="py-3 px-4">Banking</th>
                  <th className="py-3 px-4">HR & Hiring</th>
                  <th className="py-3 px-4">Healthcare</th>
                  <th className="py-3 px-4">Marketing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E4045]/60">
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Aadhaar (UIDAI)</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/40 font-bold">MASK</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/40 font-bold">MASK</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-danger/20 text-danger border border-danger/40 font-bold">BLOCK</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-danger/20 text-danger border border-danger/40 font-bold">BLOCK</span></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">PAN Card</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/40 font-bold">MASK</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/40 font-bold">MASK</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/40 font-bold">MASK</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-danger/20 text-danger border border-danger/40 font-bold">BLOCK</span></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Customer Names</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/40 font-bold">MASK</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">ALLOW</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/40 font-bold">MASK</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">ALLOW</span></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Postal Addresses</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/40 font-bold">MASK</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary border border-primary/40 font-bold">MASK</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-danger/20 text-danger border border-danger/40 font-bold">BLOCK</span></td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">ALLOW</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 6: FAQ (Native <details>)
          ------------------------------------------------------------- */}
      <section
        id="faq"
        className="reveal-on-scroll opacity-0 translate-y-6 transition-all duration-700 py-20 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
            Got Questions?
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          <details className="group glass-card p-5 rounded-2xl cursor-pointer">
            <summary className="flex items-center justify-between text-sm sm:text-base font-semibold text-white list-none select-none">
              <span>How does ZeroLeak comply with the DPDP Act 2023?</span>
              <ChevronDown className="w-4 h-4 text-primary group-open:rotate-180 transition-transform duration-200" />
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
              Under India’s DPDP Act, sending raw personal identifiers to external third parties without consent creates major compliance liabilities. ZeroLeak completely intercepts all Indian PII locally, ensuring zero raw records cross the outbound boundary.
            </p>
          </details>

          <details className="group glass-card p-5 rounded-2xl cursor-pointer">
            <summary className="flex items-center justify-between text-sm sm:text-base font-semibold text-white list-none select-none">
              <span>Does masking degrade LLM prompt reasoning?</span>
              <ChevronDown className="w-4 h-4 text-primary group-open:rotate-180 transition-transform duration-200" />
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
              No. By using typed placeholders like &lt;PERSON_1&gt; and &lt;AADHAAR_1&gt;, LLMs easily discern semantic entity types and relationships. When the completion returns, the gateway restores the authentic strings locally in under 40ms.
            </p>
          </details>

          <details className="group glass-card p-5 rounded-2xl cursor-pointer">
            <summary className="flex items-center justify-between text-sm sm:text-base font-semibold text-white list-none select-none">
              <span>Can it be deployed air-gapped on enterprise premises?</span>
              <ChevronDown className="w-4 h-4 text-primary group-open:rotate-180 transition-transform duration-200" />
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
              Yes. ZeroLeak’s detection engine and local SLM fallback are lightweight and can run inside isolated VPCs, private Kubernetes clusters, or completely air-gapped hardware with zero telemetry leaks.
            </p>
          </details>

          <details className="group glass-card p-5 rounded-2xl cursor-pointer">
            <summary className="flex items-center justify-between text-sm sm:text-base font-semibold text-white list-none select-none">
              <span>What happens if an adversarial prompt injection is detected?</span>
              <ChevronDown className="w-4 h-4 text-primary group-open:rotate-180 transition-transform duration-200" />
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed">
              Our pre-flight heuristic analyzer inspects prompt entropy and jailbreak signatures. If a high-risk prompt injection is flagged, the gateway sanitizes the threat and records the alert in the immutable audit log.
            </p>
          </details>
        </div>
      </section>

      {/* -------------------------------------------------------------
          Section 7: Final CTA
          ------------------------------------------------------------- */}
      <section className="reveal-on-scroll opacity-0 translate-y-6 transition-all duration-700 py-20 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto">
        <div className="liquid-glass-border rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-mono text-primary font-bold uppercase">
            <Zap className="w-3.5 h-3.5" />
            Ready for Hackathon Evaluation
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
            Experience the Gateway in Action
          </h2>

          <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
            Test realistic Indian loan applications, KYC onboarding, and support tickets with real-time zero-leakage verification.
          </p>

          <div className="pt-2">
            <Link
              to="/app/gateway"
              className="btn-primary text-xs sm:text-sm py-3 px-8 shadow-sm"
            >
              <span>LAUNCH ZEROLEAK GATEWAY</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
