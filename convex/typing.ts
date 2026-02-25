import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    // find existing typing record for this conversation+user
    const existing = await ctx.db
      .query("typing")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const id = await ctx.db.insert("typing", {
      conversationId: args.conversationId,
      userId: args.userId,
      isTyping: args.isTyping,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const getTypingForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("typing")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();
  },
});
