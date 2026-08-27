import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const {
    user,
    logout,
    isManager,
    isSuperUser
  } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">

        {/* BRAND */}
        <div className="brand">
          <span className="brand-mark">EQ</span>
          Equipment Tracker
        </div>

        {/* NAVIGATION */}
        <nav className="nav-links">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              "nav-link" +
              (isActive ? " active" : "")
            }
          >
            Equipment
          </NavLink>

          <NavLink
            to="/requests"
            className={({ isActive }) =>
              "nav-link" +
              (isActive ? " active" : "")
            }
          >
            Requests
          </NavLink>

          {/* MANAGER + SUPER USER */}
          {isManager && (
            <NavLink
              to="/manager"
              className={({ isActive }) =>
                "nav-link" +
                (isActive ? " active" : "")
              }
            >
              Manager Review
            </NavLink>
          )}

          {/* SUPER USER ONLY */}
          {isSuperUser && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                "nav-link" +
                (isActive ? " active" : "")
              }
            >
              User Management
            </NavLink>
          )}

        </nav>

        {/* USER */}
        <div className="nav-user">

          <span>
            {user?.name}
          </span>

          <span className="role-chip">
            {user?.role}
          </span>

          <button
            className="btn btn-ghost btn-sm"
            onClick={logout}
          >
            Sign out
          </button>

        </div>

      </div>
    </header>
  );
}