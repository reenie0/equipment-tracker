
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import ManagerReview from "./pages/ManagerReview";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Categories from "./pages/Categories";


/*
====================================================
PROTECTED ROUTE
====================================================

Any logged-in user can access protected pages.

Users who still need to change their password
are sent back to login.
====================================================
*/

function Protected({ children }) {
  const {
    token,
    mustChangePassword
  } = useAuth();

  // Not logged in
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // User must change password
  if (mustChangePassword) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}


/*
====================================================
MANAGER ROUTE
====================================================

Managers AND Super Users can access these pages.
====================================================
*/

function ManagerOnly({ children }) {
  const {
    isManager,
    mustChangePassword
  } = useAuth();

  // User must change password
  if (mustChangePassword) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return isManager ? (
    children
  ) : (
    <Navigate
      to="/"
      replace
    />
  );
}


/*
====================================================
SUPER USER ROUTE
====================================================

Only Super Users can access User Management.
====================================================
*/

function SuperUserOnly({ children }) {
  const {
    user,
    mustChangePassword
  } = useAuth();

  // User must change password
  if (mustChangePassword) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return user?.role === "superuser" ? (
    children
  ) : (
    <Navigate
      to="/"
      replace
    />
  );
}


/*
====================================================
APP
====================================================
*/

export default function App() {

  const {
    token,
    mustChangePassword,
    isManager
  } = useAuth();


  const isLoggedIn =
    Boolean(
      token &&
      !mustChangePassword
    );


  return (
    <div className="app-shell">


      {/* ====================================================
          NAVIGATION
          ====================================================

          Navigation is only shown after login.
      ==================================================== */}

      {isLoggedIn && <Navbar />}


      <Routes>


        {/* ====================================================
            LOGIN
            ==================================================== */}

        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate
                to="/"
                replace
              />
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
            ====================================================

            Normal users:
            Requests page

            Managers:
            Manager Review page
        ==================================================== */}

        <Route
          path="/requests"
          element={
            <Protected>
              {isManager ? (
                <ManagerReview />
              ) : (
                <Requests />
              )}
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
              <ManagerOnly>
                <Reports />
              </ManagerOnly>
            </Protected>
          }
        />


        {/* ====================================================
            CATEGORY MANAGEMENT
            ====================================================

            Managers AND Super Users can manage
            equipment categories.
        ==================================================== */}

        <Route
          path="/categories"
          element={
            <Protected>
              <ManagerOnly>
                <Categories />
              </ManagerOnly>
            </Protected>
          }
        />


        {/* ====================================================
            HISTORY
            ====================================================

            ALL logged-in users can access History.

            The backend controls what they see:

            Normal user:
            - Own bookings
            - Own allocations
            - Own returns

            Manager / Super User:
            - All users' history
        ==================================================== */}

        <Route
          path="/history"
          element={
            <Protected>
              <History />
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
              to={
                isLoggedIn
                  ? "/"
                  : "/login"
              }
              replace
            />
          }
        />

      </Routes>

    </div>
  );
}
