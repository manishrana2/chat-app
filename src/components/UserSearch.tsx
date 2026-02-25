"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export default function UserSearch() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const searchResults = useQuery(
    (api.users as any).searchUsersByUsername,
    user?.userId && searchTerm.trim().length > 0
      ? { username: searchTerm, requesterId: user.userId }
      : "skip"
  );

  const createRequestMut = useMutation((api.requests as any).createRequest);
  const [sentRequests, setSentRequests] = useState(new Set<string>());
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async (recipientId: string) => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      await createRequestMut({
        requesterId: user.userId,
        recipientId,
      });
      setSentRequests((prev) => new Set([...prev, recipientId]));
      setTimeout(() => setShowDropdown(false), 500);
    } catch (err) {
      console.error("Failed to send request:", err);
      alert("Failed to send friend request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative px-4 py-3">
      <div className="relative">
        <input
          type="text"
          placeholder="Search by @username..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(e.target.value.trim().length > 0);
          }}
          onFocus={() => setShowDropdown(searchTerm.trim().length > 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {showDropdown && searchTerm.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            {searchResults && searchResults.length > 0 ? (
              searchResults.map((foundUser: any) => (
                <div
                  key={foundUser._id}
                  className="p-3 border-b hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {foundUser.image && (
                      <img
                        src={foundUser.image}
                        alt={foundUser.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {foundUser.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        @{foundUser.username}
                      </p>
                    </div>
                  </div>

                  {sentRequests.has(foundUser._id) ? (
                    <span className="text-xs text-green-600 font-semibold">
                      ✓ Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(foundUser._id)}
                      disabled={loading}
                      className="ml-2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      Add
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No users found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
