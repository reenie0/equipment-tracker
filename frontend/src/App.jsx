
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import ManagerReview from "./pages/ManagerReview";
import Users from "./pages/Users";
import Reports from "./pages/Reports";

/*
====================================================
PROTECTED ROUTE
====================================================
*/

function Protected({ children }) {
  const { token, mustChangePassword } = useAuth();

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // User must change password
  if (mustChangePassword) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/*
====================================================
MANAGER ROUTE
====================================================

Managers AND Super Users can access this page.
*/

function ManagerOnly({ children }) {
  const { isManager, mustChangePassword } = useAuth();

  if (mustChangePassword) {
    return <Navigate to="/login" replace />;
  }

  return isManager ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
}

/*
====================================================
SUPER USER ROUTE
====================================================

Only Super Users can access User Management.
*/

function SuperUserOnly({ children }) {
  const { user, mustChangePassword } = useAuth();

  if (mustChangePassword) {
    return <Navigate to="/login" replace />;
  }

  return user?.role === "superuser" ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
}

/*
====================================================
APP
====================================================
*/

export default function App() {
  const { token, mustChangePassword } = useAuth();

  const isLoggedIn = Boolean(token && !mustChangePassword);

  return (
    <div className="app-shell">

      {/* Show navigation only after login */}
      {isLoggedIn && <Navbar />}

      <Routes>

        {/* ====================================================
            LOGIN
            ==================================================== */}

        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />

        {/* ====================================================
            DASHBOARD / EQUIPMENT
            ==================================================== */}

        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />

        {/* ====================================================
            REQUESTS
            ==================================================== */}

        <Route
          path="/requests"
          element={
            <Protected>
              <Requests />
            </Protected>
          }
        />

        {/* ====================================================
            MANAGER REVIEW
            ==================================================== */}

        <Route
          path="/manager"
          element={
            <Protected>
              <ManagerOnly>
                <ManagerReview />
              </ManagerOnly>
            </Protected>
          }
        />

        {/* ====================================================
            USER MANAGEMENT
            ==================================================== */}

        <Route
          path="/users"
          element={
            <Protected>
              <SuperUserOnly>
                <Users />
              </SuperUserOnly>
            </Protected>
          }
        />

        {/* ====================================================
            REPORTS
            ==================================================== */}

        <Route
          path="/reports"
          element={
            <Protected>
              <Reports />
            </Protected>
          }
        />

        {/* ====================================================
            UNKNOWN ROUTES
            ==================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to={isLoggedIn ? "/" : "/login"}
              replace
            />
          }
        />

      </Routes>
    </div>
  );
}
