import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions, Button } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { api } from "../api";

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen({ route, navigation }) {
  const { user } = route.params;

  const [sensorData, setSensorData] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const sensors = await api.get(`/sensors?device_id=${user.device_id}&limit=20`);
      const inc = await api.get(`/incidents?limit=20`);

      setSensorData(sensors.data);
      setIncidents(inc.data);
    } catch (err) {
      console.log("Dashboard error", err);
    }
  }

  const tempData = sensorData.map(d => d.temp);
  const smokeData = sensorData.map(d => d.smoke);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Live Monitoring</Text>
      <Text style={styles.device}>Device: {user.device_id}</Text>

      {/* Temperature Chart */}
      <Text style={styles.chartTitle}>Temperature</Text>
      <LineChart
        data={{
          labels: sensorData.map(() => ""),
          datasets: [{ data: tempData.length ? tempData : [0] }]
        }}
        width={screenWidth - 20}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />

      {/* Smoke Chart */}
      <Text style={styles.chartTitle}>Smoke</Text>
      <LineChart
        data={{
          labels: sensorData.map(() => ""),
          datasets: [{ data: smokeData.length ? smokeData : [0] }]
        }}
        width={screenWidth - 20}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />

      <View style={{ marginTop: 20 }}>
        <Button
          title="🚨 Call Fire Station"
          color="red"
          onPress={() => alert("Nearest station alerted")}
        />
      </View>

      <View style={{ marginTop: 30 }}>
        <Button title="Profile" onPress={() => navigation.navigate("Profile", { user })} />
        <Button title="Recharge" onPress={() => navigation.navigate("Recharge")} />
      </View>
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#111",
  backgroundGradientTo: "#111",
  color: () => "#3b82f6",
  strokeWidth: 2
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#000" },
  title: { fontSize: 22, color: "#fff", marginBottom: 10 },
  device: { color: "#aaa", marginBottom: 20 },
  chartTitle: { color: "#fff", marginTop: 10 },
  chart: { marginVertical: 8, borderRadius: 10 }
});