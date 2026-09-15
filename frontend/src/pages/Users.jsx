import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { api } from "../api";


/* ==================================================
   USER DEPARTMENTS
   ================================================== */

const DEPARTMENTS = [
  "Newsroom",
  "Post Production",
  "Production",
  "Transmission",
  "Marketing",
  "Social Media",
  "IT",
  "Musanza",
  "Security",
  "Administration",
  "Programming",
  "Finance",
];


/* ==================================================
   USER ROLES
   ================================================== */

const ROLES = [
  {
    value: "all",
    label: "All roles",
  },
  {
    value: "staff",
    label: "Staff",
  },
  {
    value: "manager",
    label: "Manager",
  },
  {
    value: "superuser",
    label: "Super User",
  },
];


/* ==================================================
   USER STATUS
   ================================================== */

const STATUSES = [
  {
    value: "all",
    label: "All statuses",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
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
     SEARCH AND FILTERS
     ================================================== */

  const [search, setSearch] =
    useState("");

  const [department, setDepartment] =
    useState("all");

  const [status, setStatus] =
    useState("all");

  const [role, setRole] =
    useState("all");


  /* ==================================================
     FILTER USERS
     ================================================== */

  const filteredUsers =
    useMemo(() => {

      const term =
        search
          .trim()
          .toLowerCase();

      return users.filter(
        (item) => {

          /* ------------------------------------------
             SEARCH
             ------------------------------------------ */

          const searchMatches =
            !term ||
            [
              item.first_name,
              item.last_name,
              `${item.first_name || ""} ${item.last_name || ""}`,
              item.username,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(term);


          /* ------------------------------------------
             DEPARTMENT
             ------------------------------------------ */

          const departmentMatches =
            department === "all" ||
            item.department === department;


          /* ------------------------------------------
             STATUS
             ------------------------------------------ */

          const statusMatches =
            status === "all" ||
            (
              status === "active" &&
              Boolean(item.active)
            ) ||
            (
              status === "inactive" &&
              !Boolean(item.active)
            );


          /* ------------------------------------------
             ROLE
             ------------------------------------------ */

          const roleMatches =
            role === "all" ||
            item.role === role;


          return (
            searchMatches &&
            departmentMatches &&
            statusMatches &&
            roleMatches
          );
        }
      );

    }, [
      users,
      search,
      department,
      status,
      role,
    ]);


  /* ==================================================
     ACTIVE FILTER CHECK
     ================================================== */

  const filtersActive =
    search.trim() !== "" ||
    department !== "all" ||
    status !== "all" ||
    role !== "all";


  /* ==================================================
     CLEAR FILTERS
     ================================================== */

  const clearFilters = () => {

    setSearch("");
    setDepartment("all");
    setStatus("all");
    setRole("all");

  };


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

     Resetting always sets the account back to the
     fixed default temporary password.
     ================================================== */

  const [passwordUser, setPasswordUser] =
    useState(null);

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
      newRole
    ) => {

      try {

        const result =
          await api.changeUserRole(
            token,
            id,
            newRole
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

      setPasswordError("");

      setResetResult(null);
    };


  /* ==================================================
     RESET PASSWORD
     ================================================== */

  const handleResetPassword =
    async () => {

      setPasswordError("");

      setResettingPassword(true);


      try {

        const result =
          await api.resetUserPassword(
            token,
            passwordUser.id
          );


        setResetResult({
          username:
            passwordUser.username,

          password:
            result.temporary_password,
        });


        setToast({
          type: "ok",
          text:
            "Password reset to the default password.",
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

            You do not have permission
            to manage users.

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
            SEARCH
            ================================================== */}

        <div className="user-filter-panel">

          <div className="user-filter-header">

            <div>

              <p className="eyebrow">
                Search & Filters
              </p>

              <p className="user-filter-description">
                Find users by name, department,
                role, or account status.
              </p>

            </div>

            {filtersActive && (

              <button
                className="btn btn-ghost btn-sm"
                onClick={clearFilters}
              >
                Clear filters
              </button>

            )}

          </div>


          {/* SEARCH */}

          <div
            className="form-field"
            style={{
              marginBottom: 18,
            }}
          >

            <label htmlFor="user-search">
              Search users
            </label>

            <input
              id="user-search"
              type="text"
              placeholder="Search first name, last name, or username…"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>


          {/* FILTERS */}

          <div className="user-filter-grid">


            {/* DEPARTMENT */}

            <div className="form-field">

              <label htmlFor="user-department">
                Department
              </label>

              <select
                id="user-department"
                value={department}
                onChange={(e) =>
                  setDepartment(
                    e.target.value
                  )
                }
              >

                <option value="all">
                  All departments
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

            </div>


            {/* ROLE */}

            <div className="form-field">

              <label htmlFor="user-role">
                Role
              </label>

              <select
                id="user-role"
                value={role}
                onChange={(e) =>
                  setRole(
                    e.target.value
                  )
                }
              >

                {ROLES.map(
                  (roleOption) => (

                    <option
                      key={
                        roleOption.value
                      }
                      value={
                        roleOption.value
                      }
                    >
                      {
                        roleOption.label
                      }
                    </option>

                  )
                )}

              </select>

            </div>


            {/* STATUS */}

            <div className="form-field">

              <label htmlFor="user-status">
                Status
              </label>

              <select
                id="user-status"
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value
                  )
                }
              >

                {STATUSES.map(
                  (statusOption) => (

                    <option
                      key={
                        statusOption.value
                      }
                      value={
                        statusOption.value
                      }
                    >
                      {
                        statusOption.label
                      }
                    </option>

                  )
                )}

              </select>

            </div>

          </div>

        </div>


        {/* ==================================================
            RESULT SUMMARY
            ================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >

          <p
            className="page-sub"
            style={{
              margin: 0,
            }}
          >
            Showing{" "}
            <strong>
              {filteredUsers.length}
            </strong>{" "}
            of{" "}
            <strong>
              {users.length}
            </strong>{" "}
            users
          </p>


          {filtersActive && (

            <button
              className="btn btn-ghost btn-sm"
              onClick={
                clearFilters
              }
            >
              Clear filters
            </button>

          )}

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

        ) : filteredUsers.length === 0 ? (

          <div className="empty-state">

            <div
              style={{
                fontSize: 32,
                marginBottom: 10,
              }}
            >
              🔍
            </div>

            <strong>
              No users found
            </strong>

            <p
              className="page-sub"
              style={{
                marginTop: 8,
              }}
            >
              No users match your
              current search and filters.
            </p>


            {filtersActive && (

              <button
                className="btn btn-primary btn-sm"
                style={{
                  marginTop: 10,
                }}
                onClick={
                  clearFilters
                }
              >
                Clear filters
              </button>

            )}

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

                {filteredUsers.map(
                  (item) => {

                    const isSelf =
                      item.id ===
                      user.id;


                    return (

                      <tr
                        key={
                          item.id
                        }
                      >

                        <td>
                          <strong>
                            {
                              item.first_name
                            }
                          </strong>
                        </td>


                        <td>
                          <strong>
                            {
                              item.last_name
                            }
                          </strong>
                        </td>


                        <td>
                          {
                            item.username
                          }
                        </td>


                        <td>
                          {
                            item.department ||
                            "Not assigned"
                          }
                        </td>


                        <td>

                          <select
                            value={
                              item.role
                            }
                            disabled={
                              isSelf
                            }
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

                            {
                              item.active
                                ? "Active"
                                : "Inactive"
                            }

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

                              {
                                item.active
                                  ? "Deactivate"
                                  : "Activate"
                              }

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

                <p
                  style={{
                    marginTop: 4,
                    color: "var(--muted)",
                    fontSize: 12.5,
                  }}
                >
                  New accounts start with the
                  default temporary password and
                  must change it at first login.
                </p>

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
              onSubmit={
                handleAddUser
              }
            >

              <div className="form-grid">

                <div className="form-field">

                  <label>
                    First name
                  </label>

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
                    autoFocus
                  />

                </div>


                <div className="form-field">

                  <label>
                    Last name
                  </label>

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

                </div>

              </div>


              <div className="form-field">

                <label>
                  Username
                </label>

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

              </div>


              <div className="form-grid">

                <div className="form-field">

                  <label>
                    Department
                  </label>

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

                </div>


                <div className="form-field">

                  <label>
                    Role
                  </label>

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

                </div>

              </div>


              <div className="modal-footer">

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


            <div className="eq-details">

              <div className="eq-detail">

                <span className="eq-detail-label">
                  First name
                </span>

                <span className="eq-detail-value">
                  {
                    createdUser.firstName
                  }
                </span>

              </div>


              <div className="eq-detail">

                <span className="eq-detail-label">
                  Last name
                </span>

                <span className="eq-detail-value">
                  {
                    createdUser.lastName
                  }
                </span>

              </div>


              <div className="eq-detail">

                <span className="eq-detail-label">
                  Username
                </span>

                <span className="eq-detail-value">
                  {
                    createdUser.username
                  }
                </span>

              </div>


              <div className="eq-detail">

                <span className="eq-detail-label">
                  Department
                </span>

                <span className="eq-detail-value">
                  {
                    createdUser.department
                  }
                </span>

              </div>

            </div>


            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius:
                  "var(--radius-lg)",
                background:
                  "var(--surface-soft)",
                border:
                  "1px solid var(--border)",
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
                  fontFamily:
                    "var(--font-mono)",
                }}
              >
                {
                  createdUser.password
                }
              </strong>

            </div>


            <p
              className="page-sub"
              style={{
                marginTop: 14,
              }}
            >
              The user must change this
              password when they first log in.
            </p>


            <div className="modal-footer">

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
            className="modal"
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
              onSubmit={
                handleEditUser
              }
            >

              <div className="form-grid">

                <div className="form-field">

                  <label>
                    First name
                  </label>

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

                </div>


                <div className="form-field">

                  <label>
                    Last name
                  </label>

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

                </div>

              </div>


              <div className="form-field">

                <label>
                  Username
                </label>

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

              </div>


              <div className="form-field">

                <label>
                  Department
                </label>

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

              </div>


              {editError && (

                <div
                  className="form-error"
                >
                  {editError}
                </div>

              )}


              <div className="modal-footer">

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
                  {
                    savingEdit
                      ? "Saving…"
                      : "Save changes"
                  }
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

                  This will reset{" "}

                  <strong>
                    {
                      passwordUser.first_name
                    }{" "}
                    {
                      passwordUser.last_name
                    }
                  </strong>

                  's password back to the
                  default temporary password.
                  They'll be required to change
                  it the next time they log in.

                </p>


                {passwordError && (

                  <div
                    className="form-error"
                  >
                    {
                      passwordError
                    }
                  </div>

                )}


                <div className="modal-footer">

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
                    type="button"
                    className="btn btn-primary"
                    disabled={
                      resettingPassword
                    }
                    onClick={
                      handleResetPassword
                    }
                  >
                    {
                      resettingPassword
                        ? "Resetting…"
                        : "Reset to default password"
                    }
                  </button>

                </div>

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
                    {
                      resetResult.username
                    }
                  </strong>{" "}

                  has been reset.

                </p>


                <div
                  style={{
                    padding: 16,
                    borderRadius:
                      "var(--radius-lg)",
                    background:
                      "var(--surface-soft)",
                    border:
                      "1px solid var(--border)",
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
                      fontFamily:
                        "var(--font-mono)",
                    }}
                  >
                    {
                      resetResult.password
                    }
                  </strong>

                </div>


                <p
                  className="page-sub"
                  style={{
                    marginTop: 14,
                  }}
                >
                  Give this password to the user.
                  They will be required to change
                  it after logging in.
                </p>


                <div className="modal-footer">

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