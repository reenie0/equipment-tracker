
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  const [token, setToken] = useState(
    () => localStorage.getItem("et_token") || ""
  );

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("et_user");
    return raw ? JSON.parse(raw) : null;
  });

  /*
  ====================================================
  TOKEN STORAGE
  ====================================================
  */

  useEffect(() => {
    if (token) {
      localStorage.setItem("et_token", token);
    } else {
      localStorage.removeItem("et_token");
    }
  }, [token]);

  /*
  ====================================================
  USER STORAGE
  ====================================================
  */

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        "et_user",
        JSON.stringify(user)
      );
    } else {
      localStorage.removeItem("et_user");
    }
  }, [user]);

  /*
  ====================================================
  LOGIN
  ====================================================
  */

  const login = async (username, password) => {

    const data = await api.login(
      username,
      password
    );

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  /*
  ====================================================
  REGISTER
  ====================================================
  */

  const register = async (
    name,
    username,
    password,
    department
  ) => {

    const data = await api.register(
      name,
      username,
      password,
      department
    );

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  /*
  ====================================================
  LOGOUT
  ====================================================
  */

  const logout = () => {
    setToken("");
    setUser(null);
  };

  /*
  ====================================================
  CHANGE PASSWORD
  ====================================================
  */

  const changePassword = async (
    currentPassword,
    newPassword
  ) => {

    if (!token) {
      throw new Error(
        "You must be logged in."
      );
    }

    const data = await api.changePassword(
      token,
      currentPassword,
      newPassword
    );

    /*
    The user has now completed the
    mandatory password change.
    */

    setUser((currentUser) =>
      currentUser
        ? {
            ...currentUser,
            must_change_password: 0
          }
        : currentUser
    );

    return data;
  };

  /*
  ====================================================
  ROLE HELPERS
  ====================================================
  */

  const isManager =
    user?.role === "manager" ||
    user?.role === "superuser";

  const isSuperUser =
    user?.role === "superuser";

  /*
  ====================================================
  PASSWORD CHANGE STATUS
  ====================================================
  */

  const mustChangePassword =
    Boolean(user?.must_change_password);

  /*
  ====================================================
  CONTEXT VALUE
  ====================================================
  */

  const value = useMemo(
    () => ({
      token,
      user,

      login,
      register,
      logout,
      changePassword,

      isManager,
      isSuperUser,
      mustChangePassword
    }),
    [
      token,
      user,
      isManager,
      isSuperUser,
      mustChangePassword
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/*
====================================================
USE AUTH
====================================================
*/

export function useAuth() {

  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}
