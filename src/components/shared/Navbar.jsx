import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import Logo from "./Logo";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Compliance", href: "#compliance" },
  { label: "FAQ", href: "#faq" },
  { label: "Docs", href: "#docs" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const hamburgerRef = useRef(null);

  // Open: mount first, then animate in
  const openMenu = () => {
    setMobileMenuOpen(true);
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      const timer = requestAnimationFrame(() => {
        setMenuVisible(true);
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setMenuVisible(false);
    }
  }, [mobileMenuOpen]);

  // Close: animate out, then unmount after 500ms
  const closeMenu = () => {
    setMenuVisible(false);
    setTimeout(() => {
      setMobileMenuOpen(false);
      hamburgerRef.current?.focus();
    }, 500);
  };

  const toggleMenu = () => {
    if (mobileMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  // Escape key listener to close menu and refocus hamburger
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        closeMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <>
      <nav
        className="w-full px-6 md:px-12 lg:px-16 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-30 transition-all backdrop-blur-md bg-[#0A0A0A]/85 border-b border-[#2A2A2A]"
        aria-label="Main Navigation"
      >
        {/* Left: Brand Logo */}
        <Logo />

        {/* Center Links (hidden below lg) */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[#9A9A9A] hover:text-[#F5F5F5] text-xs tracking-wide font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5484D] rounded-md px-2 py-1"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: CTA Pill (hidden below lg) */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            to="/app/gateway"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-[#E5484D] text-[#0A0A0A] hover:bg-[#CC3337] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5484D]"
          >
            <span>Open Gateway</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger (visible below lg) */}
        <button
          ref={hamburgerRef}
          onClick={toggleMenu}
          className="lg:hidden relative w-9 h-9 rounded-lg bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5484D] transition-colors hover:bg-[#1A1A1A]"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
        >
          {/* Menu Icon */}
          <Menu
            className={`w-4 h-4 absolute transition-all duration-300 ${
              mobileMenuOpen
                ? "opacity-0 rotate-90 scale-75"
                : "opacity-100 rotate-0 scale-100"
            }`}
          />
          {/* X Icon */}
          <X
            className={`w-4 h-4 absolute transition-all duration-300 ${
              mobileMenuOpen
                ? "opacity-100 rotate-0 scale-100 text-[#E5484D]"
                : "opacity-0 -rotate-90 scale-75"
            }`}
          />
        </button>
      </nav>

      {/* Mobile Menu Backdrop and Panel */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop (400ms fade) */}
          <div
            onClick={closeMenu}
            className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-md transition-opacity duration-400 ${
              menuVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden="true"
          />

          {/* Panel top-[68px] z-50 with backdrop-blur-xl and rounded-b-2xl */}
          <div
            className={`fixed left-0 right-0 top-[68px] z-50 backdrop-blur-xl bg-[#0C1A1D]/95 border-b border-[#1E4045] rounded-b-2xl shadow-2xl p-6 transition-all duration-400 ease-out ${
              menuVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-4 pointer-events-none"
            }`}
          >
            <div className="flex flex-col items-center gap-5 py-4">
              {NAV_LINKS.map((link, index) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMenu}
                  style={{
                    transitionDelay: menuVisible ? `${350 + index * 50}ms` : "0ms",
                  }}
                  className={`text-lg font-light tracking-[0.08em] text-white/90 hover:text-primary transition-all duration-400 ease-out ${
                    menuVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-3"
                  }`}
                >
                  {link.label}
                </a>
              ))}

              {/* The Open Gateway button is last in the stagger */}
              <Link
                to="/app"
                onClick={closeMenu}
                style={{
                  transitionDelay: menuVisible
                    ? `${350 + NAV_LINKS.length * 50}ms`
                    : "0ms",
                }}
                className={`mt-4 inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold tracking-wider uppercase bg-gradient-to-r from-[#00D2BE] to-[#2EF2E0] text-[#041013] shadow-glow transition-all duration-400 ease-out ${
                  menuVisible
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-3 scale-95"
                }`}
              >
                <span>OPEN GATEWAY</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
