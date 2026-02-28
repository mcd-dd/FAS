import React, { useEffect, useState } from "react";
import { fetchVehicles, createVehicle, updateVehicle } from "../api";

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await fetchVehicles();
    setVehicles(data);
  }

  async function toggleStatus(vehicle) {
    const newStatus =
      vehicle.status === "MAINTENANCE"
        ? "AVAILABLE"
        : "MAINTENANCE";

    await updateVehicle(vehicle.vehicle_id, {
      status: newStatus
    });

    load();
  }

  async function addVehicle() {
    await createVehicle({
      vehicle_id: newVehicle,
      name: newVehicle,
      station_id: "STATION_A"
    });
    setNewVehicle("");
    load();
  }

  async function setMaintenance(id) {
    await updateVehicle(id, { status: "MAINTENANCE" });
    load();
  }

  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">Fire Vehicles</h2>

      <div className="flex gap-2 mb-4">
        <input
          value={newVehicle}
          onChange={(e) => setNewVehicle(e.target.value)}
          className="bg-slate-700 p-2"
          placeholder="Vehicle ID"
        />
        <button onClick={addVehicle} className="bg-green-600 px-3 py-2 rounded">
          Add
        </button>
      </div>

      {vehicles.map((v) => (
        <div key={v.vehicle_id} className="flex justify-between bg-slate-800 p-3 mb-2 rounded">
          <div>
            {v.vehicle_id} — {v.status}
          </div>
          <button
            onClick={() => toggleStatus(v)}
            className={`px-3 py-1 rounded ${
              v.status === "MAINTENANCE"
                ? "bg-green-600"
                : "bg-yellow-600"
            }`}
          >
            {v.status === "MAINTENANCE"
              ? "Set Available"
              : "Maintenance"}
          </button>
          {/* <button
            onClick={() => setMaintenance(v.vehicle_id)}
            className="bg-yellow-600 px-3 py-1 rounded"
          >
            Maintenance
          </button> */}
        </div>
      ))}
    </div>
  );
}