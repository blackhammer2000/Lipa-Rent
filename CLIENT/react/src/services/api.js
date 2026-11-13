const serverDomain = "http://localhost:4000";

// Global loader hook - registered by LoaderProvider
let globalShowLoader = null;
let globalHideLoader = null;

export const registerLoader = (show, hide) => {
  globalShowLoader = show;
  globalHideLoader = hide;
};

export const unregisterLoader = () => {
  globalShowLoader = null;
  globalHideLoader = null;
};

// ---- Secure token storage (S8): cookies only, no localStorage ----
// Tokens are stored as HttpOnly/Secure cookies by the server. The browser
// sends them automatically when fetch() uses credentials: "include".

// Helper to clear non-token localStorage items (UI state only)
export const clearLocalStorage = () => {
  localStorage.removeItem("liparentSelectedPropertyId");
  localStorage.removeItem("liparentSelectedPropertyName");
  localStorage.removeItem("liparentSelectedRoomId");
  localStorage.removeItem("liparentSelectedRoomNumber");
  localStorage.removeItem("liparentSelectedTenantId");
  localStorage.removeItem("liparentSelectedTenantName");
  localStorage.removeItem("liparentRevenueSelectedPropertyName");
  localStorage.removeItem("liparentRevenueSelectedPropertyId");
  localStorage.removeItem("liparentRevenueSelectedPropertyRange");
};

// ---- Secure token storage (S8) ----
// CSRF token issued by the server on every response (X-CSRF-TOKEN header).
// Replayed on state-changing requests so S4 protection works on the client.
let csrfToken = null;

export const getCsrfToken = () => csrfToken;
export const setCsrfToken = (token) => {
  csrfToken = token;
};

