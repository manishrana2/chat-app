"use client";

import { createContext, useContext, useEffect, useState, ReactNode, createElement } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AuthUser {
  userId: string;
  username: string;
  name: string;
  email?: string;
  image?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (data: {
    username: string;
    name: string;
    email?: string;
    phone?: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loginMut = useMutation((api as any).auth.loginWithPassword);
  const signupMut = useMutation((api as any).auth.signupWithPassword);
  const logoutMut = useMutation((api as any).auth.logout);

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (err) {
        console.error("Failed to restore session:", err);
        localStorage.removeItem("authUser");
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const result = await loginMut({ identifier, password });
      const authUser = {
        userId: result.userId,
        username: result.username,
        name: result.name,
        email: result.email,
        image: result.image,
      };
      setUser(authUser);
      localStorage.setItem("authUser", JSON.stringify(authUser));
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: {
    username: string;
    name: string;
    email?: string;
    phone?: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      await signupMut({
        username: data.username,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      await login(data.username, data.password);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (user) {
        await logoutMut({ userId: user.userId });
      }
      setUser(null);
      localStorage.removeItem("authUser");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
