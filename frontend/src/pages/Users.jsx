import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function Users() {
  const { token, user } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showAdd, setShowAdd] = useState(false);

  const [newUser, setNewUser] = useState({
  name: "",
  username: "",
  role: "staff"
});

const [createdUser, setCreatedUser] = useState(null);

  /*
  ==================================================
  LOAD USERS
  ==================================================
  */

  const loadUsers = async () => {
    setLoading(true);

    try {
      const result = await api.listUsers(token);
      setUsers(result.users);
    } catch (err) {
      setToast({
        type: "error",
        text: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "superuser") {
      loadUsers();
    }
  }, [token, user]);

  /*
  ==================================================
  TOAST
  ==================================================
  */

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  /*
  ==================================================
  ADD USER
  ==================================================
  */

  const handleAddUser = async (e) => {
  e.preventDefault();

  try {
    const result = await api.createUser(
      token,
      newUser
    );

    setUsers((prev) => [
      result.user,
      ...prev
    ]);

    setCreatedUser({
      name: result.user.name,
      username: result.user.username,
      password: result.temporary_password
    });

    setNewUser({
      name: "",
      username: "",
      role: "staff"
    });

    setShowAdd(false);

  } catch (err) {
    setToast({
      type: "error",
      text: err.message
    });
  }
};

  /*
  ==================================================
  CHANGE ROLE
  ==================================================
  */

  const handleRoleChange = async (id, role) => {
    try {
      const result = await api.changeUserRole(
        token,
        id,
        role
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? result.user
            : u
        )
      );

      setToast({
        type: "ok",
        text: "User role updated."
      });

    } catch (err) {
      setToast({
        type: "error",
        text: err.message
      });

      loadUsers();
    }
  };

  /*
  ==================================================
  ACTIVATE / DEACTIVATE
  ==================================================
  */

  const handleStatusChange = async (
    id,
    active
  ) => {
    try {
      const result =
        await api.changeUserStatus(
          token,
          id,
          active
        );

      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? result.user
            : u
        )
      );

      setToast({
        type: "ok",
        text: active
          ? "User activated."
          : "User deactivated."
      });

    } catch (err) {
      setToast({
        type: "error",
        text: err.message
      });

      loadUsers();
    }
  };

  /*
  ==================================================
  PROTECT PAGE
  ==================================================
  */

  if (user?.role !== "superuser") {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            You do not have permission to manage users.
          </div>
        </div>
      </div>
    );
  }

  /*
  ==================================================
  PAGE
  ==================================================
  */

  return (
    <div className="page">
      <div className="container">

        <div className="page-header">
          <div>
            <p className="eyebrow">
              Administration
            </p>

            <h1 className="page-title">
              User Management
            </h1>

            <p className="page-sub">
              Create users, manage roles, and
              control account access.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() =>
              setShowAdd(true)
            }
          >
            + Add user
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading users…
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            No users found.
          </div>
        ) : (
          <div className="table-wrap">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {users.map((item) => {

                  const isSelf =
                    item.id === user.id;

                  return (
                    <tr key={item.id}>

                      <td>
                        <strong>
                          {item.name}
                        </strong>
                      </td>

                      <td>
                        {item.username}
                      </td>

                      <td>

                        <select
                          value={item.role}
                          disabled={isSelf}
                          onChange={(e) =>
                            handleRoleChange(
                              item.id,
                              e.target.value
                            )
                          }
                        >

                          <option value="staff">
                            Staff
                          </option>

                          <option value="manager">
                            Manager
                          </option>

                          <option value="superuser">
                            Super User
                          </option>

                        </select>

                      </td>

                      <td>

                        <span
                          className={
                            item.active
                              ? "status status-available"
                              : "status status-repair"
                          }
                        >
                          {item.active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>

                      <td>

                        <button
                          className="btn btn-secondary"
                          disabled={isSelf}
                          onClick={() =>
                            handleStatusChange(
                              item.id,
                              !Boolean(
                                item.active
                              )
                            )
                          }
                        >
                          {item.active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                      </td>

                    </tr>
                  );

                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {showAdd && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setShowAdd(false)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h3>
                Add User
              </h3>

              <button
                className="close-x"
                onClick={() =>
                  setShowAdd(false)
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleAddUser}
            >

              <label className="field">
                <span>
                  Full name
                </span>

                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      name: e.target.value
                    })
                  }
                  required
                />
              </label>

              <label className="field">
                <span>
                  Username
                </span>

                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      username:
                        e.target.value
                    })
                  }
                  required
                />
              </label>

              

              <label className="field">
                <span>
                  Role
                </span>

                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value
                    })
                  }
                >

                  <option value="staff">
                    Staff
                  </option>

                  <option value="manager">
                    Manager
                  </option>

                  <option value="superuser">
                    Super User
                  </option>

                </select>
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: 10,
                  marginTop: 20
                }}
              >

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setShowAdd(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Create user
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {createdUser && (
  <div
    className="modal-backdrop"
    onClick={() => setCreatedUser(null)}
  >
    <div
      className="modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="modal-header">
        <h3>
          User Created Successfully
        </h3>

        <button
          className="close-x"
          onClick={() => setCreatedUser(null)}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>

        <p>
          The account has been created successfully.
        </p>

        <p>
          Give the following login details to the user:
        </p>

        <div style={{ marginTop: 20 }}>

          <p>
            <strong>Name:</strong>{" "}
            {createdUser.name}
          </p>

          <p>
            <strong>Username:</strong>{" "}
            {createdUser.username}
          </p>

          <p>
            <strong>Initial Password:</strong>
          </p>

          <div
            style={{
              padding: "12px 16px",
              background: "#f3f4f6",
              borderRadius: 8,
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: "bold",
              letterSpacing: 1
            }}
          >
            {createdUser.password}
          </div>

          <p
            style={{
              marginTop: 15,
              fontSize: 14
            }}
          >
            The user will be required to change this
            password when they first log in.
          </p>

        </div>

      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end"
        }}
      >
        <button
          className="btn btn-primary"
          onClick={() => setCreatedUser(null)}
        >
          Done
        </button>
      </div>

    </div>
  </div>
)}

      {toast && (
        <div
          className={
            `toast${
              toast.type === "error"
                ? " error"
                : ""
            }`
          }
        >
          {toast.text}
        </div>
      )}

    </div>
  );
}