"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const requestReset = useMutation((api as any).auth.requestPasswordReset);
  const verifyOtp = useMutation((api as any).auth.verifyResetOtp);
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

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email");
      }

      const result = await requestReset({ email });
      setMessage(`✅ OTP: ${result.otp} (Valid for 10 minutes) - Check your email or use code above`);
      setStep("otp");
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (!otp || otp.length !== 6) {
        throw new Error("OTP must be 6 digits");
      }

      await verifyOtp({ email, otp });
      setMessage("OTP verified! Now set your new password.");
      setStep("password");
    } catch (err: any) {
      setError(err?.message || "Failed to verify OTP");
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
      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      await resetPassword({
        email,
        otp,
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

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isOtpValid = otp.length === 6 && /^\d+$/.test(otp);
  const isPasswordValid =
    newPassword.length >= 6 &&
    confirmPassword.length >= 6 &&
    newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 text-center">
          Reset Password
        </h1>
        <p className="text-gray-600 text-center mb-6 text-xs sm:text-sm">
          {step === "email" && "Enter your email to receive an OTP"}
          {step === "otp" && "Enter the 6-digit code sent to your email"}
          {step === "password" && "Create your new password"}
        </p>

        {/* Progress indicator */}
        <div className="flex justify-between mb-6">
          <div
            className={`flex-1 h-1 ${step === "email" || step === "otp" || step === "password" ? "bg-blue-500" : "bg-gray-300"}`}
          ></div>
          <div
            className={`flex-1 h-1 mx-1 ${step === "otp" || step === "password" ? "bg-blue-500" : "bg-gray-300"}`}
          ></div>
          <div
            className={`flex-1 h-1 ${step === "password" ? "bg-blue-500" : "bg-gray-300"}`}
          ></div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 text-xs sm:text-sm font-semibold flex items-start gap-2">
            <span className="text-lg">❌</span>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border-2 border-green-300 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 text-xs sm:text-sm font-semibold flex items-start gap-2">
            <span className="text-lg">✅</span>
            <span>{message}</span>
          </div>
        )}



        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Email Address {isEmailValid && <span className="text-green-600">✓</span>}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition text-xs sm:text-sm ${
                  email && !isEmailValid
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isEmailValid}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-2 sm:py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm sm:text-base"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Enter OTP {isOtpValid && <span className="text-green-600">✓</span>}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition text-lg sm:text-xl font-mono text-center tracking-[0.5em] ${
                  otp && !isOtpValid
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-2">Valid for 10 minutes</p>
            </div>

            <button
              type="submit"
              disabled={loading || !isOtpValid}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-2 sm:py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm sm:text-base"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm"
            >
              ← Send OTP to different email
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                New Password {newPassword.length >= 6 && <span className="text-green-600">✓</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-xs sm:text-sm"
                  disabled={loading}
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
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Confirm Password {isPasswordValid && <span className="text-green-600">✓</span>}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition text-xs sm:text-sm ${
                  confirmPassword && newPassword !== confirmPassword
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-2 sm:py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm sm:text-base"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Footer Links */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-2">
          <p className="text-gray-600 text-xs sm:text-sm">
            Remember your password?{" "}
            <Link
              href="/sign-in"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Login
            </Link>
          </p>
          <p className="text-gray-600 text-xs sm:text-sm">
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
