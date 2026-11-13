import { useState, useEffect, useCallback, useRef } from "react";
import { LoaderContext } from "./LoaderContext";
import { registerLoader, unregisterLoader } from "../services/api";

const MIN_DISPLAY_MS = 400;

export function LoaderProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Track when the loader was shown so we can enforce a minimum display time
  const shownAtRef = useRef(null);
  const hideTimerRef = useRef(null);

  const showLoader = useCallback((msg) => {
    setMessage(msg);
    setLoading(true);
    shownAtRef.current = Date.now();
  }, []);

  const hideLoader = useCallback(() => {
    // Always clear any pending timer
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : 0;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    if (remaining === 0) {
      setLoading(false);
      setMessage("");
      shownAtRef.current = null;
    } else {
      hideTimerRef.current = setTimeout(() => {
        setLoading(false);
        setMessage("");
        shownAtRef.current = null;
        hideTimerRef.current = null;
      }, remaining);
    }
  }, []);

  // Register the loader with the API service so every API call can trigger it
  useEffect(() => {
    registerLoader(showLoader, hideLoader);
    return () => {
      unregisterLoader();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [showLoader, hideLoader]);

  return (
    <LoaderContext.Provider
      value={{ loading, message, showLoader, hideLoader }}
    >
      {children}
    </LoaderContext.Provider>
  );
}
