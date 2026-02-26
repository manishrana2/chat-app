"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type AccountInfoModalProps = {
  onClose: () => void;
};

export default function AccountInfoModal({ onClose }: AccountInfoModalProps) {
  const { user, updateUser } = useAuth();
  const updateProfileMut = useMutation((api.users as any).updateProfile);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) return null;

  const handleSave = async () => {
    if (!name.trim() || name.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateProfileMut({
        userId: user.userId,
        name: name.trim(),
        bio: bio.trim(),
      });
      setSuccess("Profile updated successfully!");
      // update auth context so UI reflects new name immediately
      updateUser({ name: name.trim(), bio: bio.trim() });
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const firstLetter = (name || user.name || user.username || "U")[0].toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-lg font-bold">Account Info</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {firstLetter}
            </div>
          </div>

          {/* View Mode */}
          {!isEditing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase font-semibold">Name</label>
                <p className="text-lg font-semibold">{name || user.name}</p>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-semibold">Username</label>
                <p className="text-base">@{user.username}</p>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-semibold">Email</label>
                <p className="text-base text-gray-700 break-all">{user.email}</p>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-semibold">Bio</label>
                <p className="text-base text-gray-700">{bio || user.bio || "No bio set"}</p>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500">
                  Logged in as <strong>{user.username}</strong>
                </p>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => {
                  setIsEditing(true);
                  setError("");
                  setSuccess("");
                }}
                className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                ✏️ Edit Profile
              </button>
            </div>
          )}

          {/* Edit Mode */}
          {isEditing && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Add a bio (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-yellow-50 border border-yellow-400 rounded text-yellow-800 text-sm">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-400 rounded text-green-800 text-sm">
                  ✓ {success}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50"
                >
                  {loading ? "Saving..." : "✓ Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setName(user.name || "");
                    setBio(user.bio || "");
                    setError("");
                    setSuccess("");
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
