import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../context/AuthProvider";
import Login from "../../pages/Login";
import ProtectedRoute from "../../components/ProtectedRoute";

// Fully mock the API layer so no real network calls happen.
jest.mock("../../services/api", () => ({
  getAccessToken: () => null,
  clearLocalStorage: () => {},
  logout: jest.fn().mockResolvedValue({}),
  login: jest.fn(),
  sendLoginOtp: jest.fn(),
  verifyLoginOtp: jest.fn(),
  verifyUserInfo: jest.fn(),
  generateForgotPasswordCode: jest.fn(),
  verifyForgotPasswordCode: jest.fn(),
  editForgotPassword: jest.fn(),
}));

import {
  login,
  sendLoginOtp,
  verifyLoginOtp,
} from "../../services/api";

const DashboardStub = () => <h1>DASHBOARD SECRET</h1>;

function renderLoginFlow() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardStub />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("Login → Dashboard (integration)", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("logs in a valid user and reaches the protected dashboard", async () => {
    const user = userEvent.setup();

    // login returns a loginToken, then OTP verify returns a final access token
    login.mockResolvedValueOnce({ loginToken: "login-tok" });
    sendLoginOtp.mockResolvedValueOnce({
      message: "OTP sent",
      loginToken: "login-tok",
    });
    verifyLoginOtp.mockResolvedValueOnce({
      token: "final-access-token",
      message: "Logged in",
    });

    renderLoginFlow();

    await user.type(screen.getByPlaceholderText("Email"), "john@example.com");
    await user.type(screen.getByPlaceholderText("National ID"), "abc123");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByText("LOG IN"));

    // After login returns a loginToken, the app requests an OTP and shows the OTP modal.
    expect(await screen.findByText("Enter login OTP")).toBeInTheDocument();

    const otpInput = document
      .querySelector(".modal-body input");
    expect(otpInput).not.toBeNull();
    await user.type(otpInput, "123456");

    const verifyButton = await screen.findByRole("button", { name: /verify/i });
    await user.click(verifyButton);

    // Verifying the OTP sets the token and navigates to /dashboard.
    expect(await screen.findByText("DASHBOARD SECRET")).toBeInTheDocument();
  });

  test("shows an error if login fails", async () => {
    const user = userEvent.setup();
    login.mockResolvedValueOnce({ error: "Invalid credentials." });

    renderLoginFlow();

    await user.type(screen.getByPlaceholderText("Email"), "x@y.com");
    await user.type(screen.getByPlaceholderText("National ID"), "abc");
    await user.type(screen.getByPlaceholderText("Password"), "short");
    await user.click(screen.getByText("LOG IN"));

    expect(await screen.findByText("Invalid credentials.")).toBeInTheDocument();
    expect(screen.queryByText("DASHBOARD SECRET")).not.toBeInTheDocument();
  });
});