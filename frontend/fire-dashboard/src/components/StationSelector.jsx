import React, { useEffect, useState } from "react";
import { fetchFireStations } from "../api";

export default function StationSelector({ value, onChange }) {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchFireStations();
        setStations(data);
      } catch (e) {
        console.error("Failed to load stations", e);
      }
    }
    load();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-800 text-white border border-slate-600 rounded px-3 py-1"
    >
      <option value="ALL">All Stations</option>

      {stations.map((s) => (
        <option key={s.station_id} value={s.station_id}>
          {s.name} ({s.status})
        </option>
      ))}
    </select>
  );
}
