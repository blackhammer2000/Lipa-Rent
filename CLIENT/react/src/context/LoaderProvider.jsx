import { useState, useEffect } from "react";
import { LoaderContext } from "./LoaderContext";
import { registerLoader, unregisterLoader } from "../services/api";

export function LoaderProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const showLoader = (msg) => {
    setMessage(msg);
    setLoading(true);
  };

  const hideLoader = () => {
    setLoading(false);
    setMessage("");
  };

  // Register the loader with the API service so every API call can trigger it
  useEffect(() => {
    registerLoader(showLoader, hideLoader);
    return () => {
      unregisterLoader();
    };
  }, []);

  return (
    <LoaderContext.Provider value={{ loading, message, showLoader, hideLoader }}>
      {children}
    </LoaderContext.Provider>
  );
}