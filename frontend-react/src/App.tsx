import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vendors from "./pages/Vendors";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import Documents from "./pages/Documents";
import Performance from "./pages/Performance";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import type { ReactNode } from "react";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import Catalog from "./pages/Catalog";
import CreateAccount from "./pages/CreateAccount";
import LandingPage from "./pages/LandingPage";
import RegisterOrganization from "./pages/RegisterOrganization";
import VendorRegistration from "./pages/VendorRegistration";
import Invoices from "./pages/Invoices";
import OrganizationRequests from "./pages/OrganizationRequests";
import Organizations from "./pages/Organizations";
import OrganizationProfile from "./pages/OrganizationProfile";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredRoute }: { children: ReactNode; requiredRoute: string }) {
  const { isAuthenticated, hasRouteAccess } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasRouteAccess(requiredRoute)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, getDefaultRoute } = useAuth();
  if (isAuthenticated) return <Navigate to={getDefaultRoute()} replace />;
  return <>{children}</>;
}

function DefaultRedirect() {
  const { isAuthenticated, getDefaultRoute } = useAuth();
  if (isAuthenticated) return <Navigate to={getDefaultRoute()} replace />;
  return <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter  future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }}>

        <AuthProvider>
          <Routes>
            
          <Route path="/" element={<LandingPage/>}/>
          <Route path="/register" element={<RegisterOrganization />} />
          <Route path="/register-vendor" element={<VendorRegistration />} />
          <Route path="/create-account" element={<ProtectedRoute requiredRoute="/create-account"><CreateAccount /></ProtectedRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register-staff" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<DefaultRedirect />} />
            <Route path="/dashboard" element={<ProtectedRoute requiredRoute="/dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/vendors" element={<ProtectedRoute requiredRoute="/vendors"><Vendors /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute requiredRoute="/orders"><Orders /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute requiredRoute="/payments"><Payments /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute requiredRoute="/documents"><Documents /></ProtectedRoute>} />
            <Route path="/performance" element={<ProtectedRoute requiredRoute="/performance"><Performance /></ProtectedRoute>} />
            <Route path="/catalog" element={<ProtectedRoute requiredRoute="/catalog"><Catalog /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute requiredRoute="/payments"><Invoices /></ProtectedRoute>} />
            <Route path="/organization-requests" element={<ProtectedRoute requiredRoute="/dashboard"><OrganizationRequests /></ProtectedRoute>} />
            <Route path="/organizations" element={<ProtectedRoute requiredRoute="/organizations"><Organizations /></ProtectedRoute>} />
            <Route path="/organization-profile" element={<ProtectedRoute requiredRoute="/organization-profile"><OrganizationProfile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
