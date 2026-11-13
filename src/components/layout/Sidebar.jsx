import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  Activity,
  Sliders,
  HelpCircle,
  History,
  Settings,
  Shield,
  ArrowUpRight,
  Wifi,
  WifiOff
} from "lucide-react";
import { cn } from "../../lib/utils";
import { USE_MOCK, checkBackendHealth, getApiBaseUrl } from "../../api";

const NAV_ITEMS = [
  { path: "/app/overview", label: "Overview", icon: LayoutDashboard },
  { path: "/app/gateway", label: "Privacy Gateway", icon: ShieldCheck, badge: "Core" },
  { path: "/app/intelligence", label: "Privacy Intelligence", icon: Activity },
  { path: "/app/policies", label: "Policy Control", icon: Sliders },
  { path: "/app/explainability", label: "Explainability", icon: HelpCircle },
  { path: "/app/audit", label: "Audit History", icon: History },
  { path: "/app/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ onCloseMobile }) {
  const [health, setHealth] = useState({ connected: true, mode: USE_MOCK ? "mock" : "live", latency_ms: null });
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await checkBackendHealth();
        if (mounted) setHealth(res);
      } catch (e) {
        if (mounted) setHealth({ connected: false, mode: USE_MOCK ? "mock" : "live", latency_ms: null });
      }
    }
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [location.pathname]);

  return (
    <aside className="w-60 flex-shrink-0 bg-[#0F0F0F] border-r border-[#2A2A2A] flex flex-col h-screen sticky top-0 select-none z-30 font-sans">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <Link
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group"
          title="Return to Product Overview"
        >
          <div className="w-8 h-8 rounded-lg bg-[#E5484D]/10 border border-[#E5484D]/30 flex items-center justify-center text-[#E5484D] group-hover:border-[#E5484D] transition-colors">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-[#F5F5F5] group-hover:text-[#E5484D] transition-colors">
                ZeroLeak
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-[#9A9A9A] truncate">Enterprise DPDP Proxy</p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        <div className="px-2.5 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-[#9A9A9A]/70 font-semibold">
          Platform
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // Handle active match for /app default or exact path
          const isItemActive =
            location.pathname === item.path ||
            (item.path === "/app/gateway" && location.pathname === "/app") ||
            (item.path === "/app/overview" && location.pathname === "/app/dashboard") ||
            (item.path === "/app/intelligence" && location.pathname === "/app/metrics");

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors group",
                isItemActive
                  ? "bg-[#141414] text-[#F5F5F5] border border-[#2A2A2A] shadow-sm font-semibold"
                  : "text-[#9A9A9A] hover:text-[#F5F5F5] hover:bg-[#141414]/60 border border-transparent"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isItemActive ? "text-[#E5484D]" : "text-[#9A9A9A] group-hover:text-[#F5F5F5]"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/30 font-semibold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-[#2A2A2A] bg-[#0F0F0F] space-y-2 text-[11px]">
        {/* Backend connection status pill */}
        <div className="px-2.5 py-2 rounded-md bg-[#141414] border border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                health.connected
                  ? health.mode === "live"
                    ? "bg-[#E5484D]"
                    : "bg-[#F5A524]"
                  : "bg-[#E5484D]"
              )}
            />
            <span className="text-[#9A9A9A] font-medium text-[11px]">
              {health.connected
                ? health.mode === "live"
                  ? "Live Backend"
                  : "Mock Mode"
                : "Disconnected"}
            </span>
          </div>

          <span className="font-mono text-[10px] text-[#9A9A9A]/80">
            {health.latency_ms !== null ? `${health.latency_ms}ms` : "Active"}
          </span>
        </div>

        {/* DPDP Compliance & App Version */}
        <div className="px-2 pt-1 flex items-center justify-between text-[10px] text-[#9A9A9A]/70 font-mono">
          <span>DPDP Act 2023</span>
          <span className="text-[#E5484D] font-medium">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
}
