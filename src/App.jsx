import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import GatewayPage from "./pages/GatewayPage";
import MetricsPage from "./pages/MetricsPage";
import PoliciesPage from "./pages/PoliciesPage";
import ExplainabilityPage from "./pages/ExplainabilityPage";
import AuditPage from "./pages/AuditPage";
import SettingsPage from "./pages/SettingsPage";
import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";
import { AnimationProvider } from "./context/AnimationContext";

export default function App() {
  return (
    <AnimationProvider>
      <BrowserRouter>
        <Routes>
          {/* Marketing Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Enterprise Gateway App */}
          <Route path="/app" element={<AppLayout />}>
            {/* Default to Overview */}
            <Route index element={<DashboardPage />} />
            <Route path="overview" element={<DashboardPage />} />
            <Route path="gateway" element={<GatewayPage />} />
            <Route path="intelligence" element={<MetricsPage />} />
            <Route path="policies" element={<PoliciesPage />} />
            <Route path="explainability" element={<ExplainabilityPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Backwards compatibility aliases */}
            <Route path="dashboard" element={<Navigate to="/app/overview" replace />} />
            <Route path="metrics" element={<Navigate to="/app/intelligence" replace />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AnimationProvider>
  );
}
