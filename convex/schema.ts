import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
 users: defineTable({
  clerkId: v.optional(v.string()),
  name: v.string(),
  image: v.string(),
  bio: v.optional(v.string()),
  username: v.optional(v.string()), // unique username for login
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  password: v.optional(v.string()), // hashed password for custom auth
  isOnline: v.boolean(),
  friends: v.optional(v.array(v.string())), // list of friend user IDs
  blockedUsers: v.optional(v.array(v.string())), // list of user IDs that this user has blocked/unfriended
  resetToken: v.optional(v.string()), // for password reset
  resetTokenExpiry: v.optional(v.number()), // timestamp when token expires
}).index("by_username", ["username"]).index("by_email", ["email"]).index("by_resetToken", ["resetToken"]),

  conversations: defineTable({
    members: v.array(v.string()),
    lastMessage: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  }),

  calls: defineTable({
    callerId: v.string(),
    calleeId: v.string(),
    offerSdp: v.optional(v.string()),
    answerSdp: v.optional(v.string()),
    callType: v.string(),
    status: v.string(), // pending, answered, ended
    createdAt: v.number(),
  }),

  typing: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    isTyping: v.boolean(),
    updatedAt: v.number(),
  }),

  requests: defineTable({
    requesterId: v.string(),
    recipientId: v.string(),
    status: v.string(), // pending, accepted, declined
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    text: v.optional(v.string()),
    encryptedText: v.optional(v.string()), // for backward compatibility with encrypted messages
    encryptionIv: v.optional(v.string()), // for backward compatibility with encrypted messages
    mediaType: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    isVoice: v.optional(v.boolean()),
    status: v.optional(v.string()),
    deliveredTo: v.optional(v.array(v.string())),
    readBy: v.optional(v.array(v.string())),
    replyTo: v.optional(v.id("messages")),
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
    isPinned: v.optional(v.boolean()),
    isForwarded: v.optional(v.boolean()),
    createdAt: v.number(),
  }),

  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.string(),
    emoji: v.string(),
    createdAt: v.number(),
  }),

  stories: defineTable({
    ownerId: v.string(),
    text: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // epoch ms when story expires (24h default)
    viewers: v.optional(v.array(v.string())), // user ids who viewed
    isPublic: v.optional(v.boolean()), // if true, visible to all users; otherwise to contacts
  }),
});