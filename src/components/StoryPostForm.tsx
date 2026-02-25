"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

type StoryPostFormProps = {
  onStoryPostedAction?: () => void;
};

export default function StoryPostForm({ onStoryPostedAction }: StoryPostFormProps) {
  const { user } = useAuth();
  const [storyText, setStoryText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const postStory = useMutation((api.stories as any)?.postStory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!storyText && !mediaUrl)) {
      alert("Please add text or an image for your story");
      return;
    }

    setIsLoading(true);
    try {
      await postStory({
        ownerId: user.userId,
        text: storyText || undefined,
        mediaUrl: mediaUrl || undefined,
        isPublic,
      });

      setStoryText("");
      setMediaUrl("");
      setIsPublic(false);
      setShowForm(false);
      onStoryPostedAction?.();
    } catch (err) {
      console.error("Failed to post story:", err);
      alert("Failed to post story");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-shadow"
      >
        + Create Story
      </button>
    );
  }

  return (
    <div className="bg-gray-50 border rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-4">Create Story</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Story text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Story Text
          </label>
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* Media URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL (Optional)
          </label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {mediaUrl && (
            <img
              src={mediaUrl}
              alt="preview"
              className="mt-2 w-full max-h-40 object-cover rounded"
            />
          )}
        </div>

        {/* Public toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="isPublic" className="text-sm text-gray-700">
            Make story public (visible to all users)
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading || (!storyText && !mediaUrl)}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Posting..." : "Post Story"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setStoryText("");
              setMediaUrl("");
              setIsPublic(false);
            }}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
