import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import VehicleLogin from "./screens/VehicleLoginScreen";
import VehicleDashboard from "./screens/VehicleDashboardScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={VehicleLogin} />
        <Stack.Screen name="Dashboard" component={VehicleDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}