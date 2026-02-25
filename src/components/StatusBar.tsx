"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

export default function StatusBar() {
  const { user } = useAuth();
  const allUsers = useQuery((api.users as any).getUsers);
  const stories = (api.stories && (api.stories as any).getStoriesForUser) ? useQuery((api.stories as any).getStoriesForUser, user ? { userId: user.userId } : "skip") : null as any;
  const postStory = (api.stories && (api.stories as any).postStory) ? useMutation((api.stories as any).postStory) : null as any;
  const markViewed = (api.stories && (api.stories as any).markStoryViewed) ? useMutation((api.stories as any).markStoryViewed) : null as any;
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileObj, setFileObj] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    // no-op
  }, []);

  const handlePost = async () => {
    if (!user) return;
    let mediaUrl: string | undefined = undefined;
    if (fileObj) {
      mediaUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(fileObj);
      });
    }
    await postStory({ ownerId: user.userId, text: text || undefined, mediaUrl: mediaUrl || undefined });
    setText("");
    setFileObj(null);
    setFilePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleOpen = async (s: any) => {
    if (!user) return;
    try {
      if (!(api.stories && (api.stories as any).markStoryViewed)) return alert('Server functions not available. Run `npx convex dev`.');
      await markViewed({ storyId: s._id, userId: user.userId });
      // open preview — for now, just alert or could open modal
      if (s.mediaUrl) {
        window.open(s.mediaUrl, "_blank");
      } else if (s.text) {
        alert(s.text);
      }
    } catch (e) {}
  };

  const safeStories = stories || [];

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="font-semibold">Status</div>
        <div className="text-xs text-muted">Stories (24h)</div>
      </div>

      <div className="flex gap-3 items-center overflow-x-auto py-2">
        {user && (
          <div className="flex flex-col items-center w-16">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
            >
              +
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFileObj(f);
                if (!f) {
                  setFilePreview(null);
                  return;
                }
                const r = new FileReader();
                r.onload = () => setFilePreview(String(r.result));
                r.readAsDataURL(f);
              }}
            />
          </div>
        )}

        {safeStories.map((s: any) => {
          const ownerUser = allUsers?.find((u: any) => u.clerkId === s.ownerId);
          const ownerName = ownerUser?.name || 'Story';
          return (
            <div key={s._id} className="flex flex-col items-center w-16 cursor-pointer" onClick={() => handleOpen(s)}>
              <div className={`w-12 h-12 rounded-full overflow-hidden border ${s.viewers && user && s.viewers.includes(user.userId) ? 'border-gray-300' : 'border-green-400'}`}>
                {s.mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.mediaUrl} alt={s.text || 'status'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm">{s.text ? s.text.slice(0,2) : 'S'}</div>
                )}
              </div>
              <div className="text-xs mt-1 truncate w-16 text-center">{ownerName}</div>
            </div>
          );
        })}
      </div>

      {(filePreview || text) && (
        <div className="mt-2">
          {filePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={filePreview} className="max-w-full rounded mb-2" alt="preview" />
          )}

          <input value={text} onChange={(e) => setText(e.target.value)} className="w-full border rounded px-2 py-1 mb-2" placeholder="Write a caption (optional)" />
          <div className="flex gap-2">
            <button onClick={handlePost} className="px-3 py-1 bg-blue-500 text-white rounded">Post</button>
            <button onClick={() => { setText(''); setFileObj(null); setFilePreview(null); if (fileRef.current) fileRef.current.value = ''; }} className="px-3 py-1 bg-gray-100 rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
