"use client";

import React, { ReactNode, useState, useEffect } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  private hasError: boolean;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.hasError = false;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Caught error:", error, errorInfo);
    this.hasError = true;
    
    // Log to localStorage for debugging
    const errors = JSON.parse(localStorage.getItem("_app_errors") || "[]");
    errors.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      component: errorInfo.componentStack,
    });
    // Keep last 10 errors
    localStorage.setItem("_app_errors", JSON.stringify(errors.slice(-10)));
  }

  render() {
    if (this.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-red-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">The app encountered an unexpected error. Reloading may help.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorLogger() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);
      const errors = JSON.parse(localStorage.getItem("_app_errors") || "[]");
      errors.push({
        timestamp: new Date().toISOString(),
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
      localStorage.setItem("_app_errors", JSON.stringify(errors.slice(-10)));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      const errors = JSON.parse(localStorage.getItem("_app_errors") || "[]");
      errors.push({
        timestamp: new Date().toISOString(),
        type: "unhandled_rejection",
        reason: event.reason?.message || String(event.reason),
      });
      localStorage.setItem("_app_errors", JSON.stringify(errors.slice(-10)));
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}

/**
 * Get app errors from localStorage
 */
export function getAppErrors() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("_app_errors") || "[]");
}

/**
 * Clear app errors from localStorage
 */
export function clearAppErrors() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("_app_errors");
}
