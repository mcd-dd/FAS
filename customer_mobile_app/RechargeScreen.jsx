import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";

export default function RechargeScreen() {
  const [plan, setPlan] = useState("monthly");

  const pricing = {
    monthly: 500,
    quarterly: 1400,
    yearly: 5000
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recharge Plan</Text>

      {Object.keys(pricing).map(p => (
        <Button
          key={p}
          title={`${p} - ₹${pricing[p]}`}
          onPress={() => setPlan(p)}
        />
      ))}

      <View style={{ marginTop: 20 }}>
        <Button
          title={`Pay ₹${pricing[plan]}`}
          onPress={() => alert("Recharge successful")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 20 }
});