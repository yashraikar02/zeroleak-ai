import React, { useState } from "react";
import { ShieldCheck, Lock, Sparkles, ArrowRight, Eye } from "lucide-react";
import { getEntityStyle, cn } from "../../lib/utils";

const SAMPLE_PREVIEWS = [
  {
    id: "loan",
    title: "Loan Application",
    text: `Applicant Rahul Sharma (Aadhaar 1234-5678-9012, PAN ABCDE1234F) applied for Home Loan with co-borrower Sunita Sharma. Contact: +91 98765 43210, rahul.sharma@example.com. Residing in Davangere, Karnataka.`,
    entities: [
      { type: "PERSON", original: "Rahul Sharma", placeholder: "<PERSON_1>" },
      { type: "AADHAAR", original: "1234-5678-9012", placeholder: "<AADHAAR_1>" },
      { type: "PAN", original: "ABCDE1234F", placeholder: "<PAN_1>" },
      { type: "PERSON", original: "Sunita Sharma", placeholder: "<PERSON_2>" },
      { type: "PHONE", original: "+91 98765 43210", placeholder: "<PHONE_1>" },
      { type: "EMAIL", original: "rahul.sharma@example.com", placeholder: "<EMAIL_1>" },
    ],
    sanitized: `Applicant <PERSON_1> (Aadhaar <AADHAAR_1>, PAN <PAN_1>) applied for Home Loan with co-borrower <PERSON_2>. Contact: <PHONE_1>, <EMAIL_1>. Residing in Davangere, Karnataka.`,
    llmOutput: `Underwriting Evaluation: Applicant Rahul Sharma and co-borrower Sunita Sharma meet primary eligibility. Verified UIDAI Aadhaar 1234-5678-9012 and PAN ABCDE1234F. Application approved for credit verification.`,
  },
  {
    id: "kyc",
    title: "KYC Form",
    text: `Enterprise KYC Record: Vikramaditya Patel, Aadhaar: 4321-8765-2109, PAN: BNZPK9812L, Email: v.patel.biz@fintech-corp.in. Business GSTIN: 24AAACC1206D1ZM.`,
    entities: [
      { type: "PERSON", original: "Vikramaditya Patel", placeholder: "<PERSON_1>" },
      { type: "AADHAAR", original: "4321-8765-2109", placeholder: "<AADHAAR_1>" },
      { type: "PAN", original: "BNZPK9812L", placeholder: "<PAN_1>" },
      { type: "EMAIL", original: "v.patel.biz@fintech-corp.in", placeholder: "<EMAIL_1>" },
      { type: "GSTIN", original: "24AAACC1206D1ZM", placeholder: "<GSTIN_1>" },
    ],
    sanitized: `Enterprise KYC Record: <PERSON_1>, Aadhaar: <AADHAAR_1>, PAN: <PAN_1>, Email: <EMAIL_1>. Business GSTIN: <GSTIN_1>.`,
    llmOutput: `KYC Validation Summary: Identity record confirmed for Vikramaditya Patel with active tax ID BNZPK9812L and Aadhaar 4321-8765-2109. Verified enterprise credentials.`,
  },
  {
    id: "support",
    title: "Support Ticket",
    text: `Support Escalation #44910: Priya Sundaram reported failed transfer of ₹2,50,000 linked to PAN AFZPS9021M and Aadhaar 9012-3456-7890. Phone: +91 94440 12345.`,
    entities: [
      { type: "PERSON", original: "Priya Sundaram", placeholder: "<PERSON_1>" },
      { type: "PAN", original: "AFZPS9021M", placeholder: "<PAN_1>" },
      { type: "AADHAAR", original: "9012-3456-7890", placeholder: "<AADHAAR_1>" },
      { type: "PHONE", original: "+91 94440 12345", placeholder: "<PHONE_1>" },
    ],
    sanitized: `Support Escalation #44910: <PERSON_1> reported failed transfer of ₹2,50,000 linked to PAN <PAN_1> and Aadhaar <AADHAAR_1>. Phone: <PHONE_1>.`,
    llmOutput: `Priority Resolution: Redressal ticket escalated for Priya Sundaram. NPCI transaction trace initiated for account PAN AFZPS9021M. Expected turnaround 24 hours.`,
  },
];

