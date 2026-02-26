"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AppLogo from "@/components/AppLogo";

export default function SignIn() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!identifier || !password) {
      setError("Please enter username/email and password");
      return;
    }

    if (identifier.trim().length < 3) {
      setError("Please enter a valid username or email");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await login(identifier, password);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      const errorMsg = err.message || "Login failed";
      // Provide user-friendly error messages
      if (errorMsg.includes("not found")) {
        setError("Username/email not found. Please check and try again.");
      } else if (errorMsg.includes("password")) {
        setError("Your password was incorrect. Please try again.");
      } else {
        setError(errorMsg);
      }
    }
  };

  const isFormValid = identifier.trim().length >= 3 && password.length >= 6;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <AppLogo />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
          Welcome Back! 👋
        </h1>
        <p className="text-center text-gray-600 text-xs sm:text-sm mb-6">
          Sign in to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Username or Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your username or email"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-xs sm:text-sm"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-xs sm:text-sm"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 text-sm"
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <div className="text-right mt-2">
              <Link
                href="/forgot-password"
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold flex items-start gap-2">
              <span className="text-base sm:text-lg">❌</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-2 border-green-300 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="text-base sm:text-lg">✅</span>
              <span>{success}</span>
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-2 sm:py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6 text-sm sm:text-base"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-gray-600 text-xs sm:text-sm">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-blue-600 font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
