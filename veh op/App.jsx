import VehicleOperatorDashboard from "./components/VehicleOperatorDashboard";

function PrivateRoute({ children, allowedRoles }) {
    const { user } = useAuth();
  
    if (!user) return <Navigate to="/user-login" replace />;
  
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  
    return children;
  }

{/* INCIDENTS ROUTE */}
<Route
  path="/incidents"
  element={
    <PrivateRoute allowedRoles={["STATION", "NFS"]}>
      <Layout>
        <IncidentsPage />
      </Layout>
    </PrivateRoute>
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