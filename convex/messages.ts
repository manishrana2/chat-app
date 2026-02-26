import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    text: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    isVoice: v.optional(v.boolean()),
    replyTo: v.optional(v.id("messages")),
    encryptedText: v.optional(v.string()),
    encryptionIv: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authorization: ensure sender is a member of the conversation
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");
    const members: string[] = conv.members || [];
    if (!members.includes(args.senderId)) {
      throw new Error("Sender is not a member of the conversation");
    }

    const msgId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      text: args.text || "",
      mediaType: args.mediaType,
      mediaUrl: args.mediaUrl,
      isVoice: args.isVoice,
      replyTo: args.replyTo,
      encryptedText: args.encryptedText,
      encryptionIv: args.encryptionIv,
      status: "sent",
      deliveredTo: [],
      readBy: [],
      createdAt: Date.now(),
    });

    try {
      // Update conversation lastMessage and updatedAt
      const lastMessage = args.text || (args.mediaType ? `[${args.mediaType}]` : "");

      await ctx.db.patch(args.conversationId, {
        lastMessage,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.error("Failed to update conversation after message:", e);
    }

    return msgId;
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    requesterId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authorization: ensure requester is a member of the conversation
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");
    const members: string[] = conv.members || [];
    if (!members.includes(args.requesterId)) {
      throw new Error("Not authorized to view messages for this conversation");
    }

    const q = ctx.db.query("messages").filter((q2) => q2.eq(q2.field("conversationId"), args.conversationId));
    // simple ordering: collect and sort; for scale use index/ordering API when available
    const msgs = await q.collect();

    // sort by creation time ascending and optionally limit
    const sorted = msgs.sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.createdAt as number || 0) - (b.createdAt as number || 0));
    if (args.limit) return sorted.slice(-args.limit);
    return sorted;
  },
});

export const markMessageDelivered = mutation({
  args: { messageId: v.id("messages"), userId: v.string() },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) return null;
    const delivered: string[] = msg.deliveredTo || [];
    if (!delivered.includes(args.userId)) {
      delivered.push(args.userId);
      await ctx.db.patch(args.messageId, { deliveredTo: delivered });
    }
    // update status to delivered if at least one recipient has it
    if (msg.status !== "read") {
      await ctx.db.patch(args.messageId, { status: "delivered" });
    }
    return true;
  },
});

export const markMessageRead = mutation({
  args: { messageId: v.id("messages"), userId: v.string() },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) return null;
    const readBy: string[] = msg.readBy || [];
    if (!readBy.includes(args.userId)) {
      readBy.push(args.userId);
      await ctx.db.patch(args.messageId, { readBy });
    }
    // mark status as read
    await ctx.db.patch(args.messageId, { status: "read" });
    return true;
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    senderId: v.string(),
    text: v.optional(v.string()),
    encryptedText: v.optional(v.string()),
    encryptionIv: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");
    // only sender can edit their own messages
    if (msg.senderId !== args.senderId) {
      throw new Error("Not authorized to edit this message");
    }
    // cannot edit deleted messages
    if (msg.deletedAt) {
      throw new Error("Cannot edit a deleted message");
    }
    await ctx.db.patch(args.messageId, {
      text: args.text,
      encryptedText: args.encryptedText,
      encryptionIv: args.encryptionIv,
      editedAt: Date.now(),
    });
    return true;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    senderId: v.string(),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");
    // only sender can delete their own messages
    if (msg.senderId !== args.senderId) {
      throw new Error("Not authorized to delete this message");
    }
    // mark as deleted (soft delete) so replies still reference it
    await ctx.db.patch(args.messageId, {
      deletedAt: Date.now(),
      text: "[deleted]", // placeholder text
    });
    return true;
  },
});

export const searchMessages = query({
  args: {
    conversationId: v.id("conversations"),
    query: v.string(),
    requesterId: v.string(),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");
    const members: string[] = conv.members || [];
    if (!members.includes(args.requesterId)) {
      throw new Error("Not authorized to search in this conversation");
    }

    const q = args.query.toLowerCase();
    const msgs = await ctx.db
      .query("messages")
      .filter((filter) => filter.eq(filter.field("conversationId"), args.conversationId))
      .collect();

    // simple text search (filter locally)
    const results = msgs.filter((msg: Record<string, unknown>) => {
      const text = (msg.text as string || "").toLowerCase();
      return text.includes(q);
    });

    // return sorted by creation time descending (most recent first)
    return results.sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.createdAt as number || 0) - (a.createdAt as number || 0));
  },
});

// Emoji reactions
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");
    
    // Check if reaction already exists
    const existingReaction = await ctx.db
      .query("reactions")
      .filter((q) => q.and(
        q.eq(q.field("messageId"), args.messageId),
        q.eq(q.field("userId"), args.userId),
        q.eq(q.field("emoji"), args.emoji)
      ))
      .first();
    
    if (existingReaction) return existingReaction._id; // already reacted
    
    const reactionId = await ctx.db.insert("reactions", {
      messageId: args.messageId,
      userId: args.userId,
      emoji: args.emoji,
      createdAt: Date.now(),
    });
    return reactionId;
  },
});

export const removeReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const reaction = await ctx.db
      .query("reactions")
      .filter((q) => q.and(
        q.eq(q.field("messageId"), args.messageId),
        q.eq(q.field("userId"), args.userId),
        q.eq(q.field("emoji"), args.emoji)
      ))
      .first();
    
    if (reaction) {
      await ctx.db.delete(reaction._id);
    }
    return true;
  },
});

