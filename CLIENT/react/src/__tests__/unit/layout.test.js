import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { ConfirmContext } from "../../context/ConfirmContext";
import { AuthContext } from "../../context/AuthContext";

describe("Header", () => {
  test("renders the LiPARENT logo and navigation links", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText(/LiPA/i)).toBeInTheDocument();
    expect(screen.getByText("DASH")).toBeInTheDocument();
    expect(screen.getByText("ROOMS")).toBeInTheDocument();
    expect(screen.getByText("TENANTS")).toBeInTheDocument();
    expect(screen.getByText("RENTS")).toBeInTheDocument();
    expect(screen.getByText("REVENUE")).toBeInTheDocument();
  });

  test("toggles the user dropdown when the profile icon is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    // Dropdown hidden initially
    expect(screen.queryByText("My Profile")).not.toBeInTheDocument();

    const icon = document.querySelector(".fa-user-circle");
    await user.click(icon);

    // Dropdown shown after click
    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText("My Subscriptions")).toBeInTheDocument();
  });
});

describe("Footer", () => {
  function renderFooter({ handleLogout = jest.fn().mockResolvedValue(undefined), confirm = jest.fn() } = {}) {
    return render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ handleLogout, isAuthenticated: true, accessToken: "t" }}
        >
          <ConfirmContext.Provider value={{ confirm }}>
            <Footer />
          </ConfirmContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
  }

  test("renders copyright and legal links", () => {
    renderFooter();

    expect(screen.getByText(/2024/)).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("LOG OUT")).toBeInTheDocument();
  });

  test("calls handleLogout when the user confirms the logout dialog", async () => {
    const user = userEvent.setup();
    const handleLogout = jest.fn().mockResolvedValue(undefined);
    const confirm = jest.fn().mockResolvedValue(true);

    renderFooter({ handleLogout, confirm });

    await user.click(screen.getByText("LOG OUT"));

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Confirm Logout" }),
    );
    expect(handleLogout).toHaveBeenCalled();
  });

  test("does not log out when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const handleLogout = jest.fn().mockResolvedValue(undefined);
    const confirm = jest.fn().mockResolvedValue(false);

    renderFooter({ handleLogout, confirm });

    await user.click(screen.getByText("LOG OUT"));
    expect(handleLogout).not.toHaveBeenCalled();
  });
});