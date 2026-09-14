import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { api } from "../api";


const DEPARTMENTS = [
  "Post Production",
  "Production",
  "Transmission",
  "IT",
  "Newsroom Creatives",
  "Admin",
  "Social Media",
  "Security",
  "Programming",
];


export default function Users() {

  const {
    token,
    user,
  } = useAuth();


  /* ==================================================
     USERS
     ================================================== */

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  /* ==================================================
     TOAST
     ================================================== */

  const [toast, setToast] =
    useState(null);


  /* ==================================================
     ADD USER
     ================================================== */

  const [showAdd, setShowAdd] =
    useState(false);

  const [newUser, setNewUser] =
    useState({
      first_name: "",
      last_name: "",
      username: "",
      role: "staff",
      department: "",
    });


  /* ==================================================
     CREATED USER
     ================================================== */

  const [createdUser, setCreatedUser] =
    useState(null);


  /* ==================================================
     EDIT USER
     ================================================== */

  const [editUser, setEditUser] =
    useState(null);

  const [editForm, setEditForm] =
    useState({
      first_name: "",
      last_name: "",
      username: "",
      department: "",
    });

  const [savingEdit, setSavingEdit] =
    useState(false);

  const [editError, setEditError] =
    useState("");


  /* ==================================================
     RESET PASSWORD
     ================================================== */

  const [passwordUser, setPasswordUser] =
    useState(null);

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [resettingPassword, setResettingPassword] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [resetResult, setResetResult] =
    useState(null);


  /* ==================================================
     LOAD USERS
     ================================================== */

  const loadUsers = async () => {

    setLoading(true);

    try {

      const result =
        await api.listUsers(
          token
        );

      setUsers(
        result.users || []
      );

    } catch (err) {

      setToast({
        type: "error",
        text:
          err.message ||
          "Unable to load users.",
      });

    } finally {

      setLoading(false);

    }
  };


  /* ==================================================
     INITIAL LOAD
     ================================================== */

  useEffect(() => {

    if (
      user?.role ===
      "superuser"
    ) {
      loadUsers();
    }

  }, [
    token,
    user,
  ]);


  /* ==================================================
     TOAST TIMER
     ================================================== */

  useEffect(() => {

    if (!toast) return;

    const timer =
      setTimeout(
        () => setToast(null),
        3500
      );

    return () =>
      clearTimeout(timer);

  }, [toast]);


  /* ==================================================
     ADD USER
     ================================================== */

  const handleAddUser =
    async (e) => {

      e.preventDefault();

      if (
        !newUser.first_name.trim()
      ) {
        setToast({
          type: "error",
          text:
            "Please enter the user's first name.",
        });
        return;
      }

      if (
        !newUser.last_name.trim()
      ) {
        setToast({
          type: "error",
          text:
            "Please enter the user's last name.",
        });
        return;
      }

      if (
        !newUser.username.trim()
      ) {
        setToast({
          type: "error",
          text:
            "Please enter a username.",
        });
        return;
      }

      if (
        !newUser.department
      ) {
        setToast({
          type: "error",
          text:
            "Please select a department.",
        });
        return;
      }

      try {

        const result =
          await api.createUser(
            token,
            {
              ...newUser,
              first_name:
                newUser.first_name.trim(),
              last_name:
                newUser.last_name.trim(),
              username:
                newUser.username.trim(),
            }
          );

        setUsers(
          (prev) => [
            result.user,
            ...prev,
          ]
        );

        setCreatedUser({
          firstName:
            result.user.first_name,

          lastName:
            result.user.last_name,

          username:
            result.user.username,

          department:
            result.user.department,

          password:
            result.temporary_password,
        });

        setNewUser({
          first_name: "",
          last_name: "",
          username: "",
          role: "staff",
          department: "",
        });

        setShowAdd(false);

      } catch (err) {

        setToast({
          type: "error",
          text:
            err.message ||
            "Unable to create user.",
        });

      }
    };


  /* ==================================================
     OPEN EDIT
     ================================================== */

  const openEditUser =
    (item) => {

      setEditUser(item);

      setEditForm({
        first_name:
          item.first_name || "",

        last_name:
          item.last_name || "",

        username:
          item.username || "",

        department:
          item.department || "",
      });

      setEditError("");
    };


  /* ==================================================
     SAVE USER EDIT
     ================================================== */

  const handleEditUser =
    async (e) => {

      e.preventDefault();

      setEditError("");

      if (
        !editForm.first_name.trim()
      ) {
        setEditError(
          "First name is required."
        );
        return;
      }

      if (
        !editForm.last_name.trim()
      ) {
        setEditError(
          "Last name is required."
        );
        return;
      }

      if (
        !editForm.username.trim()
      ) {
        setEditError(
          "Username is required."
        );
        return;
      }

      if (
        !editForm.department
      ) {
        setEditError(
          "Please select a department."
        );
        return;
      }

      setSavingEdit(true);

      try {

        const result =
          await api.updateUser(
            token,
            editUser.id,
            {
              first_name:
                editForm.first_name.trim(),

              last_name:
                editForm.last_name.trim(),

              username:
                editForm.username.trim(),

              department:
                editForm.department,
            }
          );

        setUsers(
          (prev) =>
            prev.map(
              (item) =>
                item.id ===
                result.user.id
                  ? result.user
                  : item
            )
        );

        setEditUser(null);

        setToast({
          type: "ok",
          text:
            "User information updated.",
        });

      } catch (err) {

        setEditError(
          err.message ||
          "Unable to update user."
        );

      } finally {

        setSavingEdit(false);

      }
    };


  /* ==================================================
     ROLE CHANGE
     ================================================== */

  const handleRoleChange =
    async (
      id,
      role
    ) => {

      try {

        const result =
          await api.changeUserRole(
            token,
            id,
            role
          );

        setUsers(
          (prev) =>
            prev.map(
              (u) =>
                u.id === id
                  ? result.user
                  : u
            )
        );

        setToast({
          type: "ok",
          text:
            "User role updated.",
        });

      } catch (err) {

        setToast({
          type: "error",
          text:
            err.message ||
            "Unable to update role.",
        });

        loadUsers();
      }
    };


  /* ==================================================
     STATUS CHANGE
     ================================================== */

  const handleStatusChange =
    async (
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

        setUsers(
          (prev) =>
            prev.map(
              (u) =>
                u.id === id
                  ? result.user
                  : u
            )
        );

        setToast({
          type: "ok",
          text:
            active
              ? "User activated."
              : "User deactivated.",
        });

      } catch (err) {

        setToast({
          type: "error",
          text:
            err.message ||
            "Unable to change user status.",
        });

        loadUsers();
      }
    };


  /* ==================================================
     OPEN PASSWORD RESET
     ================================================== */

  const openPasswordReset =
    (item) => {

      setPasswordUser(item);

      setNewPassword("");

      setConfirmPassword("");

      setPasswordError("");

      setResetResult(null);
    };


  /* ==================================================
     RESET PASSWORD
     ================================================== */

  const handleResetPassword =
    async (e) => {

      e.preventDefault();

      setPasswordError("");

      if (
        newPassword.length < 6
      ) {
        setPasswordError(
          "Password must be at least 6 characters."
        );
        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setPasswordError(
          "Passwords do not match."
        );
        return;
      }

      setResettingPassword(true);

      try {

        await api.resetUserPassword(
          token,
          passwordUser.id,
          newPassword
        );

        setResetResult({
          username:
            passwordUser.username,

          password:
            newPassword,
        });

        setNewPassword("");

        setConfirmPassword("");

        setToast({
          type: "ok",
          text:
            "Password reset successfully.",
        });

      } catch (err) {

        setPasswordError(
          err.message ||
          "Unable to reset password."
        );

      } finally {

        setResettingPassword(false);

      }
    };


  /* ==================================================
     PERMISSION CHECK
     ================================================== */

  if (
    user?.role !==
    "superuser"
  ) {

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


  /* ==================================================
     RENDER
     ================================================== */

  return (

    <div className="page">

      <div className="container">

        {/* ==================================================
            HEADER
            ================================================== */}

        <div className="page-header">

          <div>

            <p className="eyebrow">
              Administration
            </p>

            <h1 className="page-title">
              User Management
            </h1>

            <p className="page-sub">
              Create users, edit account information,
              assign departments, manage roles,
              and control account access.
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


        {/* ==================================================
            USER TABLE
            ================================================== */}

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

                  <th>
                    First name
                  </th>

                  <th>
                    Last name
                  </th>

                  <th>
                    Username
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {users.map(
                  (item) => {

                    const isSelf =
                      item.id ===
                      user.id;

                    return (

                      <tr
                        key={item.id}
                      >

                        <td>
                          <strong>
                            {item.first_name}
                          </strong>
                        </td>


                        <td>
                          <strong>
                            {item.last_name}
                          </strong>
                        </td>


                        <td>
                          {item.username}
                        </td>


                        <td>
                          {item.department ||
                            "Not assigned"}
                        </td>


                        <td>

                          <select
                            value={
                              item.role
                            }
                            disabled={
                              isSelf
                            }
                            onChange={(
                              e
                            ) =>
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

                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap:
                                "wrap",
                            }}
                          >

                            {/* EDIT */}

                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() =>
                                openEditUser(
                                  item
                                )
                              }
                            >
                              Edit
                            </button>


                            {/* PASSWORD */}

                            {!isSelf && (

                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() =>
                                  openPasswordReset(
                                    item
                                  )
                                }
                              >
                                Reset password
                              </button>

                            )}


                            {/* ACTIVATE / DEACTIVATE */}

                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={
                                isSelf
                              }
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

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ==================================================
          ADD USER MODAL
          ================================================== */}

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

              <div>

                <p className="eyebrow">
                  Administration
                </p>

                <h3>
                  Add user
                </h3>

              </div>

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
              className="form-stack"
              onSubmit={
                handleAddUser
              }
            >

              <label>

                First name

                <input
                  type="text"
                  value={
                    newUser.first_name
                  }
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      first_name:
                        e.target.value,
                    })
                  }
                  placeholder="First name"
                />

              </label>


              <label>

                Last name

                <input
                  type="text"
                  value={
                    newUser.last_name
                  }
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      last_name:
                        e.target.value,
                    })
                  }
                  placeholder="Last name"
                />

              </label>


              <label>

                Username

                <input
                  type="text"
                  value={
                    newUser.username
                  }
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      username:
                        e.target.value,
                    })
                  }
                  placeholder="Username"
                />

              </label>


              <label>

                Department

                <select
                  value={
                    newUser.department
                  }
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      department:
                        e.target.value,
                    })
                  }
                >

                  <option value="">
                    Select department
                  </option>

                  {DEPARTMENTS.map(
                    (dept) => (

                      <option
                        key={dept}
                        value={dept}
                      >
                        {dept}
                      </option>

                    )
                  )}

                </select>

              </label>


              <label>

                Role

                <select
                  value={
                    newUser.role
                  }
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role:
                        e.target.value,
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


              <div className="modal-actions">

                <button
                  type="button"
                  className="btn"
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


      {/* ==================================================
          CREATED USER MODAL
          ================================================== */}

      {createdUser && (

        <div
          className="modal-backdrop"
          onClick={() =>
            setCreatedUser(null)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <p className="eyebrow">
                  User created
                </p>

                <h3>
                  Account created successfully
                </h3>

              </div>

              <button
                className="close-x"
                onClick={() =>
                  setCreatedUser(null)
                }
              >
                ×
              </button>

            </div>


            <div className="form-stack">

              <div>

                <strong>
                  First name
                </strong>

                <div>
                  {createdUser.firstName}
                </div>

              </div>


              <div>

                <strong>
                  Last name
                </strong>

                <div>
                  {createdUser.lastName}
                </div>

              </div>


              <div>

                <strong>
                  Username
                </strong>

                <div>
                  {createdUser.username}
                </div>

              </div>


              <div>

                <strong>
                  Department
                </strong>

                <div>
                  {createdUser.department}
                </div>

              </div>


              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background:
                    "var(--surface-2, rgba(127,127,127,.08))",
                }}
              >

                <div
                  className="eyebrow"
                  style={{
                    marginBottom: 5,
                  }}
                >
                  Temporary password
                </div>

                <strong
                  style={{
                    fontSize: 20,
                  }}
                >
                  {createdUser.password}
                </strong>

              </div>


              <p className="page-sub">

                The user must change this
                password when they first log in.

              </p>


              <div className="modal-actions">

                <button
                  className="btn btn-primary"
                  onClick={() =>
                    setCreatedUser(
                      null
                    )
                  }
                >
                  Done
                </button>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* ==================================================
          EDIT USER MODAL
          ================================================== */}

      {editUser && (

        <div
          className="modal-backdrop"
          onClick={() =>
            !savingEdit &&
            setEditUser(null)
          }
        >

          <div
  className="modal edit-equipment-modal"
  onClick={(e) =>
    e.stopPropagation()
  }
>

            <div className="modal-header">

              <div>

                <p className="eyebrow">
                  User Management
                </p>

                <h3>
                  Edit user
                </h3>

              </div>

              <button
                className="close-x"
                disabled={
                  savingEdit
                }
                onClick={() =>
                  setEditUser(
                    null
                  )
                }
              >
                ×
              </button>

            </div>


            <form
              className="form-stack"
              onSubmit={
                handleEditUser
              }
            >

              <label>

                First name

                <input
                  type="text"
                  value={
                    editForm.first_name
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      first_name:
                        e.target.value,
                    })
                  }
                  disabled={
                    savingEdit
                  }
                />

              </label>


              <label>

                Last name

                <input
                  type="text"
                  value={
                    editForm.last_name
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      last_name:
                        e.target.value,
                    })
                  }
                  disabled={
                    savingEdit
                  }
                />

              </label>


              <label>

                Username

                <input
                  type="text"
                  value={
                    editForm.username
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      username:
                        e.target.value,
                    })
                  }
                  disabled={
                    savingEdit
                  }
                />

              </label>


              <label>

                Department

                <select
                  value={
                    editForm.department
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      department:
                        e.target.value,
                    })
                  }
                  disabled={
                    savingEdit
                  }
                >

                  <option value="">
                    Select department
                  </option>

                  {DEPARTMENTS.map(
                    (dept) => (

                      <option
                        key={dept}
                        value={dept}
                      >
                        {dept}
                      </option>

                    )
                  )}

                </select>

              </label>


              {editError && (

                <div
                  className="form-error"
                >
                  {editError}
                </div>

              )}


              <div className="modal-actions">

                <button
                  type="button"
                  className="btn"
                  disabled={
                    savingEdit
                  }
                  onClick={() =>
                    setEditUser(
                      null
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    savingEdit
                  }
                >
                  {savingEdit
                    ? "Saving…"
                    : "Save changes"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ==================================================
          RESET PASSWORD MODAL
          ================================================== */}

      {passwordUser && (

        <div
          className="modal-backdrop"
          onClick={() =>
            !resettingPassword &&
            setPasswordUser(
              null
            )
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {!resetResult ? (

              <>

                <div className="modal-header">

                  <div>

                    <p className="eyebrow">
                      Account security
                    </p>

                    <h3>
                      Reset password
                    </h3>

                  </div>

                  <button
                    className="close-x"
                    disabled={
                      resettingPassword
                    }
                    onClick={() =>
                      setPasswordUser(
                        null
                      )
                    }
                  >
                    ×
                  </button>

                </div>


                <p className="page-sub">
                  Set a new password for{" "}
                  <strong>
                    {passwordUser.first_name}{" "}
                    {passwordUser.last_name}
                  </strong>
                  .
                </p>


                <form
                  className="form-stack"
                  onSubmit={
                    handleResetPassword
                  }
                >

                  <label>

                    New password

                    <input
                      type="password"
                      value={
                        newPassword
                      }
                      onChange={(e) =>
                        setNewPassword(
                          e.target.value
                        )
                      }
                      placeholder="At least 6 characters"
                      disabled={
                        resettingPassword
                      }
                    />

                  </label>


                  <label>

                    Confirm password

                    <input
                      type="password"
                      value={
                        confirmPassword
                      }
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter password again"
                      disabled={
                        resettingPassword
                      }
                    />

                  </label>


                  {passwordError && (

                    <div
                      className="form-error"
                    >
                      {passwordError}
                    </div>

                  )}


                  <p className="page-sub">

                    The user will be required to
                    change this password when they
                    next log in.

                  </p>


                  <div className="modal-actions">

                    <button
                      type="button"
                      className="btn"
                      disabled={
                        resettingPassword
                      }
                      onClick={() =>
                        setPasswordUser(
                          null
                        )
                      }
                    >
                      Cancel
                    </button>


                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={
                        resettingPassword
                      }
                    >
                      {resettingPassword
                        ? "Resetting…"
                        : "Reset password"}
                    </button>

                  </div>

                </form>

              </>

            ) : (

              <>

                <div className="modal-header">

                  <div>

                    <p className="eyebrow">
                      Password reset
                    </p>

                    <h3>
                      Password changed
                    </h3>

                  </div>

                  <button
                    className="close-x"
                    onClick={() =>
                      setPasswordUser(
                        null
                      )
                    }
                  >
                    ×
                  </button>

                </div>


                <p className="page-sub">
                  The password for{" "}
                  <strong>
                    {resetResult.username}
                  </strong>{" "}
                  has been changed.
                </p>


                <div
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background:
                      "var(--surface-2, rgba(127,127,127,.08))",
                  }}
                >

                  <div
                    className="eyebrow"
                    style={{
                      marginBottom: 5,
                    }}
                  >
                    New password
                  </div>

                  <strong
                    style={{
                      fontSize: 22,
                    }}
                  >
                    {resetResult.password}
                  </strong>

                </div>


                <p className="page-sub">

                  Give this password to the user.
                  They will be required to change
                  it after logging in.

                </p>


                <div className="modal-actions">

                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      setPasswordUser(
                        null
                      )
                    }
                  >
                    Done
                  </button>

                </div>

              </>

            )}

          </div>

        </div>

      )}


      {/* ==================================================
          TOAST
          ================================================== */}

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