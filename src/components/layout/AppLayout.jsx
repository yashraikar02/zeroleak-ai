import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Toaster } from "sonner";
import { Menu, X } from "lucide-react";

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased">
      {/* Toast Container styled with dark enterprise theme */}
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "#141414",
            border: "1px solid #2A2A2A",
            color: "#F5F5F5",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.8125rem",
          },
        }}
      />

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-3 right-3 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-[#141414] border border-[#2A2A2A] text-[#9A9A9A] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0A0A0A]">
        <Outlet />
      </main>
    </div>
  );
}
