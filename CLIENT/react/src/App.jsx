import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { LoaderProvider } from "./context/LoaderProvider";
import { ConfirmProvider } from "./context/ConfirmProvider";
import Loader from "./components/Loader";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Tenants from "./pages/Tenants";
import Rents from "./pages/Rents";
import Revenue from "./pages/Revenue";
import Profile from "./pages/Profile";
import Subscriptions from "./pages/Subscriptions";

function App() {
  return (
    <AuthProvider>
      <LoaderProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Loader />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute>
                    <Rooms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tenants"
                element={
                  <ProtectedRoute>
                    <Tenants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rents"
                element={
                  <ProtectedRoute>
                    <Rents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/revenue"
                element={
                  <ProtectedRoute>
                    <Revenue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscriptions"
                element={
                  <ProtectedRoute>
                    <Subscriptions />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </ConfirmProvider>
      </LoaderProvider>
    </AuthProvider>
  );
}

export default App;
