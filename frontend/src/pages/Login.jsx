
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

  /*
  ==================================================
  SHOW / HIDE PASSWORD STATES
  ==================================================
  */

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /*
  ==================================================
  VALIDATION LIMITS
  ==================================================
  */

  const MIN_PASSWORD_LENGTH = 6;
  const MAX_PASSWORD_LENGTH = 72;
  const MAX_NAME_LENGTH = 100;
  const MAX_USERNAME_LENGTH = 30;

  /*
  ==================================================
  LOGIN
  ==================================================
  */

  const submitLogin = async () => {
    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (
      username.trim().length >
      MAX_USERNAME_LENGTH
    ) {
      setError(
        `Username must not exceed ${MAX_USERNAME_LENGTH} characters.`
      );
      return;
    }

    if (
      password.length >
      MAX_PASSWORD_LENGTH
    ) {
      setError(
        `Password must not exceed ${MAX_PASSWORD_LENGTH} characters.`
      );
      return;
    }

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
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (
      trimmedName.length >
      MAX_NAME_LENGTH
    ) {
      setError(
        `Full name must not exceed ${MAX_NAME_LENGTH} characters.`
      );
      return;
    }

    if (!trimmedUsername) {
      setError("Please enter a username.");
      return;
    }

    if (
      trimmedUsername.length >
      MAX_USERNAME_LENGTH
    ) {
      setError(
        `Username must not exceed ${MAX_USERNAME_LENGTH} characters.`
      );
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (
      password.length <
      MIN_PASSWORD_LENGTH
    ) {
      setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }

    if (
      password.length >
      MAX_PASSWORD_LENGTH
    ) {
      setError(
        `Password must not exceed ${MAX_PASSWORD_LENGTH} characters.`
      );
      return;
    }

    await register(
      trimmedName,
      trimmedUsername,
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
      setError(
        "Please enter and confirm your new password."
      );
      return;
    }

    if (
      newPassword.length <
      MIN_PASSWORD_LENGTH
    ) {
      setError(
        `Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }

    if (
      newPassword.length >
      MAX_PASSWORD_LENGTH
    ) {
      setError(
        `Your new password must not exceed ${MAX_PASSWORD_LENGTH} characters.`
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

    await changePassword(
      password,
      newPassword
    );

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
  PASSWORD INPUT STYLE
  ==================================================
  */

  const passwordInputWrapper = {
    position: "relative",
    width: "100%"
  };

  const passwordInputStyle = {
    width: "100%",
    paddingRight: "45px"
  };

  const eyeButtonStyle = {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "18px",
    padding: "5px",
    lineHeight: 1
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

              <div style={passwordInputWrapper}>
                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="Enter your new password"
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  required
                  autoFocus
                  autoComplete="new-password"
                  style={passwordInputStyle}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      !showNewPassword
                    )
                  }
                  style={eyeButtonStyle}
                  aria-label={
                    showNewPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  title={
                    showNewPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showNewPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label>Confirm new password</label>

              <div style={passwordInputWrapper}>
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm your new password"
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
                  required
                  autoComplete="new-password"
                  style={passwordInputStyle}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  style={eyeButtonStyle}
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  title={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword
                    ? "🙈"
                    : "👁️"}
                </button>
              </div>
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
            Your new password must be between{" "}
            {MIN_PASSWORD_LENGTH} and{" "}
            {MAX_PASSWORD_LENGTH} characters.
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
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                maxLength={MAX_NAME_LENGTH}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-field">
            <label>Username</label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              maxLength={MAX_USERNAME_LENGTH}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-field">
            <label>Password</label>

            <div style={passwordInputWrapper}>
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_PASSWORD_LENGTH}
                required
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                style={passwordInputStyle}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                style={eyeButtonStyle}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                title={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword
                  ? "🙈"
                  : "👁️"}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div
              style={{
                marginTop: -5,
                marginBottom: 15,
                fontSize: 13,
                color: "var(--muted)"
              }}
            >
              Password must be between{" "}
              {MIN_PASSWORD_LENGTH} and{" "}
              {MAX_PASSWORD_LENGTH} characters.
            </div>
          )}

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
                  setMessage("");
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
                  setMessage("");
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
