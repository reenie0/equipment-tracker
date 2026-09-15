import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/Themecontext";

export default function Navbar() {
  const {
    user,
    logout,
    isManager,
    isSuperUser
  } = useAuth();

  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="container navbar-inner">

        {/* BRAND */}
        <div className="brand">
          <img
            src="/logo.png"
            alt="Company logo"
            className="brand-logo"
          />

          Equipment Tracker
        </div>


        {/* NAVIGATION */}
        <nav className="nav-links">

          {/* EQUIPMENT */}
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


          {/* REQUESTS */}
          <NavLink
            to="/requests"
            className={({ isActive }) =>
              "nav-link" +
              (isActive ? " active" : "")
            }
          >
            Requests
          </NavLink>


          {/* HISTORY - ALL LOGGED-IN USERS */}
          <NavLink
            to="/history"
            className={({ isActive }) =>
              "nav-link" +
              (isActive ? " active" : "")
            }
          >
            History
          </NavLink>


          {/* MANAGER ONLY - REPORTS */}
          {isManager && (
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                "nav-link" +
                (isActive ? " active" : "")
              }
            >
              Reports
            </NavLink>
          )}


          {/* MANAGER ONLY - CATEGORY MANAGEMENT */}
          {isManager && (
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                "nav-link" +
                (isActive ? " active" : "")
              }
            >
              Categories
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

          {/* THEME TOGGLE */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
            title={
              theme === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>


          {/* USER NAME */}
          <span>
            {user?.name}
          </span>


          {/* ROLE */}
          <span className="role-chip">
            {user?.role}
          </span>


          {/* SIGN OUT */}
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