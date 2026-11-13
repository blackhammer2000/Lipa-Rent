import { useState, useEffect } from "react";
// import { AuthContext } from "./AuthContext";
import {
  clearLocalStorage,
  logout as apiLogout,
  refreshAccessToken,
} from "../services/api";

export function AuthProvider({ children }) {
  // null = checking mount-time refresh cookie; true = authenticated; false = not
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // Mount-time auth check: try to refresh via the HttpOnly cookie.
    // If the refresh cookie is valid, the session survives a reload.
    refreshAccessToken()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const handleLogin = () => {
    // Access token is already set as HttpOnly cookie by the server (Set-Cookie).
    setIsAuthenticated(true);
  };

  const handleRefresh = async () => {
    try {
      await refreshAccessToken();
      setIsAuthenticated(true);
      return true;
    } catch {
      // Refresh failed (e.g., expired/missing refresh cookie) — surface as unauthenticated
      setIsAuthenticated(false);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    clearLocalStorage();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        handleLogin,
        handleRefresh,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
