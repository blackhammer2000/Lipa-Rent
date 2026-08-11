const serverDomain = "http://localhost:4000";

// Helper to get access token from localStorage
export const getAccessToken = () =>
  localStorage.getItem("liparentAccessToken") || null;

// Helper to get login token from localStorage
export const getLoginToken = () =>
  localStorage.getItem("liparentLoginToken") || null;

// Helper to clear all localStorage items
export const clearLocalStorage = () => {
  localStorage.removeItem("liparentLoginToken");
  localStorage.removeItem("liparentAccessToken");
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

// Generic request handler
async function request(path, options = {}) {
  const response = await fetch(`${serverDomain}${path}`, options);
  return response.json();
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
    headers: { user: true, "Content-Type": "application/json", logintoken: loginToken },
  });

export const verifyLoginOtp = (loginToken, otp) =>
  request("/api/user/owner/verify/otp", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, loginToken, otp },
  });

// Logout
export const logout = (accessToken) =>
  request("/api/user/owner/logout", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
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
    headers: { "Content-Type": "application/json", user: true, token, resettoken: resetCode },
  });

export const editForgotPassword = (newPassword, confirmNewPassword, token, resetCode) =>
  request("/api/user/owner/edit/forgotPassword", {
    mode: "cors",
    method: "PATCH",
    headers: { "Content-Type": "application/json", user: true, token, resettoken: resetCode },
    body: JSON.stringify({ newPassword, confirmNewPassword }),
  });

// ==================== OWNER API ====================

export const readOwnerDetails = (accessToken) =>
  request("/api/user/read/owner", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
  });

export const editOwnerDetails = (accessToken, editedOwner) =>
  request("/api/user/owner/edit/owner", {
    mode: "cors",
    method: "PATCH",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ editedOwner }),
  });

export const editPassword = (newPassword, confirmNewPassword, accessToken, resetCode) =>
  request("/api/user/owner/edit/password", {
    mode: "cors",
    method: "PATCH",
    headers: { "Content-Type": "application/json", user: true, token: accessToken, resettoken: resetCode },
    body: JSON.stringify({ newPassword, confirmNewPassword }),
  });

export const verifyPassword = (accessToken, password) =>
  request("/api/user/owner/verify/password", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ password }),
  });

export const generateDeleteAccountCode = (accessToken) =>
  request("/api/user/owner/generate/deleteToken", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
  });

export const verifyDeleteAccountCode = (accessToken, deleteCode) =>
  request("/api/user/owner/verify/deleteToken", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken, deletetoken: deleteCode },
  });

export const deleteAccount = (accessToken, deleteCode) =>
  request("/api/user/owner/delete", {
    mode: "cors",
    method: "DELETE",
    headers: { "Content-Type": "application/json", user: true, token: accessToken, deletetoken: deleteCode },
  });

export const generateResetPasswordCode = (accessToken) =>
  request("/api/user/owner/generate/resetToken", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
  });

export const verifyResetPasswordCode = (accessToken, resetToken) =>
  request("/api/user/owner/verify/resetToken", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken, resettoken: resetToken },
  });

// ==================== PROPERTIES API ====================

export const readAllProperties = (accessToken) =>
  request("/api/user/owner/read/properties", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
  });

export const createProperty = (accessToken, newProperty) =>
  request("/api/user/owner/create/property", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ newProperty }),
  });

export const editProperty = (accessToken, propertyId, propertyNo, editedProperty) =>
  request("/api/user/owner/edit/property", {
    mode: "cors",
    method: "PATCH",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, propertyNo, editedProperty }),
  });

export const deleteProperty = (accessToken, propertyId, propertyNo) =>
  request("/api/user/owner/delete/property", {
    mode: "cors",
    method: "DELETE",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, propertyNo }),
  });

// ==================== ROOMS API ====================

export const readAllRooms = (accessToken, propertyId) =>
  request("/api/user/owner/read/property/rooms", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId }),
  });

export const createRoom = (accessToken, propertyId, newRoom) =>
  request("/api/user/owner/create/property/room", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, newRoom }),
  });

export const editRoom = (accessToken, propertyId, roomId, editedRoom) =>
  request("/api/user/owner/edit/property/room", {
    mode: "cors",
    method: "PATCH",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, roomId, editedRoom }),
  });

export const deleteRoom = (accessToken, propertyId, roomId) =>
  request("/api/user/owner/delete/property/room", {
    mode: "cors",
    method: "DELETE",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, roomId }),
  });

// ==================== TENANTS API ====================

export const readAllTenantsForRoom = (accessToken, propertyId, roomId) =>
  request("/api/user/owner/read/property/room/tenants", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, roomId }),
  });

export const createTenant = (accessToken, propertyId, roomId, newTenant) =>
  request("/api/user/owner/create/property/room/tenant", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, roomId, newTenant }),
  });

export const editTenant = (accessToken, propertyId, roomId, tenantId, editedTenant) =>
  request("/api/user/owner/edit/property/room/tenant", {
    mode: "cors",
    method: "PATCH",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, roomId, tenantId, editedTenant }),
  });

export const deleteTenant = (accessToken, propertyId, roomId, tenantId) =>
  request("/api/user/owner/delete/property/room/tenant", {
    mode: "cors",
    method: "DELETE",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, roomId, tenantId }),
  });

// ==================== RENTS/PAYMENTS API ====================

export const readAllTenantPayments = (accessToken, propertyId, roomId, tenantId) =>
  request("/api/user/owner/read/property/room/tenant/payments", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, roomId, tenantId }),
  });

export const createPayment = (accessToken, propertyId, roomId, tenantId, newPayment) =>
  request("/api/user/owner/create/property/room/tenant/payment", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, roomId, tenantId, newPayment }),
  });

export const editPayment = (accessToken, propertyId, roomId, tenantId, paymentId, editedPayment) =>
  request("/api/user/owner/edit/property/room/tenant/payment", {
    mode: "cors",
    method: "PATCH",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, roomId, tenantId, paymentId, editedPayment }),
  });

export const deletePayment = (accessToken, propertyId, roomId, tenantId, paymentId) =>
  request("/api/user/owner/delete/property/room/tenant/payment", {
    mode: "cors",
    method: "DELETE",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId, roomId, tenantId, paymentId }),
  });

// ==================== REVENUE API ====================

export const readAllPaymentsForRevenue = (accessToken, propertyId) =>
  request("/api/user/owner/read/property/rooms/tenants/payments", {
    mode: "cors",
    method: "POST",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
    body: JSON.stringify({ propertyId }),
  });

// ==================== SUBSCRIPTIONS API ====================

export const readSubscriptions = (accessToken) =>
  request("/api/user/owner/read/subscriptions", {
    mode: "cors",
    method: "GET",
    headers: { "Content-Type": "application/json", user: true, token: accessToken },
  });