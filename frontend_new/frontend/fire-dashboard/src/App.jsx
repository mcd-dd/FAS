import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

import NavRight from "./components/NavRight";

import AdminLogin from "./pages/AdminLogin";
import UserLogin from "./pages/UserLogin";
import UserSignupPage from "./pages/UserSignUpPage";
import DeviceActivationPage from "./pages/DeviceActivationPage";
import UserDashboard from "./components/UserDashboard";
import UserNavRight from "./components/UserNavRight";
import IncidentsPage from "./pages/IncidentsPage";
import RechargePlan from "./pages/RechargePlan"
import ProfilePage from "./pages/ProfilePage"
import VehicleManagement from "./pages/VehicleManagement"
import VehicleOperatorDashboard from "./components/VehicleOperatorDashboard";

/* Protect private routes */
// function PrivateRoute({ children }) {
//   const { user } = useAuth();
//   return user ? children : <Navigate to="/user-login" replace />;
// }

function PrivateRoute({ children, allowedRoles }) {
    const { user } = useAuth();
  
    if (!user) return <Navigate to="/user-login" replace />;
  
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  
    return children;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

/* Layout wrapper */
function Layout({ children }) {
  const location = useLocation();

  const hideNav =
    location.pathname === "/admin-login" ||
    location.pathname === "/user-login" ||
    location.pathname === "/signup";

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      <div className="flex-1">{children}</div>
      {!hideNav && <NavRight />}
    </div>
  );
}

function UserLayout({ children }) {
  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      <UserNavRight />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* DEFAULT */}
        <Route path="/" element={<Navigate to="/user-login" replace />} />

        {/* PUBLIC */}
        <Route
          path="/signup"
          element={
            <Layout>
              <UserSignupPage />
            </Layout>
          }
        />

        <Route
          path="/admin-login"
          element={
            <Layout>
              <AdminLogin />
            </Layout>
          }
        />

        <Route
          path="/user-login"
          element={
            <Layout>
              <UserLogin />
            </Layout>
          }
        />

        {/* INSTALL OPERATOR */}
        <Route
          path="/device-activation"
          element={
            <PrivateRoute>
              <Layout>
                <DeviceActivationPage />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* ADMIN / STATION */}
        {/* <Route
          path="/incidents"
          element={
            <PrivateRoute>
              <Layout>
                <IncidentsPage />
              </Layout>
            </PrivateRoute>
          }
        /> */}

        {/* CUSTOMER */}
        <Route
          path="/user-dashboard"
          element={
            <PrivateRoute>
              <UserLayout>
                <UserDashboard />
              </UserLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/recharge-plan"
          element={
            <PrivateRoute>
              <UserLayout>
                <RechargePlan />
              </UserLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/view-profile"
          element={
            <PrivateRoute>
              <UserLayout>
                <ProfilePage />
              </UserLayout>
            </PrivateRoute>
          }
        />

        <Route
        path="/vehicles"
        element={
          <PrivateRoute>
            <Layout>
              <VehicleManagement />
            </Layout>
          </PrivateRoute>
        }
        />

        {/* INCIDENTS ROUTE */}
        <Route
          path="/incidents"
          element={
            <ProtectedRoute allowedRoles={["STATION", "NFS"]}>
              <Layout>
                <IncidentsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* VEHICLE DASHBOARD */}
        <Route
            path="/vehicle-dashboard"
            element={
            <PrivateRoute allowedRoles={["VEHICLE_OPERATOR"]}>
                <Layout>
                <VehicleOperatorDashboard />
                </Layout>
            </PrivateRoute>
            }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/user-login" replace />} />

      </Routes>
    </AuthProvider>
  );
}
