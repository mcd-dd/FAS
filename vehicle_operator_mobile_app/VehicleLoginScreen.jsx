import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api";

export default function VehicleLoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const res = await api.post("/users/login", {
        username,
        password
      });

      if (res.data.role !== "STATION") {
        alert("Only station vehicle operators allowed");
        return;
      }

      await AsyncStorage.setItem("vehicle_user", JSON.stringify(res.data));
      navigation.replace("Dashboard");
    } catch {
      alert("Login Failed");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicle Operator Login</Text>

      <TextInput
        placeholder="Username"
        style={styles.input}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={setPassword}
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 22, marginBottom: 20 },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    borderRadius: 8
  }
});