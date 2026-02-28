import React, { useState, useEffect } from "react";
import { View, Text, Button, Picker, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api";

export default function AdminLoginScreen({ navigation }) {
  const [role, setRole] = useState("INSTALL_OPERATOR");
  const [stations, setStations] = useState([]);
  const [stationId, setStationId] = useState("");

  useEffect(() => {
    if (role === "STATION") {
      loadStations();
    }
  }, [role]);

  async function loadStations() {
    try {
      const res = await api.get("/fire-stations");
      setStations(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleLogin() {
    // Call real backend login if needed
    const res = await api.post("/users/login", {
      username: role === "INSTALL_OPERATOR" ? "installer" : "stationA",
      password: "station123"
    });

    await AsyncStorage.setItem("admin_user", JSON.stringify(res.data));

    if (res.data.role === "INSTALL_OPERATOR") {
      navigation.replace("Activation");
    } else {
      navigation.replace("Registration");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin / Operator Login</Text>

      <Picker selectedValue={role} onValueChange={setRole}>
        <Picker.Item label="Install Operator" value="INSTALL_OPERATOR" />
        <Picker.Item label="NFS" value="NFS" />
        <Picker.Item label="Fire Station" value="STATION" />
      </Picker>

      {role === "STATION" && (
        <Picker selectedValue={stationId} onValueChange={setStationId}>
          <Picker.Item label="Select Station" value="" />
          {stations.map(s => (
            <Picker.Item key={s.station_id} label={s.name} value={s.station_id} />
          ))}
        </Picker>
      )}

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 20, marginBottom: 20 }
});