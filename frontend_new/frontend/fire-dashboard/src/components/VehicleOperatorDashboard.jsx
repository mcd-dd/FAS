import React, { useEffect, useState, useRef } from "react";
import { fetchIncidents, fetchSensorData } from "../api";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

const vehicleIcon = new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],   // bottom center
    popupAnchor: [0, -32],
  });

export default function VehicleOperatorDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);
//   const vehicleLat = 12.9716;
//   const vehicleLon = 77.5946;
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const routingRef = useRef(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await fetchIncidents();
    setIncidents(data);
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
  
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
  
        sendVehicleLocation(latitude, longitude);
        
        setVehicleLocation({
          lat: latitude,
          lon: longitude,
        });
      },
      (error) => {
        console.error("GPS error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  
    return () => navigator.geolocation.clearWatch(watchId);
  
  }, []);
  
  /* 🔥 ROUTING EFFECT (Recalculates when vehicle moves OR incident changes) */
  useEffect(() => {
    if (!selected || !vehicleLocation || !mapRef.current) return;

    const map = mapRef.current;

    // Remove previous route
    if (routingRef.current) {
      map.removeControl(routingRef.current);
    }

    routingRef.current = L.Routing.control({
      waypoints: [
        L.latLng(vehicleLocation.lat, vehicleLocation.lon),
        L.latLng(selected.lat, selected.lon),
      ],
      routeWhileDragging: false,
      show: false,
    }).addTo(map);

  }, [selected, vehicleLocation]);

  return (
    <div className="flex h-full">

      {/* LEFT PANEL */}
      <div className="w-1/3 bg-slate-900 p-4 overflow-auto">
        <h2 className="text-lg mb-3">Assigned Incidents</h2>

        {incidents.map((inc) => (
          <div
            key={inc.id}
            onClick={() => setSelected(inc)}
            className="bg-slate-800 p-3 mb-2 cursor-pointer rounded"
          >
            Incident {inc.id}
            <div className="text-sm text-slate-400">
              {inc.status}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-4">

        {selected && (
          <MapContainer
            whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
            }}
            center={[selected.lat, selected.lon]}
            zoom={13}
            style={{ height: "70%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[selected.lat, selected.lon]} />

            {/* 🚒 Live Vehicle Marker */}
            {vehicleLocation && (
              <Marker
                position={[vehicleLocation.lat, vehicleLocation.lon]}
                icon={vehicleIcon}
              />
            )}
          </MapContainer>
        )}

      </div>
    </div>
  );
}