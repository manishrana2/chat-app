"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import StoriesViewer from "@/components/StoriesViewer";
import { Id } from "../../convex/_generated/dataModel";
import Link from "next/link";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] =
    useState<Id<"conversations"> | null>(null);
  const [currentView, setCurrentView] = useState<"conversations" | "stories">("conversations");

  // Redirect to sign-in if not authenticated and loaded
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-center text-white">
          <div className="mb-4 animate-spin">⏳</div>
          <p className="text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-center text-white">
          <p className="mb-4 text-xl">You are not signed in.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/sign-in" className="px-4 py-2 bg-white text-blue-600 font-bold rounded hover:bg-blue-50">
              Sign in
            </Link>
            <Link href="/sign-up" className="px-4 py-2 border border-white text-white rounded hover:bg-white hover:text-blue-600">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar 
        onSelectAction={setSelectedConversation} 
        onStoriesClickAction={() => {
          setCurrentView("stories");
          setSelectedConversation(null);
        }}
        currentView={currentView}
      />

      <div className="flex-1 flex items-center justify-center bg-gray-50">
        {currentView === "stories" ? (
          <StoriesViewer />
        ) : selectedConversation ? (
          <ChatWindow conversationId={selectedConversation} />
        ) : (
          <div className="text-gray-400 text-center">
            <div className="text-5xl mb-4">💬</div>
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}