export default function DemoPreview() {
  const [activeTab, setActiveTab] = useState(SAMPLE_PREVIEWS[0].id);
  const [hoveredPlaceholder, setHoveredPlaceholder] = useState(null);

  const currentSample = SAMPLE_PREVIEWS.find((s) => s.id === activeTab) || SAMPLE_PREVIEWS[0];

  return (
    <div className="w-full max-w-6xl mx-auto rounded-xl bg-[#141414] border border-[#2A2A2A] p-4 sm:p-6 md:p-8 space-y-6 shadow-xl font-sans">
      {/* Header & Sample Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2A2A] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E5484D]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#E5484D] font-semibold">
              Interactive Preview
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] mt-1">
            Zero Raw PII Leaves Your Infrastructure
          </h2>
          <p className="text-xs sm:text-sm text-[#9A9A9A] mt-0.5">
            Hover over any placeholder in the sanitized payload to trace local masking and reinsertion.
          </p>
        </div>

        {/* Small pill row */}
        <div className="flex items-center gap-1.5 bg-[#1A1A1A] p-1 rounded-lg border border-[#2A2A2A]">
          {SAMPLE_PREVIEWS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => setActiveTab(sample.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                activeTab === sample.id
                  ? "bg-[#141414] text-[#E5484D] font-semibold border border-[#E5484D]/30"
                  : "text-[#9A9A9A] hover:text-[#F5F5F5]"
              )}
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Three Columns Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Original Input */}
        <div className="rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#9A9A9A] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#9A9A9A]" />
                1. Original Input
              </span>
              <span className="text-[10px] font-mono text-[#9A9A9A]">Local Boundary</span>
            </div>
            <p className="text-xs font-mono leading-relaxed text-[#F5F5F5]/90">
              {currentSample.text}
            </p>
          </div>
          <div className="pt-2 border-t border-[#2A2A2A] text-[11px] font-mono text-[#E5484D]">
            {currentSample.entities.length} PII Identified
          </div>
        </div>

        {/* Panel 2: Sanitized Payload */}
        <div className="rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#E5484D] font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#E5484D]" />
                2. Outbound Wire Payload
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/30">
                <ShieldCheck className="w-3 h-3" />
                0 raw PII leaked
              </span>
            </div>

            <div className="text-xs font-mono text-[#F5F5F5]/90 leading-relaxed select-text">
              <p className="leading-loose">
                {currentSample.sanitized.split(/(<[A-Z_]+_\d+>)/g).map((part, i) => {
                  const match = currentSample.entities.find((e) => e.placeholder === part);
                  if (match) {
                    const style = getEntityStyle(match.type);
                    const isHovered = hoveredPlaceholder === part;
                    return (
                      <span
                        key={i}
                        onMouseEnter={() => setHoveredPlaceholder(part)}
                        onMouseLeave={() => setHoveredPlaceholder(null)}
                        className={cn(
                          "inline-block px-1.5 py-0.5 mx-0.5 rounded border text-[11px] font-bold cursor-pointer transition-all",
                          style.chip,
                          isHovered && "ring-1 ring-[#E5484D] scale-105"
                        )}
                        title={`${match.type}: ${match.original}`}
                      >
                        {part}
                      </span>
                    );
                  }
                  return <React.Fragment key={i}>{part}</React.Fragment>;
                })}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#9A9A9A]">Cloud Destination:</span>
            <span className="text-[#F5F5F5] font-semibold">Gemini / GPT-4o</span>
          </div>
        </div>

        {/* Panel 3: Restored Response */}
        <div className="rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#F5F5F5] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E5484D]" />
                3. Final Restored Output
              </span>
              <span className="text-[10px] font-mono text-[#E5484D] font-semibold">~38ms overhead</span>
            </div>

            <div className="text-xs font-mono text-[#F5F5F5]/90 leading-relaxed">
              <p>{currentSample.llmOutput}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between text-[11px] font-mono text-[#9A9A9A]">
            <span>Reinsertion accuracy:</span>
            <span className="text-[#E5484D] font-bold">99.6%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
