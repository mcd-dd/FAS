import React, { useState, useEffect } from "react";
import { View, TextInput, Button, Picker, Text, StyleSheet } from "react-native";
import { api } from "../api";

export default function RegistrationScreen() {
  const [deviceId, setDeviceId] = useState("");
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [stations, setStations] = useState([]);
  const [station, setStation] = useState("");

  useEffect(() => {
    loadStations();
  }, []);

  async function loadStations() {
    const res = await api.get("/fire-stations");
    setStations(res.data);
  }

  async function handleRegister() {
    try {
      await api.post("/devices/register", {
        device_id: deviceId,
        lat: 12.9716,
        lon: 77.5946,
        primary_station_id: station,
        user: {
          name: userName,
          phone,
          address
        }
      });

      alert("Device Registered Successfully");
    } catch {
      alert("Registration Failed");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Device</Text>

      <TextInput placeholder="User Name" style={styles.input} onChangeText={setUserName} />
      <TextInput placeholder="Device ID" style={styles.input} onChangeText={setDeviceId} />
      <TextInput placeholder="Phone" style={styles.input} onChangeText={setPhone} />
      <TextInput placeholder="Address" style={styles.input} onChangeText={setAddress} />

      <Picker selectedValue={station} onValueChange={setStation}>
        <Picker.Item label="Select Station" value="" />
        {stations.map(s => (
          <Picker.Item key={s.station_id} label={s.name} value={s.station_id} />
        ))}
      </Picker>

      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, marginBottom: 10 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 6
  }
});