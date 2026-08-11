import { useState } from "react";
import { AuthContext } from "./AuthContext";
import { getAccessToken, clearLocalStorage, logout as apiLogout } from "../services/api";

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(getAccessToken());
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());

  const handleLogin = (token) => {
    localStorage.setItem("liparentAccessToken", token);
    setAccessToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    if (accessToken) {
      try {
        await apiLogout(accessToken);
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    clearLocalStorage();
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ accessToken, isAuthenticated, handleLogin, handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}