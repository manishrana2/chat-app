import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createConversation = mutation({
  args: {
    members: v.array(v.string()),
  },

  handler: async (ctx, args) => {
    // Try to find an existing conversation that contains both member ids
    const [a, b] = args.members;

    const allConvs = await ctx.db.query("conversations").collect();
    for (const c of allConvs) {
      const m: string[] = c.members || [];
      if (m.includes(a) && m.includes(b)) return c._id;
    }

    return await ctx.db.insert("conversations", {
      members: args.members,
    });
  },
});

export const getConversations = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const allConvs = await ctx.db.query("conversations").collect();
    return allConvs.filter((c) => (c.members || []).includes(args.userId));
  },
});

export const getConversationById = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations"), userId: v.string() },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) {
      throw new Error("Conversation not found");
    }

    const members: string[] = conv.members || [];
    if (!members.includes(args.userId)) {
      throw new Error("You are not a member of this conversation");
    }

    // Delete all messages in this conversation first
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);
    return true;
  },
});