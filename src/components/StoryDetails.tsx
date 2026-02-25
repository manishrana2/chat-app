"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Id } from "../../convex/_generated/dataModel";

type StoryDetailsProps = {
  storyId: Id<"stories">;
  onCloseAction: () => void;
  onNextAction: () => void;
};

export default function StoryDetails({
  storyId,
  onCloseAction,
  onNextAction,
}: StoryDetailsProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [storyOwnerData, setStoryOwnerData] = useState<any>(null);

  // Get the story details
  const allStories = useQuery((api.stories as any)?.getStoriesForUser, user?.userId ? { userId: user.userId } : "skip") || [];
  const story = allStories?.find((s: any) => s._id === storyId);

  // Get all users for owner info
  const allUsers = useQuery((api.users as any)?.getUsers) || [];

  // Mark story as viewed
  const markViewed = useMutation((api.stories as any)?.markStoryViewed);

  useEffect(() => {
    if (story && user && story.ownerId !== user.userId) {
      markViewed({ storyId, userId: user.userId });
    }
  }, [story, storyId, user, markViewed]);

  // Get story owner info
  useEffect(() => {
    if (story && allUsers && Array.isArray(allUsers)) {
      const owner = allUsers.find(
        (u: any) => u.clerkId === story.ownerId || u._id === story.ownerId
      );
      setStoryOwnerData(owner);
    }
  }, [story, allUsers]);

  // Auto-advance story after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          onNextAction();
          return 0;
        }
        return p + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onNextAction]);

  if (!story) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center">
          <p>Loading story...</p>
        </div>
      </div>
    );
  }

  const isOwnStory = story.ownerId === user?.userId;
  const displayName = storyOwnerData?.name || "Anonymous";

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      {/* Close button */}
      <button
        onClick={onCloseAction}
        className="absolute top-4 left-4 text-white text-2xl hover:scale-110 transition-transform z-10"
      >
        ✕
      </button>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700">
        <div
          className="h-full bg-white transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Story container */}
      <div className="relative w-full max-w-md h-screen max-h-screen flex flex-col bg-black">
        {/* Story background */}
        {story.mediaUrl ? (
          <img
            src={story.mediaUrl}
            alt="story"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500" />
        )}

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col h-full justify-between p-6">
          {/* Header with user info */}
          <div className="flex items-center gap-3">
            {storyOwnerData?.image && (
              <img
                src={storyOwnerData.image}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border-2 border-white"
              />
            )}
            <div>
              <h3 className="text-white font-semibold">{displayName}</h3>
              <p className="text-white text-xs opacity-70">
                {isOwnStory && `${story.viewers?.length || 0} views`}
              </p>
            </div>
          </div>

          {/* Story text (if any) */}
          {story.text && (
            <div className="text-center">
              <p className="text-white text-lg font-medium drop-shadow-lg">
                {story.text}
              </p>
            </div>
          )}
        </div>

        {/* Navigation areas */}
        {/* Previous button */}
        <button
          onClick={() => {
            setProgress(0);
            // Handle going to previous story
          }}
          className="absolute left-0 top-0 bottom-0 w-1/4 hover:bg-white hover:bg-opacity-5 transition-colors z-20"
        >
          <span className="sr-only">Previous</span>
        </button>

        {/* Next button */}
        <button
          onClick={() => {
            setProgress(100);
            onNextAction();
          }}
          className="absolute right-0 top-0 bottom-0 w-1/4 hover:bg-white hover:bg-opacity-5 transition-colors z-20"
        >
          <span className="sr-only">Next</span>
        </button>
      </div>

      {/* Bottom info (if own story) */}
      {isOwnStory && story.viewers && story.viewers.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-60 text-white p-3 rounded-lg max-h-32 overflow-y-auto">
          <p className="text-xs font-semibold mb-2">Viewed by ({story.viewers.length})</p>
          <div className="text-xs space-y-1">
            {story.viewers.map((viewerId: string, i: number) => {
              const viewer = allUsers?.find(
                (u: any) => u.clerkId === viewerId || u._id === viewerId
              );
              return (
                <div key={i}>
                  {viewer?.name || "User"}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
