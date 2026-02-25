"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "token" | "reset">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestReset = useMutation((api as any).auth.requestPasswordReset);
  const verifyToken = useQuery((api as any).auth.verifyResetToken, token ? { token } : "skip");
  const resetPassword = useMutation((api as any).auth.resetPassword);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!email) {
        throw new Error("Email is required");
      }

      const result = await requestReset({ email });
      setMessage("Reset token generated! Copy it below and proceed.");
      setToken(result.resetToken);
      setStep("token");
    } catch (err: any) {
      setError(err?.message || "Failed to request reset");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!token) {
        throw new Error("Token is required");
      }

      setMessage("Token verified! Now set your new password.");
      setStep("reset");
    } catch (err: any) {
      setError(err?.message || "Invalid or expired token");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!token) {
        throw new Error("Token is required");
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      await resetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.push("/sign-in"), 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 text-center">
          Reset Password
        </h1>
        <p className="text-gray-600 text-center mb-6 text-sm sm:text-base">
          {step === "email" && "Enter your email to receive a reset token"}
          {step === "token" && "Enter the reset token you received"}
          {step === "reset" && "Create your new password"}
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
            {message}
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition text-sm sm:text-base"
            >
              {loading ? "Sending..." : "Send Reset Token"}
            </button>
          </form>
        )}

        {/* Step 2: Token Input */}
        {step === "token" && (
          <form onSubmit={handleVerifyToken} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                Reset Token
              </label>
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your reset token here"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                rows={3}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Token is valid for 1 hour
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition text-sm sm:text-base"
            >
              {loading ? "Verifying..." : "Verify Token"}
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition text-sm sm:text-base"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            Remember your password?{" "}
            <Link
              href="/sign-in"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Login
            </Link>
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
