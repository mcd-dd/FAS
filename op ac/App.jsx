import VehicleManagement from "./pages/VehicleManagement"

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