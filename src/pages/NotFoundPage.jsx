import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex flex-col justify-between overflow-x-hidden font-sans">
      <Navbar />

      <div className="relative min-h-[75vh] flex flex-col justify-center items-center px-4 sm:px-6 md:px-12 text-center pt-28 pb-16">
        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#2A2A2A] mb-6">
            <ShieldAlert className="w-4 h-4 text-[#E5484D]" />
            <span className="text-xs font-mono uppercase text-[#E5484D] font-semibold">
              Route Not Found · 404
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F5] mb-3">
            Endpoint Sanitized
          </h1>
          <p className="text-sm text-[#9A9A9A] max-w-md leading-relaxed mb-8">
            The requested resource is not available or has been quarantined by enterprise DPDP security policies.
          </p>

          <Link
            to="/app/overview"
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Overview Console</span>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
