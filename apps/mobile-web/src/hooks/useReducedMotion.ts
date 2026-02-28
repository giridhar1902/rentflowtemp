import { useEffect, useState } from "react";

const query = "(prefers-reduced-motion: reduce)";
const FORCE_MOTION_STORAGE_KEY = "proptech.motion.force";

const readForcedMotion = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  const forcedFromUrl = params.get("forceMotion");

  if (forcedFromUrl === "1" || forcedFromUrl === "true") {
    window.localStorage.setItem(FORCE_MOTION_STORAGE_KEY, "1");
    return true;
  }

  if (forcedFromUrl === "0" || forcedFromUrl === "false") {
    window.localStorage.removeItem(FORCE_MOTION_STORAGE_KEY);
    return false;
  }

  return window.localStorage.getItem(FORCE_MOTION_STORAGE_KEY) === "1";
};

export const useReducedMotion = () => {
  const [forcedMotion, setForcedMotion] = useState<boolean>(() =>
    readForcedMotion(),
  );
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.forceMotion = forcedMotion
        ? "true"
        : "false";
    }
  }, [forcedMotion]);

  useEffect(() => {
    const onLocationChange = () => {
      setForcedMotion(readForcedMotion());
    };

    window.addEventListener("popstate", onLocationChange);
    window.addEventListener("hashchange", onLocationChange);
    return () => {
      window.removeEventListener("popstate", onLocationChange);
      window.removeEventListener("hashchange", onLocationChange);
    };
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }

    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  return forcedMotion ? false : reducedMotion;
};
