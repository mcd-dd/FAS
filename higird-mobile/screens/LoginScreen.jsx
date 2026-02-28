import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { api } from "../api";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const res = await api.post("/users/login", {
    username,
    password,
      });

      navigation.replace("Dashboard", { user: res.data });
    } catch {
      alert("Invalid credentials");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HiGrid</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
    <Text style={{ color: "#fff" }}>Login</Text>
      </TouchableOpacity>

      <Text
    style={styles.link}
    onPress={() => navigation.navigate("Signup")}
      >
    Create Account
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 28, textAlign: "center", marginBottom: 20 },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    borderRadius: 8
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    alignItems: "center",
    borderRadius: 8
  },
  link: {
    marginTop: 20,
    textAlign: "center",
    color: "#2563eb"
  }
}); 