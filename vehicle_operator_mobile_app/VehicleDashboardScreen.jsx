import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { api } from "../api";

const { width, height } = Dimensions.get("window");

export default function VehicleDashboardScreen() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [vehicleLocation, setVehicleLocation] = useState(null);

  useEffect(() => {
    loadIncidents();
    startGPS();
  }, []);

  async function loadIncidents() {
    const res = await api.get("/incidents?limit=20");
    setIncidents(res.data);
  }

  async function startGPS() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("GPS permission denied");
      return;
    }

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 5
      },
      (location) => {
        setVehicleLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
    );
  }

  return (
    <View style={styles.container}>

      {/* Incident List */}
      <View style={styles.leftPanel}>
        <Text style={styles.heading}>Assigned Incidents</Text>
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text
              style={styles.incident}
              onPress={() => setSelected(item)}
            >
              Incident {item.id} - {item.status}
            </Text>
          )}
        />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {selected && vehicleLocation && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: selected.lat,
              longitude: selected.lon,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05
            }}
          >
            {/* Incident Marker */}
            <Marker
              coordinate={{
                latitude: selected.lat,
                longitude: selected.lon
              }}
              title="Incident"
            />

            {/* Vehicle Marker */}
            <Marker
              coordinate={vehicleLocation}
              pinColor="blue"
              title="Vehicle"
            />

            {/* Route Line (Straight Line) */}
            <Polyline
              coordinates={[
                vehicleLocation,
                { latitude: selected.lat, longitude: selected.lon }
              ]}
              strokeWidth={4}
              strokeColor="red"
            />
          </MapView>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  leftPanel: {
    height: height * 0.3,
    backgroundColor: "#111",
    padding: 10
  },
  heading: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10
  },
  incident: {
    color: "#ccc",
    padding: 8,
    borderBottomWidth: 1,
    borderColor: "#333"
  },
  mapContainer: {
    flex: 1
  },
  map: {
    width: width,
    height: height * 0.7
  }
});