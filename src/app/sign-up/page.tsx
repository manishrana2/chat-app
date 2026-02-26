"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function SignUp() {
  const router = useRouter();
  const { signup, loading } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Check username availability
  const usernameCheck = useQuery(
    (api as any).auth.checkUsernameAvailable,
    formData.username ? { username: formData.username } : "skip"
  );

  // Check email availability
  const emailCheck = useQuery(
    (api as any).auth.checkEmailAvailable,
    formData.email ? { email: formData.email } : "skip"
  );

  // Update username error
  useEffect(() => {
    if (usernameCheck && !usernameCheck.available) {
      setUsernameError(usernameCheck.reason || "Username not available");
    } else {
      setUsernameError("");
    }
  }, [usernameCheck]);

  // Update email error
  useEffect(() => {
    if (emailCheck && !emailCheck.available) {
      setEmailError(emailCheck.reason || "Email not available");
    } else {
      setEmailError("");
    }
  }, [emailCheck]);

  // Check password match
  useEffect(() => {
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Final validation
    if (!formData.username || formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (usernameError) {
      setError("Username already taken. Please choose another.");
      return;
    }

    if (!formData.name || formData.name.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (passwordError) {
      setError("Passwords do not match");
      return;
    }

    if (formData.email && emailError) {
      setError("Email is already registered. Please use a different email.");
      return;
    }

    try {
      await signup({
        username: formData.username,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        password: formData.password,
      });
      setSuccess("Account created! Redirecting...");
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    }
  };

  const isFormValid =
    formData.username.length >= 3 &&
    !usernameError &&
    formData.name.length >= 2 &&
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword &&
    (!formData.email || !emailError);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
          Create Account 🎉
        </h1>
        <p className="text-center text-gray-600 text-xs sm:text-sm mb-6">
          Join our chat community!
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Username */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Username {formData.username && !usernameError && <span className="text-green-600">✓</span>}
              {usernameError && <span className="text-red-600">✗</span>}
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="@username (3+ chars)"
              className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition text-xs sm:text-sm ${
                usernameError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              disabled={loading}
            />
            {usernameError && <p className="text-xs text-red-600 mt-1">{usernameError}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Full Name {formData.name.length >= 2 && <span className="text-green-600">✓</span>}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-xs sm:text-sm"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Email (Optional) {formData.email && !emailError && <span className="text-green-600">✓</span>}
              {emailError && <span className="text-red-600">✗</span>}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition text-xs sm:text-sm ${
                emailError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              disabled={loading}
            />
            {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Phone (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1234567890"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-xs sm:text-sm"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Password {formData.password.length >= 6 && <span className="text-green-600">✓</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-xs sm:text-sm"
              disabled={loading}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Confirm Password {formData.confirmPassword && !passwordError && <span className="text-green-600">✓</span>}
              {passwordError && <span className="text-red-600">✗</span>}
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={`w-full px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition text-xs sm:text-sm ${
                passwordError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              disabled={loading}
            />
            {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
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

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold py-2 sm:py-3 px-4 rounded-lg hover:from-purple-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6 text-sm sm:text-base"
          >
            {loading ? "Creating account..." : "Sign Up"}
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

        {/* Sign In Link */}
        <p className="text-center text-gray-600 text-xs sm:text-sm">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-blue-600 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
