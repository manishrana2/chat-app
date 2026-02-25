import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const postStory = mutation({
  args: {
    ownerId: v.string(),
    text: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    const expiresAt = args.expiresAt || createdAt + 24 * 60 * 60 * 1000; // 24 hours default
    const storyId = await ctx.db.insert("stories", {
      ownerId: args.ownerId,
      text: args.text,
      mediaUrl: args.mediaUrl,
      createdAt,
      expiresAt,
      viewers: [],
      isPublic: args.isPublic || false,
    });
    return storyId;
  },
});

export const getStoriesForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    // fetch user's conversations to determine contacts
    const convs = await ctx.db.query("conversations").collect();
    const contacts = new Set<string>();
    for (const c of convs) {
      const m: string[] = c.members || [];
      if (m.includes(args.userId)) {
        for (const mm of m) {
          if (mm !== args.userId) contacts.add(mm);
        }
      }
    }

    // fetch stories not expired and that are either public or from contacts
    const all = await ctx.db.query("stories").collect();
    return all.filter((s: Record<string, unknown>) => {
      if (!s || !s.createdAt) return false;
      if ((s.expiresAt as number || 0) <= now) return false;
      if (s.isPublic) return true;
      return contacts.has(s.ownerId as string) || s.ownerId === args.userId;
    });
  },
});

export const markStoryViewed = mutation({
  args: { storyId: v.id("stories"), userId: v.string() },
  handler: async (ctx, args) => {
    const s = await ctx.db.get(args.storyId);
    if (!s) return null;
    const viewers: string[] = s.viewers || [];
    if (!viewers.includes(args.userId)) {
      viewers.push(args.userId);
      await ctx.db.patch(args.storyId, { viewers });
    }
    return true;
  },
});
