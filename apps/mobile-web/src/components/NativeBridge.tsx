import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type PermissionStatus,
  type Token,
} from "@capacitor/push-notifications";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const DEEP_LINK_SCHEME = (import.meta.env.VITE_DEEP_LINK_SCHEME ?? "rentflow")
  .trim()
  .toLowerCase();
const DEEP_LINK_HOST = (
  import.meta.env.VITE_DEEP_LINK_HOST ?? "app.rentflow.local"
)
  .trim()
  .toLowerCase();

const isNative = Capacitor.isNativePlatform();

const parseDeepLinkPath = (urlValue: string) => {
  try {
    const url = new URL(urlValue);

    if (
      url.protocol.replace(":", "").toLowerCase() !== DEEP_LINK_SCHEME ||
      url.host.toLowerCase() !== DEEP_LINK_HOST
    ) {
      return null;
    }

    if (url.hash.startsWith("#/")) {
      return url.hash.slice(1);
    }

    const pathname = url.pathname.startsWith("/")
      ? url.pathname
      : `/${url.pathname}`;
    const query = url.search || "";
    return `${pathname}${query}`;
  } catch {
    return null;
  }
};

const normalizePushPermission = (status: PermissionStatus) => status.receive;

const NativeBridge: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [nativePushToken, setNativePushToken] = useState<string | null>(null);
  const [lastPushError, setLastPushError] = useState<string | null>(null);

  const backendPushPlatform = useMemo(() => {
    const platform = Capacitor.getPlatform();
    if (platform === "ios") {
      return "IOS" as const;
    }
    if (platform === "android") {
      return "ANDROID" as const;
    }
    return "WEB" as const;
  }, []);

  const lastRegisteredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isNative) {
      return;
    }

    const listener = CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      const path = parseDeepLinkPath(url);
      if (!path) {
        return;
      }
      navigate(path);
    });

    return () => {
      void listener.then((subscription) => subscription.remove());
    };
  }, [navigate]);

  useEffect(() => {
    if (!isNative) {
      return;
    }

    let disposed = false;

    const registrationListener = PushNotifications.addListener(
      "registration",
      (token: Token) => {
        if (disposed) {
          return;
        }
        setNativePushToken(token.value);
        setLastPushError(null);
      },
    );

    const errorListener = PushNotifications.addListener(
      "registrationError",
      (event) => {
        if (disposed) {
          return;
        }
        setLastPushError(event.error);
      },
    );

    const receivedListener = PushNotifications.addListener(
      "pushNotificationReceived",
      () => {
        // In-app notification state is refreshed via existing polling endpoints.
      },
    );

    const actionListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (event) => {
        const navigationPath =
          typeof event.notification.data?.path === "string"
            ? event.notification.data.path
            : undefined;

        if (navigationPath?.startsWith("/")) {
          navigate(navigationPath);
        }
      },
    );

    const requestAndRegister = async () => {
      try {
        const initialPermission = await PushNotifications.checkPermissions();
        let currentPermission = normalizePushPermission(initialPermission);

        if (currentPermission === "prompt") {
          const requestedPermission =
            await PushNotifications.requestPermissions();
          currentPermission = normalizePushPermission(requestedPermission);
        }

        if (currentPermission === "granted") {
          await PushNotifications.register();
        }
      } catch (error) {
        if (disposed) {
          return;
        }
        setLastPushError(
          error instanceof Error
            ? error.message
            : "Push registration initialization failed",
        );
      }
    };

    void requestAndRegister();

    return () => {
      disposed = true;
      void registrationListener.then((subscription) => subscription.remove());
      void errorListener.then((subscription) => subscription.remove());
      void receivedListener.then((subscription) => subscription.remove());
      void actionListener.then((subscription) => subscription.remove());
    };
  }, [navigate]);

  useEffect(() => {
    const registerWithBackend = async () => {
      if (!isNative || !session || !nativePushToken) {
        return;
      }

      if (lastRegisteredTokenRef.current === nativePushToken) {
        return;
      }

      try {
        await api.registerPushDevice(session.access_token, {
          platform: backendPushPlatform,
          token: nativePushToken,
          deviceName: `capacitor-${Capacitor.getPlatform()}`,
          appVersion: import.meta.env.VITE_APP_VERSION ?? "dev",
        });
        lastRegisteredTokenRef.current = nativePushToken;
        setLastPushError(null);
      } catch (error) {
        setLastPushError(
          error instanceof Error
            ? error.message
            : "Unable to register push token with backend",
        );
      }
    };

    void registerWithBackend();
  }, [backendPushPlatform, nativePushToken, session]);

  useEffect(() => {
    if (!lastPushError || !isNative) {
      return;
    }

    console.warn("Push setup warning:", lastPushError);
  }, [lastPushError]);

  return null;
};

export default NativeBridge;
