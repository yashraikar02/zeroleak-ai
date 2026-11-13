import React from "react";
import { Link } from "react-router-dom";

export default function Logo({ className = "" }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5484D] rounded-lg transition-transform ${className}`}
      aria-label="ZeroLeak AI Home"
    >
      <div className="w-8 h-8 rounded-lg bg-[#E5484D]/15 border border-[#E5484D]/30 flex items-center justify-center text-[#E5484D] group-hover:border-[#E5484D] transition-colors">
        <svg
          className="w-4 h-4 fill-current"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2L3.5 5.8V11.2C3.5 16.5 7.1 21.4 12 22.8C16.9 21.4 20.5 16.5 20.5 11.2V5.8L12 2ZM12 7C10.6 7 9.5 8.1 9.5 9.5C9.5 10.6 10.2 11.5 11.1 11.8V14.5C11.1 15 11.5 15.4 12 15.4C12.5 15.4 12.9 15 12.9 14.5V11.8C13.8 11.5 14.5 10.6 14.5 9.5C14.5 8.1 13.4 7 12 7Z"
          />
        </svg>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-base font-bold tracking-tight text-[#F5F5F5] select-none group-hover:text-[#E5484D] transition-colors">
          ZeroLeak
        </span>
        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/30">
          AI
        </span>
      </div>
    </Link>
  );
}