// Refresh the short-lived access token using the HttpOnly refresh cookie
// set by the server (S7). Sent with credentials so the cookie travels.
export const refreshAccessToken = async () => {
  const response = await fetch(`${serverDomain}/api/user/owner/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || "Token refresh failed");
  return data; // { message, token: accessToken }
};

// Map API paths to friendly loading messages
const LOADING_MESSAGES = {
  "/api/user/owner/signup/generate/otp": "Sending sign up OTP...",
  "/api/user/owner/signup/verify/otp": "Verifying sign up OTP...",
  "/api/user/owner/signup": "Creating your account...",
  "/api/user/owner/login": "Logging in...",
  "/api/user/owner/get/otp": "Sending login OTP...",
  "/api/user/owner/verify/otp": "Verifying login OTP...",
  "/api/user/owner/logout": "Logging out...",
  "/api/user/owner/verify/nationalid": "Verifying your details...",
  "/api/user/owner/generate/forgotToken": "Generating password reset code...",
  "/api/user/owner/verify/forgotToken": "Verifying password reset code...",
  "/api/user/owner/edit/forgotPassword": "Resetting password...",
  "/api/user/read/owner": "Fetching owner details...",
  "/api/user/owner/edit/owner": "Updating profile...",
  "/api/user/owner/edit/password": "Updating password...",
  "/api/user/owner/verify/password": "Verifying password...",
  "/api/user/owner/generate/deleteToken": "Generating account deletion code...",
  "/api/user/owner/verify/deleteToken": "Verifying account deletion code...",
  "/api/user/owner/generate/resetToken": "Generating password reset code...",
  "/api/user/owner/verify/resetToken": "Verifying password reset code...",
  "/api/user/owner/read/properties": "Fetching properties...",
  "/api/user/owner/create/property": "Creating property...",
  "/api/user/owner/edit/property": "Updating property...",
  "/api/user/owner/delete/property": "Deleting property...",
  "/api/user/owner/read/property/rooms": "Fetching rooms...",
  "/api/user/owner/create/property/room": "Creating room...",
  "/api/user/owner/edit/property/room": "Updating room...",
  "/api/user/owner/delete/property/room": "Deleting room...",
  "/api/user/owner/read/property/room/tenants": "Fetching tenants...",
  "/api/user/owner/create/property/room/tenant": "Adding tenant...",
  "/api/user/owner/edit/property/room/tenant": "Updating tenant...",
  "/api/user/owner/delete/property/room/tenant": "Deleting tenant...",
  "/api/user/owner/read/property/room/tenant/payments":
    "Fetching rent payments...",
  "/api/user/owner/create/property/room/tenant/payment": "Adding payment...",
  "/api/user/owner/edit/property/room/tenant/payment": "Updating payment...",
  "/api/user/owner/delete/property/room/tenant/payment": "Deleting payment...",
  "/api/user/owner/read/property/rooms/tenants/payments":
    "Generating revenue report...",
  "/api/user/owner/read/subscriptions": "Fetching subscriptions...",
};

function getLoadingMessage(path) {
  let match = "";
  for (const key of Object.keys(LOADING_MESSAGES)) {
    if (path.startsWith(key) && key.length > match.length) {
      match = key;
    }
  }
  return match ? LOADING_MESSAGES[match] : "Loading...";
}

// Generic request handler
async function request(path, options = {}, loadingMessage = "") {
  const msg = loadingMessage || getLoadingMessage(path);
  if (globalShowLoader && msg) globalShowLoader(msg);
  // Send cookies (HttpOnly refresh token) cross-origin so S7/S8 cookie auth works.
  const fetchOptions = { ...options, credentials: "include" };
  // Attach CSRF token on state-changing requests (required by server S4 middleware).
  const isStateChanging = ["POST", "PATCH", "PUT", "DELETE"].includes(
    String(options.method || "GET").toUpperCase(),
  );
  if (isStateChanging && csrfToken) {
    fetchOptions.headers = {
      ...options.headers,
      "X-CSRF-Token": csrfToken,
    };
  }
  try {
    const response = await fetch(`${serverDomain}${path}`, fetchOptions);
    // Capture the fresh CSRF token issued by the server on every response.
    const responseCsrf = response.headers?.get?.("x-csrf-token");
    if (responseCsrf) setCsrfToken(responseCsrf);
    const data = await response.json();
    return data;
  } catch (err) {
    // Surface network/server errors so the UI can show a message
    return { error: err?.message || "Network error, please try again." };
  } finally {
    if (globalHideLoader) globalHideLoader();
  }
}

// ==================== AUTH API ====================

// Sign Up
export const sendSignUpOtp = (user) =>
  request("/api/user/owner/signup/generate/otp", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true },
    body: JSON.stringify({ user }),
  });

export const verifySignUpOtp = (otp, token) =>
  request("/api/user/owner/signup/verify/otp", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token, otp },
  });

export const completeSignUp = (token, { password, confirmPassword }) =>
  request("/api/user/owner/signup", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token },
    body: JSON.stringify({ password, confirmPassword }),
  });

// Login
export const login = (loginInfo) =>
  request("/api/user/owner/login", {
    mode: "cors",
    method: "POST",
    headers: { user: true, "Content-Type": "application/json" },
    body: JSON.stringify({ ...loginInfo }),
  });

export const sendLoginOtp = (loginToken) =>
  request("/api/user/owner/get/otp", {
    mode: "cors",
    method: "POST",
    headers: {
      user: true,
      "Content-Type": "application/json",
      logintoken: loginToken,
    },
  });

export const verifyLoginOtp = (loginToken, otp) =>
  request("/api/user/owner/verify/otp", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
      loginToken,
      otp,
    },
  });

// Logout
export const logout = () =>
  request("/api/user/owner/logout", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
  });

// Verify user info (forgot password)
export const verifyUserInfo = (email, nationalId) =>
  request("/api/user/owner/verify/nationalid", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true },
    body: JSON.stringify({ email, nationalId }),
  });

export const generateForgotPasswordCode = (token) =>
  request("/api/user/owner/generate/forgotToken", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token },
  });

export const verifyForgotPasswordCode = (token, resetCode) =>
  request("/api/user/owner/verify/forgotToken", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
      token,
      resettoken: resetCode,
    },
  });

export const editForgotPassword = (
  newPassword,
  confirmNewPassword,
  token,
  resetCode,
) =>
  request("/api/user/owner/edit/forgotPassword", {
    mode: "cors",
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      user: true,
      token,
      resettoken: resetCode,
    },
    body: JSON.stringify({ newPassword, confirmNewPassword }),
  });

// ==================== OWNER API ====================

export const readOwnerDetails = () =>
  request("/api/user/read/owner", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
  });

export const editOwnerDetails = (editedOwner) =>
  request("/api/user/owner/edit/owner", {
    mode: "cors",
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ editedOwner }),
  });

export const editPassword = (
  newPassword,
  confirmNewPassword,

  resetCode,
) =>
  request("/api/user/owner/edit/password", {
    mode: "cors",
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      user: true,
      resettoken: resetCode,
    },
    body: JSON.stringify({ newPassword, confirmNewPassword }),
  });

export const verifyPassword = (password) =>
  request("/api/user/owner/verify/password", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ password }),
  });

export const generateDeleteAccountCode = () =>
  request("/api/user/owner/generate/deleteToken", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
  });

export const verifyDeleteAccountCode = (deleteCode) =>
  request("/api/user/owner/verify/deleteToken", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
      deletetoken: deleteCode,
    },
  });

export const deleteAccount = (deleteCode) =>
  request("/api/user/owner/delete", {
    mode: "cors",
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      user: true,
      deletetoken: deleteCode,
    },
  });

export const generateResetPasswordCode = () =>
  request("/api/user/owner/generate/resetToken", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
  });

export const verifyResetPasswordCode = (resetToken) =>
  request("/api/user/owner/verify/resetToken", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
      resettoken: resetToken,
    },
  });

// ==================== PROPERTIES API ====================

export const readAllProperties = () =>
  request("/api/user/owner/read/properties", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
  });

export const createProperty = (newProperty) =>
  request("/api/user/owner/create/property", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ newProperty }),
  });

export const editProperty = (

  propertyId,
  propertyNo,
  editedProperty,
) =>
  request("/api/user/owner/edit/property", {
    mode: "cors",
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, propertyNo, editedProperty }),
  });

export const deleteProperty = (propertyId, propertyNo) =>
  request("/api/user/owner/delete/property", {
    mode: "cors",
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, propertyNo }),
  });

// ==================== ROOMS API ====================

export const readAllRooms = (propertyId) =>
  request("/api/user/owner/read/property/rooms", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId }),
  });

export const createRoom = (propertyId, newRoom) =>
  request("/api/user/owner/create/property/room", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, newRoom }),
  });

export const editRoom = (propertyId, roomId, editedRoom) =>
  request("/api/user/owner/edit/property/room", {
    mode: "cors",
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, roomId, editedRoom }),
  });

export const deleteRoom = (propertyId, roomId) =>
  request("/api/user/owner/delete/property/room", {
    mode: "cors",
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, roomId }),
  });

// ==================== TENANTS API ====================

export const readAllTenantsForRoom = (propertyId, roomId) =>
  request("/api/user/owner/read/property/room/tenants", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, roomId }),
  });

export const createTenant = (propertyId, roomId, newTenant) =>
  request("/api/user/owner/create/property/room/tenant", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, roomId, newTenant }),
  });

export const editTenant = (

  propertyId,
  roomId,
  tenantId,
  editedTenant,
) =>
  request("/api/user/owner/edit/property/room/tenant", {
    mode: "cors",
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, roomId, tenantId, editedTenant }),
  });

export const deleteTenant = (propertyId, roomId, tenantId) =>
  request("/api/user/owner/delete/property/room/tenant", {
    mode: "cors",
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, roomId, tenantId }),
  });

// ==================== RENTS/PAYMENTS API ====================

export const readAllTenantPayments = (

  propertyId,
  roomId,
  tenantId,
) =>
  request("/api/user/owner/read/property/room/tenant/payments", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, roomId, tenantId }),
  });

export const createPayment = (

  propertyId,
  roomId,
  tenantId,
  newPayment,
) =>
  request("/api/user/owner/create/property/room/tenant/payment", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, roomId, tenantId, newPayment }),
  });

export const editPayment = (

  propertyId,
  roomId,
  tenantId,
  paymentId,
  editedPayment,
) =>
  request("/api/user/owner/edit/property/room/tenant/payment", {
    mode: "cors",
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({
      propertyId,
      roomId,
      tenantId,
      paymentId,
      editedPayment,
    }),
  });

export const deletePayment = (

  propertyId,
  roomId,
  tenantId,
  paymentId,
) =>
  request("/api/user/owner/delete/property/room/tenant/payment", {
    mode: "cors",
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId, roomId, tenantId, paymentId }),
  });

// ==================== REVENUE API ====================

export const readAllPaymentsForRevenue = (propertyId) =>
  request("/api/user/owner/read/property/rooms/tenants/payments", {
    mode: "cors",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
    body: JSON.stringify({ propertyId }),
  });

// ==================== SUBSCRIPTIONS API ====================

export const readSubscriptions = () =>
  request("/api/user/owner/read/subscriptions", {
    mode: "cors",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      user: true,
    },
  });
