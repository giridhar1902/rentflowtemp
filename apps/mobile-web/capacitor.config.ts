import type { CapacitorConfig } from "@capacitor/cli";

const appId = process.env.CAPACITOR_APP_ID?.trim() || "com.rentflow.app";
const appName = process.env.CAPACITOR_APP_NAME?.trim() || "RentFlow";
const deepLinkScheme =
  process.env.CAPACITOR_DEEP_LINK_SCHEME?.trim() || "rentflow";
const deepLinkHost =
  process.env.CAPACITOR_DEEP_LINK_HOST?.trim() || "app.rentflow.local";

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId,
  appName,
  webDir: "dist",
  bundledWebRuntime: false,
  backgroundColor: "#0f172a",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: true,
        allowNavigation: ["*"],
      }
    : undefined,
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  ios: {
    scheme: deepLinkScheme,
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: !!serverUrl,
    captureInput: true,
    webContentsDebuggingEnabled: !serverUrl,
  },
};

// The host value is consumed by native manifests (Android/iOS) during phase setup docs.
void deepLinkHost;

export default config;
