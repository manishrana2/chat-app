import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveUser = mutation({
  args: {
    clerkId: v.optional(v.string()),
    name: v.string(),
    image: v.string(),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.clerkId) {
      // For custom auth, we don't need clerkId
      return null;
    }

    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      image: args.image,
      username: args.username || `user_${Math.random().toString(36).substr(2, 9)}`,
      email: args.email,
      phone: args.phone,
      isOnline: true,
    });
  },
});

export const getUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

export const getUserByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("phone"), args.phone))
      .first();
  },
});

// Search users by username (Instagram-like)
export const searchUsersByUsername = query({
  args: { username: v.string(), requesterId: v.string() },
  handler: async (ctx, args) => {
    if (!args.username.trim()) return [];
    
    const searchTerm = args.username.toLowerCase();
    const allUsers = await ctx.db.query("users").collect();
    
    // Filter by username (case-insensitive partial match) and exclude requester
    return allUsers.filter((user: Record<string, unknown>) => {
      if (!user.username) return false;
      const userId = (user._id || "").toString();
      if (userId === args.requesterId) return false; // Don't search for yourself
      return (user.username as string).toLowerCase().includes(searchTerm);
    });
  },
});

// Get user by exact username
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    return allUsers.find((user: Record<string, unknown>) => 
      user.username && (user.username as string).toLowerCase() === args.username.toLowerCase()
    ) || null;
  },
});

// Check if username is available
export const checkUsernameAvailable = query({
  args: { username: v.string(), excludeClerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.username.trim() || args.username.length < 3) {
      return { available: false, reason: "Username must be at least 3 characters" };
    }
    
    const allUsers = await ctx.db.query("users").collect();
    
    // Find the user to exclude (if any)
    const excludeUserId = args.excludeClerkId 
      ? allUsers.find((u: Record<string, unknown>) => u.clerkId === args.excludeClerkId)?._id
      : null;
    
    const exists = allUsers.some((user: Record<string, unknown>) => {
      const userId = (user._id || "").toString();
      if (excludeUserId && userId === (excludeUserId || "").toString()) return false;
      return user.username && (user.username as string).toLowerCase() === args.username.toLowerCase();
    });
    
    if (exists) {
      return { available: false, reason: "Username already taken" };
    }
    
    return { available: true };
  },
});

// Set or update username
export const setUsername = mutation({
  args: { clerkId: v.string(), username: v.string() },
  handler: async (ctx, args) => {
    if (!args.clerkId || !args.clerkId.trim()) {
      throw new Error("User ID required");
    }

    if (!args.username.trim() || args.username.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }
    
    // Find user by clerkId
    const currentUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();
    
    if (!currentUser) {
      throw new Error("User not found in database");
    }
    
    // Check if username already taken
    const allUsers = await ctx.db.query("users").collect();
    const exists = allUsers.some((user: Record<string, unknown>) => {
      const userId = (user._id || "").toString();
      const currentUserId = (currentUser._id || "").toString();
      if (userId === currentUserId) return false; // Allow same user to update
      return user.username && (user.username as string).toLowerCase() === args.username.toLowerCase();
    });
    
    if (exists) {
      throw new Error("Username already taken");
    }
    
    // Username format: alphanumeric, underscore, dot (Instagram-like)
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(args.username)) {
      throw new Error("Username can only contain letters, numbers, dots, and underscores");
    }
    
    await ctx.db.patch(currentUser._id, {
      username: args.username.toLowerCase(),
    });
    
    return true;
  },
});

export const unfriendUser = mutation({
  args: { userId: v.string(), targetUserId: v.string() },
  handler: async (ctx, args) => {
    // userId is the Convex document ID
    const user = await ctx.db.get(args.userId as any);

    if (!user || !("blockedUsers" in user)) {
      throw new Error("User not found");
    }

    const blockedUsers: string[] = (user as any).blockedUsers || [];
    if (!blockedUsers.includes(args.targetUserId)) {
      blockedUsers.push(args.targetUserId);
      await ctx.db.patch(args.userId as any, { blockedUsers });
    }

    return true;
  },
});

export const getBlockedUsers = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // userId is the Convex document ID
    const user = await ctx.db.get(args.userId as any);

    if (!user || !("blockedUsers" in user)) {
      return [];
    }

    return (user as any).blockedUsers || [];
  },
});