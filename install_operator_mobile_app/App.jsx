import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AdminLogin from "./screens/AdminLoginScreen";
import Registration from "./screens/RegistrationScreen";
import DeviceActivation from "./screens/DeviceActivationScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={AdminLogin} />
        <Stack.Screen name="Registration" component={Registration} />
        <Stack.Screen name="Activation" component={DeviceActivation} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}