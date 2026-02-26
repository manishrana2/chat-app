"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Id } from "../../convex/_generated/dataModel";
import StatusBar from "./StatusBar";
import UserSearch from "./UserSearch";
import ProfileButton from "./ProfileButton";
import AppLogo from "./AppLogo";
import { useState } from "react";

type SidebarProps = {
  onSelectAction: (conversationId: Id<"conversations">) => void;
  onStoriesClickAction?: () => void;
  currentView?: "conversations" | "stories";
};

export default function Sidebar({ onSelectAction, onStoriesClickAction, currentView = "conversations" }: SidebarProps) {
  const { user, updateUser } = useAuth();
  const { requestPermission } = useNotifications();
  const [permissionAsked, setPermissionAsked] = useState(false);
  
  // Request notification permission on first load
  useEffect(() => {
    if (user && !permissionAsked) {
      requestPermission().catch(() => {});
      setPermissionAsked(true);
    }
  }, [user, permissionAsked, requestPermission]);
  
  const users = (api.users && (api.users as any).getUsers) ? useQuery((api.users as any).getUsers) : null as any;
  const safeUsers = users || [];

  // Ensure the generated Convex API includes the `conversations` module at runtime.
  const convApi = (api as any).conversations;
  if (!convApi) {
    console.error("Convex 'conversations' API not found. Make sure Convex dev is running and `_generated/api` is up to date.");
    return (
      <div className="w-64 h-screen border-r p-4 overflow-y-auto sidebar">
        <h2 className="text-xl font-bold mb-4">Conversations</h2>
        <div className="text-sm text-red-500">Convex functions not available — run `npx convex dev`</div>
      </div>
    );
  }

  const conversations = useQuery(convApi.getConversations, user ? { userId: user?.userId } : "skip");
  const safeConversations = conversations || [];

  const createConversation = useMutation(convApi.createConversation);
  const unfriendUserMut = useMutation((api.users as any).unfriendUser);
  const markAsFriendMut = useMutation((api.users as any).markAsFriend);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSelectUser = async (otherUser: any) => {
    if (!user) return;
    if (!createConversation) return alert('Conversations API not available. Run `npx convex dev`.');
    
    const otherUserId = otherUser._id;
    if (!otherUserId) {
      alert('Cannot create conversation - user ID not found');
      return;
    }

    // Ensure friendship before creating conversation
    const userFriends = (user as any)?.friends || [];
    if (!userFriends.includes(otherUserId)) {
      try {
        await markAsFriendMut({ userId: user.userId, friendId: otherUserId });
        updateUser({ friends: [...((user as any)?.friends || []), otherUserId] });
      } catch (e) {
        console.error('Failed to add friend before conversation:', e);
      }
    }
    
    const conversationId = await createConversation({
      members: [user.userId, otherUserId],
    });

    onSelectAction(conversationId);
  };

  return (
    <div className="w-full sm:w-64 h-auto sm:h-screen border-b sm:border-r border-gray-300 bg-white sidebar flex flex-col sm:p-4 p-3 overflow-y-auto">
      {/* Header with Logo and Profile Button */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <AppLogo />
        <ProfileButton />
      </div>

      <StatusBar />
      
      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => {}}
          className={`flex-1 py-2 px-3 rounded text-xs sm:text-sm font-semibold transition-colors ${
            currentView === "conversations"
              ? "bg-white text-blue-600 shadow"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          💬 Chats
        </button>
        <button
          onClick={() => onStoriesClickAction?.()}
          className={`flex-1 py-2 px-3 rounded text-xs sm:text-sm font-semibold transition-colors ${
            currentView === "stories"
              ? "bg-white text-blue-600 shadow"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          📖 Stories
        </button>
      </div>
      
      {/* User Search by Username (Instagram-like) */}
      <UserSearch />
      
      {/* Search box */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && searchResults.length > 0 && (
          <div className="mt-2 border rounded p-2 bg-gray-50 max-h-32 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-600 mb-2">Search Results ({searchResults.length})</div>
            {searchResults.slice(0, 5).map((msg: any) => (
              <div key={msg._id} className="text-xs p-1 border-b text-gray-700 truncate">
                {msg.text || `[${msg.mediaType}]`}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <h2 className="text-xl font-bold mb-4">Conversations</h2>

      {safeConversations.length === 0 ? (
        <div className="text-sm text-muted">No conversations yet</div>
      ) : (
        (() => {
          // Deduplicate conversations by partner (keep most recent)
          const byPartner: Record<string, any> = {};
          for (const c of safeConversations) {
            const otherId = (c.members || []).find((m: string) => m !== user?.userId) || c.members?.[0];
            if (!otherId) continue;
            const existing = byPartner[otherId];
            if (!existing || (c.updatedAt || 0) > (existing.updatedAt || 0)) {
              byPartner[otherId] = c;
            }
          }
          const unique = Object.values(byPartner).sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));

          // Filter to show only **friends** (not unfriended/blocked)
          const friendConversations = unique.filter((c: any) => {
            const otherId = (c.members || []).find((m: string) => m !== user?.userId) || c.members?.[0];
            const userFriends = (user as any)?.friends || [];
            const blockedUsers = (user as any)?.blockedUsers || [];
            // Show conversation only if partner is a friend and not blocked
            return userFriends.includes(otherId) && !blockedUsers.includes(otherId);
          });

          return friendConversations.map((c: any) => {
            const otherId = (c.members || []).find((m: string) => m !== user?.userId) || c.members?.[0];
            const partner = safeUsers.find((u: any) => u._id === otherId);
            const avatar = partner?.image || undefined;
            // Show name, then username, then ID prefix, fallback to "User"
            const displayName = partner?.name || partner?.username || (otherId ? `User-${otherId.slice(0, 6)}` : "User");

            return (
              <div
                key={c._id}
                className="flex flex-col gap-1 p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => onSelectAction(c._id)}
              >
                <div className="flex items-center gap-3">
                  {avatar ? (
                    <img src={avatar} className="w-10 h-10 rounded-full object-cover" alt={displayName} />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-sm text-white font-bold">
                      {(partner?.name || partner?.username || displayName).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{displayName}</div>
                    {partner?.username && <div className="text-xs text-gray-500 truncate">@{partner.username}</div>}
                    {!partner?.username && <div className="text-xs text-muted truncate">{c.lastMessage || "👋 Say hello..."}</div>}
                  </div>
                </div>
              </div>
            );
          });
        })()
      )}

      <hr className="my-3" />

      <h2 className="text-xl font-bold mb-4">Contacts</h2>

      {safeUsers.length === 0 ? (
        <div className="text-sm text-muted">No users yet</div>
      ) : (
        safeUsers.map((u: any) => {
          if (u.clerkId === user?.userId) return null;

          // Check if this user is a friend
          const userFriends = (user as any)?.friends || [];
          const isFriend = userFriends.includes(u._id);
          
          // Check if user is blocked
          const blockedUsers = (user as any)?.blockedUsers || [];
          const isBlocked = blockedUsers.includes(u._id);

          return (
            <div
              key={u._id}
              className="flex items-center gap-2 justify-between p-2 hover:bg-gray-100 rounded group"
            >
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => handleSelectUser(u)}
              >
                <img
                  src={u.image}
                  className="w-8 h-8 rounded-full object-cover"
                  alt={u.name}
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="text-sm truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {isFriend ? "✓ Friend" : "Not Friend"}
                  </p>
                </div>
              </div>
              
              {isFriend ? (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`Remove ${u.name}?`)) {
                      try {
                        await unfriendUserMut({ userId: user?.userId || "", targetUserId: u._id });
                        // remove from auth context friends array
                        updateUser({ friends: ((user as any)?.friends || []).filter((id: string) => id !== u._id) });
                        alert("User removed");
                      } catch (err) {
                        console.error(err);
                        alert("Failed to remove user");
                      }
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200 font-medium"
                  title="Remove Friend"
                >
                  ✕
                </button>
              ) : isBlocked ? (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`Add ${u.name} as friend?`)) {
                      try {
                        await markAsFriendMut({ userId: user?.userId || "", friendId: u._id });
                        updateUser({ friends: [...((user as any)?.friends || []), u._id] });
                        alert("Friend added");
                      } catch (err) {
                        console.error(err);
                        alert("Failed to add friend");
                      }
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded hover:bg-blue-200 font-medium"
                  title="Add as Friend"
                >
                  + Add
                </button>
              ) : (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`Add ${u.name} as friend?`)) {
                      try {
                        await markAsFriendMut({ userId: user?.userId || "", friendId: u._id });
                        updateUser({ friends: [...((user as any)?.friends || []), u._id] });
                        alert("Friend added");
                      } catch (err) {
                        console.error(err);
                        alert("Failed to add friend");
                      }
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-green-100 text-green-600 text-xs rounded hover:bg-green-200 font-medium"
                  title="Add as Friend"
                >
                  + Add
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}