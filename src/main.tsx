import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Videos from "./pages/Videos";
import FAQ from "./pages/FAQ";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSignup from "./pages/AdminSignup";
import CelebrityDashboard from "./pages/CelebrityDashboard";
import CelebrityProfile from "./pages/CelebrityProfile";
import NotFound from "./pages/NotFound";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/admin-auth" element={<AdminAuth />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-signup" element={<AdminSignup />} />
            <Route path="/dashboard" element={<CelebrityDashboard />} />
            <Route path="/celebrity/:id" element={<CelebrityProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
