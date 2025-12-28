import { Platform } from "react-native";
import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (!__DEV__) {
    return "https://bookit-sigma-virid.vercel.app";
  }

  // Get the IP address of the machine running the Expo dev server
  const debuggerHost = Constants.expoConfig?.hostUri;
  const address = debuggerHost?.split(':')[0];

  if (!address) {
    return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
  }

  // Assuming Next.js (proxy server) is running on the same machine at port 3000
  return `http://${address}:3000`;
};

export const BASE_URL = getBaseUrl();
