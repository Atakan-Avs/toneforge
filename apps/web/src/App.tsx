import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import GeneratorPage from "./pages/GeneratorPage";
import TemplatesPage from "./pages/TemplatesPage";
import BrandVoicesPage from "./pages/BrandVoicesPage";

import AuthGuard from "./components/AuthGuard";
import AppLayout from "./components/AppLayout";
import BillingPage from "./pages/BillingPage";

export default function App() {
  return (
    <Routes>
      {/* Public marketing */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected app */}
      <Route
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route path="/app" element={<GeneratorPage />} />
        <Route path="/app/templates" element={<TemplatesPage />} />
        <Route path="/app/brand-voices" element={<BrandVoicesPage />} />
        <Route path="/app/billing" element={<BillingPage />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}