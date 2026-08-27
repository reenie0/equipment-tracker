const BASE = "/api";

async function request(
  path,
  { method = "GET", body, token } = {}
) {
  const res = await fetch(`${BASE}${path}`, {
    method,

    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },

    body: body
      ? JSON.stringify(body)
      : undefined,
  });

  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");

  const data = isJson
    ? await res.json()
    : null;

  if (!res.ok) {
    throw new Error(
      data?.error ||
        "Something went wrong. Please try again."
    );
  }

  return data;
}

export const api = {

  // ==================================================
  // AUTH
  // ==================================================

  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: {
        username,
        password,
      },
    }),

  register: (
    name,
    username,
    password
  ) =>
    request("/auth/register", {
      method: "POST",
      body: {
        name,
        username,
        password,
      },
    }),

  changePassword: (
    token,
    currentPassword,
    newPassword
  ) =>
    request("/auth/change-password", {
      method: "POST",

      body: {
        current_password:
          currentPassword,

        new_password:
          newPassword,
      },

      token,
    }),

  me: (token) =>
    request("/auth/me", {
      token,
    }),


  // ==================================================
  // USER MANAGEMENT
  // ==================================================

  listUsers: (token) =>
    request("/users", {
      method: "GET",
      token,
    }),

  createUser: (
    token,
    payload
  ) =>
    request("/users", {
      method: "POST",
      body: payload,
      token,
    }),

  changeUserRole: (
    token,
    id,
    role
  ) =>
    request(`/users/${id}/role`, {
      method: "PATCH",

      body: {
        role,
      },

      token,
    }),

  changeUserStatus: (
    token,
    id,
    active
  ) =>
    request(`/users/${id}/status`, {
      method: "PATCH",

      body: {
        active,
      },

      token,
    }),

  resetUserPassword: (
    token,
    id,
    password
  ) =>
    request(`/users/${id}/password`, {
      method: "PATCH",

      body: {
        password,
      },

      token,
    }),


  // ==================================================
  // EQUIPMENT
  // ==================================================

  listEquipment: (token) =>
    request("/equipment", {
      token,
    }),

  addEquipment: (
    token,
    payload
  ) =>
    request("/equipment", {
      method: "POST",
      body: payload,
      token,
    }),

  setEquipmentStatus: (
    token,
    id,
    status
  ) =>
    request(`/equipment/${id}/status`, {
      method: "PATCH",

      body: {
        status,
      },

      token,
    }),

  deleteEquipment: (
    token,
    id
  ) =>
    request(`/equipment/${id}`, {
      method: "DELETE",
      token,
    }),


  // ==================================================
  // BOOKINGS
  // ==================================================

  listBookings: (token) =>
    request("/bookings", {
      token,
    }),

  createBooking: (
    token,
    payload
  ) =>
    request("/bookings", {
      method: "POST",
      body: payload,
      token,
    }),

  approveBooking: (
    token,
    id
  ) =>
    request(`/bookings/${id}/approve`, {
      method: "POST",
      token,
    }),

  rejectBooking: (
    token,
    id,
    manager_note
  ) =>
    request(`/bookings/${id}/reject`, {
      method: "POST",

      body: {
        manager_note,
      },

      token,
    }),

  returnBooking: (
    token,
    id
  ) =>
    request(`/bookings/${id}/return`, {
      method: "POST",
      token,
    }),
};