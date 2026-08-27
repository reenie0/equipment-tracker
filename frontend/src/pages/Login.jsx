import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register, changePassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /*
  ==================================================
  LOGIN
  ==================================================
  */

  const submitLogin = async () => {
    const result = await login(
      username.trim(),
      password
    );

    /*
    If the account was created by a Super User,
    the backend will return must_change_password = true.
    */

    if (result?.must_change_password) {
      setMode("change-password");
      setMessage(
        "This is your temporary password. You must create a new password before continuing."
      );
      return;
    }

    /*
    Normal login
    */

    navigate("/");
  };

  /*
  ==================================================
  REGISTER
  ==================================================
  */

  const submitRegister = async () => {
    await register(
      name.trim(),
      username.trim(),
      password
    );

    navigate("/");
  };

  /*
  ==================================================
  CHANGE PASSWORD
  ==================================================
  */

  const submitChangePassword = async () => {
    setError("");
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "Your new password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    if (newPassword === password) {
      setError(
        "Your new password must be different from your temporary password."
      );
      return;
    }

    /*
    The password entered during login is the current
    temporary password (diamond01).
    */

    await changePassword(
      password,
      newPassword
    );

    /*
    Password has now been changed successfully.
    */

    navigate("/");
  };

  /*
  ==================================================
  MAIN SUBMIT
  ==================================================
  */

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        await submitLogin();
      }

      if (mode === "register") {
        await submitRegister();
      }

      if (mode === "change-password") {
        await submitChangePassword();
      }
    } catch (err) {
      setError(
        err.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
  ==================================================
  CHANGE PASSWORD SCREEN
  ==================================================
  */

  if (mode === "change-password") {
    return (
      <div className="auth-wrap">
        <div className="auth-card">

          <p className="eyebrow">
            Equipment Tracker
          </p>

          <h2
            className="page-title"
            style={{
              fontSize: 22,
              marginBottom: 10
            }}
          >
            Change your password
          </h2>

          <p
            style={{
              marginBottom: 20,
              color: "var(--muted)"
            }}
          >
            Your account was created with a temporary
            password. Please create a new password
            before continuing.
          </p>

          <form onSubmit={submit}>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            {message && (
              <div className="form-success">
                {message}
              </div>
            )}

            <div className="form-field">
              <label>Username</label>

              <input
                value={username}
                disabled
              />
            </div>

            <div className="form-field">
              <label>New password</label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter your new password"
                minLength={6}
                required
                autoFocus
              />
            </div>

            <div className="form-field">
              <label>Confirm new password</label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm your new password"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={submitting}
            >
              {submitting
                ? "Changing password…"
                : "Change password"}
            </button>

          </form>

          <div
            style={{
              marginTop: 20,
              fontSize: 13,
              color: "var(--muted)"
            }}
          >
            Your new password must be at least
            6 characters.
          </div>

        </div>
      </div>
    );
  }

  /*
  ==================================================
  LOGIN / REGISTER SCREEN
  ==================================================
  */

  return (
    <div className="auth-wrap">
      <div className="auth-card">

        <p className="eyebrow">
          Equipment Tracker
        </p>

        <h2
          className="page-title"
          style={{
            fontSize: 22,
            marginBottom: 20
          }}
        >
          {mode === "login"
            ? "Sign in"
            : "Create an account"}
        </h2>

        <form onSubmit={submit}>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {mode === "register" && (
            <div className="form-field">
              <label>Full name</label>

              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />
            </div>
          )}

          <div className="form-field">
            <label>Username</label>

            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              required
              autoComplete="username"
            />
          </div>

          <div className="form-field">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={submitting}
          >
            {submitting
              ? "Please wait…"
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </button>

        </form>

        <div className="auth-toggle">

          {mode === "login" ? (
            <>
              New here?

              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setError("");
                  setMode("register");
                }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?

              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setError("");
                  setMode("login");
                }}
              >
                Sign in
              </button>
            </>
          )}

        </div>

        {mode === "login" && (
          <div className="demo-box">
            Demo manager: manager / manager123
            <br />
            Demo user: user / user123
            <br />
            New users created by a Super User
            receive a temporary password.
          </div>
        )}

      </div>
    </div>
  );
}