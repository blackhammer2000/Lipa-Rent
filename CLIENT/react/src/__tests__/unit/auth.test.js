import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../../context/AuthProvider";
import { useAuth } from "../../hooks/useAuth";
import ProtectedRoute from "../../components/ProtectedRoute";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { getAccessToken } from "../../services/api";

// Mock api logout so no real fetch happens
jest.mock("../../services/api", () => ({
  getAccessToken: jest.fn(),
  clearLocalStorage: jest.fn(),
  logout: jest.fn().mockResolvedValue({}),
}));

function Consumer() {
  const { accessToken, isAuthenticated, handleLogin, handleLogout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{String(isAuthenticated)}</span>
      <span data-testid="token">{accessToken || "none"}</span>
      <button onClick={() => handleLogin("new-token")}>login</button>
      <button onClick={() => handleLogout()}>logout</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("is unauthenticated when no token exists", () => {
    getAccessToken.mockReturnValue(null);
    renderWithAuth();
    expect(screen.getByTestId("auth")).toHaveTextContent("false");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
  });

  test("is authenticated when a stored token exists", () => {
    getAccessToken.mockReturnValue("stored-token");
    renderWithAuth();
    expect(screen.getByTestId("auth")).toHaveTextContent("true");
    expect(screen.getByTestId("token")).toHaveTextContent("stored-token");
  });

  test("handleLogin sets the token and auth state", async () => {
    const user = userEvent.setup();
    getAccessToken.mockReturnValue(null);
    renderWithAuth();

    await user.click(screen.getByText("login"));

    expect(screen.getByTestId("auth")).toHaveTextContent("true");
    expect(screen.getByTestId("token")).toHaveTextContent("new-token");
  });

  test("handleLogout clears auth state", async () => {
    const user = userEvent.setup();
    getAccessToken.mockReturnValue("tok");
    renderWithAuth();

    expect(screen.getByTestId("auth")).toHaveTextContent("true");

    await user.click(screen.getByText("logout"));

    expect(screen.getByTestId("auth")).toHaveTextContent("false");
    expect(screen.getByTestId("token")).toHaveTextContent("none");
  });
});

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("redirects to /login when unauthenticated", () => {
    getAccessToken.mockReturnValue(null);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/login" element={<div>Login page</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Dashboard secret</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard secret")).not.toBeInTheDocument();
  });

  test("renders children when authenticated", () => {
    getAccessToken.mockReturnValue("tok");

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={ProtectedRoute ? <ProtectedRoute><div>Dashboard secret</div></ProtectedRoute> : null} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText("Dashboard secret")).toBeInTheDocument();
  });
});