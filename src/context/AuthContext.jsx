// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { STORAGE_KEY } from "../utils/constants.js";
import { logoutUser } from "../api/apiService.js";

const AuthContext = createContext(null);

const normalizeUser = (raw) => {
  if (!raw || typeof raw !== "object") return raw;

  const id = raw.id ?? raw.userId ?? null;
  return {
    ...raw,
    id,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const userData = normalizeUser(JSON.parse(stored));

        // Token muddati tugaganmi?
        if (userData.token) {
          const payload = JSON.parse(atob(userData.token.split(".")[1]));
          if (payload.exp * 1000 < Date.now()) {
            // Token eskirgan — tozala
            localStorage.removeItem(STORAGE_KEY);
          } else {
            // Token hali amal qiladi — sessiyani tiklash
            setUser(userData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
          }
        } else {
          setUser(userData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const safeUser = normalizeUser(userData.user || userData);
    const token = safeUser.token || safeUser.access_token || userData.token;
    const { token: _t, access_token: _at, ...rest } = safeUser;

    const userToStore = normalizeUser({ ...rest, token });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userToStore));
    setUser(userToStore);
  };

  const updateUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const logout = async () => {
    try {
      if (user?.token && user?.role) {
        await logoutUser(user.token, user.role);
      }
    } catch {}
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);