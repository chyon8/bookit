import { Platform } from "react-native";

const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://localhost:3000";

export const BASE_URL = __DEV__ ? API_URL : "https://your-production-url.com";
