"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Id } from "../../convex/_generated/dataModel";
import StatusBar from "./StatusBar";
import UserSearch from "./UserSearch";
import { useState } from "react";

type SidebarProps = {
  onSelectAction: (conversationId: Id<"conversations">) => void;
  onStoriesClickAction?: () => void;
  currentView?: "conversations" | "stories";
};

export default function Sidebar({ onSelectAction, onStoriesClickAction, currentView = "conversations" }: SidebarProps) {
  const { user } = useAuth();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSelectUser = async (otherUser: any) => {
    if (!user) return;
    if (!createConversation) return alert('Conversations API not available. Run `npx convex dev`.');
    
    // Always use _id (Convex document ID) for consistency, not clerkId
    const otherUserId = otherUser._id;
    if (!otherUserId) {
      alert('Cannot create conversation - user ID not found');
      return;
    }
    
    const conversationId = await createConversation({
      members: [user.userId, otherUserId],
    });

    onSelectAction(conversationId);
  };

  return (
    <div className="w-64 h-screen border-r p-4 overflow-y-auto sidebar">
      <StatusBar />
      
      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => {}}
          className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${
            currentView === "conversations"
              ? "bg-white text-blue-600 shadow"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          💬 Chats
        </button>
        <button
          onClick={() => onStoriesClickAction?.()}
          className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${
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
          className="w-full px-3 py-2 border rounded-lg text-sm"
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

          return unique.map((c: any) => {
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
                <p className="text-sm truncate">{u.name}</p>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm(`Unfriend ${u.name}?`)) {
                    try {
                      await unfriendUserMut({ userId: user?.userId || "", targetUserId: u._id });
                      alert("User unfriended");
                    } catch (err) {
                      console.error(err);
                      alert("Failed to unfriend user");
                    }
                  }
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded hover:bg-red-100"
                title="Unfriend"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="18" y1="8" x2="23" y2="13" />
                  <line x1="23" y1="8" x2="18" y2="13" />
                </svg>
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}