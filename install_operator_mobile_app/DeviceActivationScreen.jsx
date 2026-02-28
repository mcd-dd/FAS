import React, { useEffect, useState } from "react";
import { View, Text, Picker, TextInput, Button, StyleSheet } from "react-native";
import { api } from "../api";

export default function DeviceActivationScreen() {
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [station, setStation] = useState("");
  const [plan, setPlan] = useState("monthly");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const pending = await api.get("/users/pending");
    const stationsRes = await api.get("/fire-stations");

    setUsers(pending.data);
    setStations(stationsRes.data);
  }

  async function handleActivate() {
    try {
      await api.post("/devices/activate", {
        user_id: selectedUser,
        device_id: deviceId,
        primary_station_id: station,
        plan
      });

      alert("Device Activated Successfully");
    } catch {
      alert("Activation Failed");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Device Activation</Text>

      <Picker selectedValue={selectedUser} onValueChange={setSelectedUser}>
        <Picker.Item label="Select User" value="" />
        {users.map(u => (
          <Picker.Item key={u.user_id} label={`${u.name} (${u.plan})`} value={u.user_id} />
        ))}
      </Picker>

      {selectedUser && (
        <>
          <TextInput placeholder="Device ID" style={styles.input} onChangeText={setDeviceId} />

          <Picker selectedValue={station} onValueChange={setStation}>
            <Picker.Item label="Select Station" value="" />
            {stations.map(s => (
              <Picker.Item key={s.station_id} label={s.name} value={s.station_id} />
            ))}
          </Picker>

          <Picker selectedValue={plan} onValueChange={setPlan}>
            <Picker.Item label="Monthly" value="monthly" />
            <Picker.Item label="Quarterly" value="quarterly" />
            <Picker.Item label="Yearly" value="yearly" />
          </Picker>

          <Button title="Activate" onPress={handleActivate} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, marginBottom: 10 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    borderRadius: 6
  }
});