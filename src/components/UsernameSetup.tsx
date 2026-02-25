"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export default function UsernameSetup({ onCompleteAction }: { onCompleteAction: () => void }) {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const setUsernameMut = useMutation((api.users as any).setUsername);
  const checkAvailable = useQuery(
    (api.users as any).checkUsernameAvailable,
    username.trim().length >= 3 ? { username } : "skip"
  );

  const handleSetUsername = async () => {
    if (!user?.userId) {
      setError("User not authenticated");
      return;
    }

    if (!username.trim() || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (!checkAvailable?.available) {
      setError(checkAvailable?.reason || "Username not available");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await setUsernameMut({ clerkId: user.userId, username });
      setSuccess("Username set successfully! 🎉");
      setTimeout(onCompleteAction, 1000);
    } catch (err) {
      setError((err as any).message || "Failed to set username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Create Your Username</h2>
        <p className="text-gray-600 mb-4">
          Choose a unique username so others can find you like on Instagram!
        </p>

        <input
          type="text"
          placeholder="@username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setSuccess("");
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mb-4">
          Letters, numbers, dots, and underscores only. At least 3 characters.
        </p>

        {username.trim().length >= 3 && (
          <p
            className={`text-sm mb-4 ${
              checkAvailable?.available ? "text-green-600" : "text-red-600"
            }`}
          >
            {checkAvailable?.available ? "✓ Username available!" : checkAvailable?.reason}
          </p>
        )}

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {success && <p className="text-sm text-green-600 mb-4">{success}</p>}

        <button
          onClick={handleSetUsername}
          disabled={
            loading ||
            !username.trim() ||
            username.length < 3 ||
            !checkAvailable?.available
          }
          className={`w-full py-2 rounded-lg font-semibold text-white ${
            loading ||
            !username.trim() ||
            username.length < 3 ||
            !checkAvailable?.available
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Setting username..." : "Set Username"}
        </button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          You can change this later in settings
        </p>
      </div>
    </div>
  );
}
