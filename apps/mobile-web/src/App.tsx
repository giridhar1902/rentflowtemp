import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  HashRouter,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import NativeBridge from "./components/NativeBridge";
import { defaultRouteForRole } from "./lib/routes";
import { cn } from "./lib/cn";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { UpgradeModal } from "./components/UpgradeModal";

// Splash stays eager for app boot and test expectations.
import Splash from "./pages/Splash.tsx";

// Lazy-loaded route modules to reduce initial bundle cost.
const Login = lazy(() => import("./pages/Login.tsx"));
const Register = lazy(() => import("./pages/Register.tsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const TenantInvite = lazy(() => import("./pages/tenant/TenantInvite.tsx"));
const LandlordDashboard = lazy(() => import("./pages/landlord/Dashboard.tsx"));
const FinancialReports = lazy(
  () => import("./pages/landlord/FinancialReports.tsx"),
);
const PropertiesList = lazy(
  () => import("./pages/landlord/PropertiesList.tsx"),
);
const PropertyDetails = lazy(
  () => import("./pages/landlord/PropertyDetails.tsx"),
);
const AddProperty = lazy(() => import("./pages/landlord/AddProperty.tsx"));
const MaintenanceList = lazy(
  () => import("./pages/landlord/MaintenanceList.tsx"),
);
const RentPayments = lazy(() => import("./pages/landlord/RentPayments.tsx"));
const AddExpense = lazy(() => import("./pages/landlord/AddExpense.tsx"));
const TenantHome = lazy(() => import("./pages/tenant/TenantHome.tsx"));
const PayRent = lazy(() => import("./pages/tenant/PayRent.tsx"));
const NewRequest = lazy(() => import("./pages/tenant/NewRequest.tsx"));
const TenantPropertyDetails = lazy(
  () => import("./pages/tenant/TenantPropertyDetails.tsx"),
);
const RentAdvance = lazy(() => import("./pages/tenant/RentAdvance.tsx"));
const DepositEmi = lazy(() => import("./pages/tenant/DepositEmi.tsx"));
const Marketplace = lazy(() => import("./pages/tenant/Marketplace.tsx"));
const TdsConsent = lazy(() => import("./pages/tenant/TdsConsent.tsx"));
const Chat = lazy(() => import("./pages/shared/Chat.tsx"));
const Profile = lazy(() => import("./pages/shared/Profile.tsx"));
const AccountInformation = lazy(
  () => import("./pages/shared/AccountInformation.tsx"),
);
const PaymentMethods = lazy(() => import("./pages/shared/PaymentMethods.tsx"));
const LeaseAgreement = lazy(() => import("./pages/shared/LeaseAgreement.tsx"));
const Vault = lazy(() => import("./pages/shared/Vault.tsx"));
const ActivityCenter = lazy(() => import("./pages/shared/ActivityCenter.tsx"));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const RootRedirect: React.FC = () => {
  const { isLoading, session, profile } = useAuth();
  if (isLoading) {
    return <Splash />;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={defaultRouteForRole(profile?.role)} replace />;
};

const RouteLoading: React.FC = () => (
  <div className="px-4 py-6">
    <div className="surface rounded-[var(--radius-card)] p-4">
      <p className="text-sm text-text-secondary">Loading view...</p>
    </div>
  </div>
);

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const transitionKey = `${location.pathname}${location.search}`;

  return (
    <div key={transitionKey}>
      <Suspense fallback={<RouteLoading />}>
        <Routes location={location}>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/register/invite"
            element={
              <ProtectedRoute allowedRoles={["TENANT"]}>
                <TenantInvite />
              </ProtectedRoute>
            }
          />

          {/* Landlord Routes */}
          <Route
            path="/landlord/dashboard"
            element={
              <ProtectedRoute allowedRoles={["LANDLORD", "ADMIN"]}>
                <LandlordDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landlord/finance"
            element={
              <ProtectedRoute allowedRoles={["LANDLORD", "ADMIN"]}>
                <FinancialReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landlord/properties"
            element={
              <ProtectedRoute allowedRoles={["LANDLORD", "ADMIN"]}>
                <PropertiesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landlord/add-property"
            element={
              <ProtectedRoute allowedRoles={["LANDLORD", "ADMIN"]}>
                <AddProperty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landlord/property/:id"
            element={
              <ProtectedRoute allowedRoles={["LANDLORD", "ADMIN"]}>
                <PropertyDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landlord/maintenance"
            element={
              <ProtectedRoute allowedRoles={["LANDLORD", "ADMIN"]}>
                <MaintenanceList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landlord/payments"
            element={
              <ProtectedRoute allowedRoles={["LANDLORD", "ADMIN"]}>
                <RentPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landlord/add-expense"
            element={
              <ProtectedRoute allowedRoles={["LANDLORD", "ADMIN"]}>
                <AddExpense />
              </ProtectedRoute>
            }
          />

          {/* Tenant Routes */}
          <Route
            path="/tenant/home"
            element={
              <ProtectedRoute allowedRoles={["TENANT", "ADMIN"]}>
                <TenantHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenant/pay"
            element={
              <ProtectedRoute allowedRoles={["TENANT", "ADMIN"]}>
                <PayRent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenant/request"
            element={
              <ProtectedRoute allowedRoles={["TENANT", "ADMIN"]}>
                <NewRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenant/property/:propertyId"
            element={
              <ProtectedRoute allowedRoles={["TENANT", "ADMIN"]}>
                <TenantPropertyDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenant/rent-advance"
            element={
              <ProtectedRoute allowedRoles={["TENANT", "ADMIN"]}>
                <RentAdvance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenant/deposit-emi"
            element={
              <ProtectedRoute allowedRoles={["TENANT", "ADMIN"]}>
                <DepositEmi />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenant/marketplace"
            element={
              <ProtectedRoute allowedRoles={["TENANT", "ADMIN"]}>
                <Marketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tds-consent/:id"
            element={
              <ProtectedRoute allowedRoles={["TENANT", "ADMIN"]}>
                <TdsConsent />
              </ProtectedRoute>
            }
          />

          {/* Shared Routes */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/account"
            element={
              <ProtectedRoute>
                <AccountInformation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/payments"
            element={
              <ProtectedRoute>
                <PaymentMethods />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lease"
            element={
              <ProtectedRoute>
                <LeaseAgreement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vault"
            element={
              <ProtectedRoute>
                <Vault />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <ActivityCenter />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Suspense>
    </div>
  );
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reduced loading time to improve perceived performance
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Splash />;
  }

  return (
    <div className="font-display text-text-primary min-h-screen bg-background">
      <HashRouter>
        <AuthProvider>
          <ScrollToTop />
          <NativeBridge />
          <AppRoutes />
        </AuthProvider>
      </HashRouter>
    </div>
  );
};

export default App;
