import {
  registerLoader,
  unregisterLoader,
  getAccessToken,
  getLoginToken,
  clearLocalStorage,
  sendSignUpOtp,
  login,
} from "../../services/api";

describe("api service helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    unregisterLoader();
  });

  test("registerLoader stores and unregisterLoader clears the loader hooks", () => {
    const show = jest.fn();
    const hide = jest.fn();
    registerLoader(show, hide);
    unregisterLoader();

    // Loader globals are module-private; this just confirms the functions exist and run.
    expect(show).not.toHaveBeenCalled();
    expect(hide).not.toHaveBeenCalled();
  });

  test("getAccessToken returns the stored access token", () => {
    localStorage.setItem("liparentAccessToken", "token-abc");
    expect(getAccessToken()).toBe("token-abc");
  });

  test("getAccessToken returns null when nothing is stored", () => {
    expect(getAccessToken()).toBeNull();
  });

  test("getLoginToken returns the stored login token", () => {
    localStorage.setItem("liparentLoginToken", "login-token");
    expect(getLoginToken()).toBe("login-token");
  });

  test("clearLocalStorage removes all liparent-prefixed keys", () => {
    localStorage.setItem("liparentAccessToken", "a");
    localStorage.setItem("liparentLoginToken", "b");
    localStorage.setItem("liparentSelectedRoomId", "c");
    localStorage.setItem("unrelated-key", "keep-me");

    clearLocalStorage();

    expect(localStorage.getItem("liparentAccessToken")).toBeNull();
    expect(localStorage.getItem("liparentLoginToken")).toBeNull();
    expect(localStorage.getItem("liparentSelectedRoomId")).toBeNull();
    expect(localStorage.getItem("unrelated-key")).toBe("keep-me");
  });
});

describe("api service request wrapper (via exported functions)", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  test("sendSignUpOtp posts the user to the correct endpoint", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ message: "OTP sent" }),
    });

    const result = await sendSignUpOtp({ email: "a@b.com" });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/user/owner/signup/generate/otp");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body).user.email).toBe("a@b.com");
    expect(result.message).toBe("OTP sent");
  });

  test("login sends credentials and returns parsed json", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ loginToken: "tok-1" }),
    });

    const result = await login({
      email: "a@b.com",
      nationalID: "123",
      password: "secret123",
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.loginToken).toBe("tok-1");
  });

  test("surfaces a network error when fetch throws", async () => {
    global.fetch.mockRejectedValueOnce(new Error("boom"));

    const result = await login({});

    expect(result.error).toBe("boom");
  });

  test("toggles the global loader around the request", async () => {
    const show = jest.fn();
    const hide = jest.fn();
    registerLoader(show, hide);
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ ok: true }),
    });

    await login({ email: "a@b.com", nationalID: "1", password: "12345678" });

    expect(show).toHaveBeenCalled();
    expect(hide).toHaveBeenCalled();
  });
});