export const getReactionsForMessage = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .filter((q) => q.eq(q.field("messageId"), args.messageId))
      .collect();
    
    // group reactions by emoji
    const grouped: { [key: string]: { emoji: string; count: number; userIds: string[] } } = {};
    reactions.forEach((r: Record<string, unknown>) => {
      const emoji = r.emoji as string;
      if (!grouped[emoji]) {
        grouped[emoji] = { emoji, count: 0, userIds: [] };
      }
      grouped[emoji].count++;
      grouped[emoji].userIds.push(r.userId as string);
    });
    
    return Object.values(grouped);
  },
});

export const getReactionsForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // collect messages for conversation
    const msgs = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();

    const messageIds = msgs.map((m: any) => m._id);

    // collect reactions for message ids (build OR filters)
    let reactions: any[] = [];
    if (messageIds.length === 0) {
      reactions = [];
    } else {
      // build a filter that ORs equality checks for each messageId
      const q0 = ctx.db.query("reactions");
      let builder = q0.filter((f) => f.eq(f.field("messageId"), messageIds[0]));
      for (let i = 1; i < messageIds.length; i++) {
        const id = messageIds[i];
        builder = builder.filter((f) => f.or(f.eq(f.field("messageId"), id), f.eq(f.field("messageId"), id)));
      }
      reactions = await builder.collect();
    }

    const groupedByMessage: Record<string, any[]> = {};
    reactions.forEach((r: any) => {
      const msgId = String(r.messageId);
      if (!groupedByMessage[msgId]) groupedByMessage[msgId] = [];
      groupedByMessage[msgId].push(r);
    });

    // reduce to a compact structure per message
    const result: Record<string, any> = {};
    Object.keys(groupedByMessage).forEach((mid) => {
      const arr = groupedByMessage[mid];
      const grouped: Record<string, { emoji: string; count: number; userIds: string[] }> = {};
      arr.forEach((r: any) => {
        const emoji = r.emoji;
        if (!grouped[emoji]) grouped[emoji] = { emoji, count: 0, userIds: [] };
        grouped[emoji].count++;
        grouped[emoji].userIds.push(r.userId);
      });
      result[mid] = Object.values(grouped);
    });

    return result;
  },
});

// Message pinning
export const pinMessage = mutation({
  args: {
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");
    
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");
    const members: string[] = conv.members || [];
    if (!members.includes(args.userId)) {
      throw new Error("Not authorized");
    }
    
    await ctx.db.patch(args.messageId, { isPinned: true });
    return true;
  },
});

export const unpinMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");
    
    await ctx.db.patch(args.messageId, { isPinned: false });
    return true;
  },
});

// Purge expired / disappearing messages (can be run by a scheduler)
export const purgeExpiredMessages = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("messages")
      .filter((q) => q.neq(q.field("expiresAt"), null))
      .collect();

    const toDelete = expired.filter((m: any) => m.expiresAt && m.expiresAt <= now);
    for (const m of toDelete) {
      try {
        await ctx.db.delete(m._id);
      } catch (e) {
        console.error("Failed to delete expired message", m._id, e);
      }
    }
    return toDelete.length;
  },
});

export const getPinnedMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const msgs = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();
    
    return msgs.filter((m: Record<string, unknown>) => m.isPinned).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.createdAt as number || 0) - (a.createdAt as number || 0));
  },
});

// Message forwarding
export const forwardMessage = mutation({
  args: {
    messageId: v.id("messages"),
    targetConversationId: v.id("conversations"),
    senderId: v.string(),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");
    
    const targetConv = await ctx.db.get(args.targetConversationId);
    if (!targetConv) throw new Error("Target conversation not found");
    const members: string[] = targetConv.members || [];
    if (!members.includes(args.senderId)) {
      throw new Error("Not a member of target conversation");
    }
    
    // Create forwarded message with reference to original
    const forwardedMsgId = await ctx.db.insert("messages", {
      conversationId: args.targetConversationId,
      senderId: args.senderId,
      text: msg.text ? `[Forwarded] ${msg.text}` : "[Forwarded message]",
      mediaType: msg.mediaType,
      mediaUrl: msg.mediaUrl,
      encryptedText: msg.encryptedText,
      encryptionIv: msg.encryptionIv,
      status: "sent",
      deliveredTo: [],
      readBy: [],
      createdAt: Date.now(),
      isForwarded: true,
    });
    
    return forwardedMsgId;
  },
});

// Message replies
export const replyToMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    text: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    replyTo: v.id("messages"),
    encryptedText: v.optional(v.string()),
    encryptionIv: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");
    const members: string[] = conv.members || [];
    if (!members.includes(args.senderId)) {
      throw new Error("Sender is not a member of the conversation");
    }
    
    const originalMsg = await ctx.db.get(args.replyTo);
    if (!originalMsg) throw new Error("Original message not found");
    
    const msgId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      text: args.text || "",
      mediaType: args.mediaType,
      mediaUrl: args.mediaUrl,
      replyTo: args.replyTo,
      encryptedText: args.encryptedText,
      encryptionIv: args.encryptionIv,
      status: "sent",
      deliveredTo: [],
      readBy: [],
      createdAt: Date.now(),
    });
    
    // update conversation
    try {
      await ctx.db.patch(args.conversationId, {
        lastMessage: args.text || (args.mediaType ? `[${args.mediaType}]` : ""),
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.error("Failed to update conversation:", e);
    }
    
    return msgId;
  },
});