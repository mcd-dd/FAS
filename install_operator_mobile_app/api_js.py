import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = "http://192.168.1.20:8000"; // ⚠️ change to your backend IP

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
});

// Attach session-id automatically
api.interceptors.request.use(async (config) => {
  const user = await AsyncStorage.getItem("admin_user");
  const parsed = user ? JSON.parse(user) : null;

  if (parsed?.session_id) {
    config.headers["session-id"] = parsed.session_id;
  }

  return config;
});