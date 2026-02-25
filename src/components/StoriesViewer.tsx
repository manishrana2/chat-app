"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import StoryDetails from "./StoryDetails";
import StoryPostForm from "./StoryPostForm";
import { Id } from "../../convex/_generated/dataModel";

export default function StoriesViewer() {
  const { user } = useAuth();
  const [selectedStoryId, setSelectedStoryId] = useState<Id<"stories"> | null>(null);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Get stories for the user
  const stories = useQuery(
    (api.stories as any)?.getStoriesForUser,
    user?.userId ? { userId: user.userId } : "skip"
  );

  // Get all users to display names
  const allUsers = useQuery((api.users as any)?.getUsers) || [];

  // Create a map of user IDs to user data
  useEffect(() => {
    if (allUsers && Array.isArray(allUsers)) {
      const userMap: Record<string, any> = {};
      allUsers.forEach((u: any) => {
        userMap[u.clerkId || u._id] = u;
      });
      setUsers(userMap);
    }
  }, [allUsers]);

  if (selectedStoryId) {
    return (
      <StoryDetails
        storyId={selectedStoryId}
        onCloseAction={() => setSelectedStoryId(null)}
        onNextAction={() => {
          // Get next story in chronological order
          if (stories && stories.length > 0) {
            const currentIndex = stories.findIndex(
              (s: any) => s._id === selectedStoryId
            );
            if (currentIndex < stories.length - 1) {
              setSelectedStoryId(stories[currentIndex + 1]._id);
            } else {
              setSelectedStoryId(null);
            }
          }
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="border-b p-4">
        <h2 className="text-2xl font-bold">Stories</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Story posting form */}
        <div className="max-w-md mx-auto mb-6">
          <StoryPostForm onStoryPostedAction={() => setRefreshKey(k => k + 1)} />
        </div>

        {!stories || stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 pt-10">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-lg">No stories yet</p>
            <p className="text-sm mt-2">Start creating stories to share with your contacts!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story: any) => {
              const storyOwner = users[story.ownerId];
              const displayName = storyOwner?.name || "Anonymous";
              const isOwnStory = story.ownerId === user?.userId;

              return (
                <div
                  key={story._id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden h-40 hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedStoryId(story._id)}
                >
                  {/* Background */}
                  {story.mediaUrl ? (
                    <img
                      src={story.mediaUrl}
                      alt="story"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  )}

                  {/* Overlay with story info */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all flex flex-col justify-between p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {storyOwner?.image && (
                          <img
                            src={storyOwner.image}
                            alt={displayName}
                            className="w-7 h-7 rounded-full object-cover border border-white"
                          />
                        )}
                        <span className="text-white text-sm font-semibold">
                          {isOwnStory ? "Your Story" : displayName}
                        </span>
                      </div>
                    </div>
                    <div>
                      {story.text && (
                        <p className="text-white text-xs line-clamp-2">{story.text}</p>
                      )}
                    </div>
                  </div>

                  {/* View count or New badge */}
                  {isOwnStory && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      👁 {story.viewers?.length || 0}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
