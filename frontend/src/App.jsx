import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import ManagerReview from "./pages/ManagerReview";
import Users from "./pages/Users";

/*
====================================================
PROTECTED ROUTE
====================================================
*/

function Protected({ children }) {
  const { token, mustChangePassword } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

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

  return isManager ? children : <Navigate to="/" replace />;
}

/*
====================================================
SUPER USER ROUTE
====================================================

Only Super Users can access User Management.
*/

function SuperUserOnly({ children }) {
  const {
    user,
    mustChangePassword
  } = useAuth();

  if (mustChangePassword) {
    return <Navigate to="/login" replace />;
  }

  return user?.role === "superuser"
    ? children
    : <Navigate to="/" replace />;
}



/*
====================================================
APP
====================================================
*/

export default function App() {
  const {
    token,
    mustChangePassword
  } = useAuth();

  const showNavbar =
    token && !mustChangePassword;

  return (
    <div className="app-shell">

      {showNavbar && <Navbar />}

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            token && !mustChangePassword
              ? <Navigate to="/" replace />
              : <Login />
          }
        />

        {/* EQUIPMENT */}
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />

        {/* REQUESTS */}
        <Route
          path="/requests"
          element={
            <Protected>
              <Requests />
            </Protected>
          }
        />

        {/* MANAGER REVIEW */}
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

        {/* USER MANAGEMENT */}
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

        {/* UNKNOWN ROUTES */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </div>
  );
}