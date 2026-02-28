import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";
import { api } from "../api";

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({});

  async function handleSignup() {
    try {
      const res = await api.post("/users/register", form);
      alert(`Registered. Amount ₹${res.data.amount}`);
      navigation.goBack();
    } catch {
      alert("Registration failed");
    }
  }

  return (
    <View style={styles.container}>
      <TextInput placeholder="Name" style={styles.input}
        onChangeText={v => setForm({ ...form, name: v })} />
      <TextInput placeholder="Phone" style={styles.input}
        onChangeText={v => setForm({ ...form, phone: v })} />
      <TextInput placeholder="Email" style={styles.input}
        onChangeText={v => setForm({ ...form, email: v })} />
      <TextInput placeholder="Username" style={styles.input}
        onChangeText={v => setForm({ ...form, username: v })} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input}
        onChangeText={v => setForm({ ...form, password: v })} />

      <Button title="Register" onPress={handleSignup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    borderRadius: 8
  }
});