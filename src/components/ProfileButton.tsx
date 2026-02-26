"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AccountInfoModal from "./AccountInfoModal";

export default function ProfileButton() {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home/login
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed");
    }
  };

  const firstLetter = (user.name || user.username || "U").charAt(0).toUpperCase();

  return (
    <>
      <div className="relative">
        {/* Profile Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
          title={`Logged in as ${user.name || user.username}`}
        >
          {/* Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {firstLetter}
          </div>
          
          {/* User Info */}
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium">{user.name || user.username || "User"}</div>
            {user.username && <div className="text-xs text-gray-500">@{user.username}</div>}
          </div>

          {/* Dropdown Arrow */}
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform hidden sm:block`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b">
              <div className="text-sm font-semibold">{user.name || "User"}</div>
              {user.username && <div className="text-xs text-gray-600">@{user.username}</div>}
              {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowAccountModal(true);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
              >
                👤 My Account
              </button>
              
              <button
                onClick={() => {
                  setShowMenu(false);
                  // Could add settings here later
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
              >
                ⚙️ Settings
              </button>
            </div>

            {/* Logout Button */}
            <div className="border-t py-2">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        )}

        {/* Overlay to close menu */}
        {showMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>

      {/* Account Info Modal */}
      {showAccountModal && (
        <AccountInfoModal onClose={() => setShowAccountModal(false)} />
      )}
    </>
  );
}
