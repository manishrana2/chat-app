import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

// Hash password using bcryptjs (synchronous to avoid setTimeout in mutations)
function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

// Verify password (synchronous)
function verifyPassword(password: string, hashedPassword: string): boolean {
  return bcrypt.compareSync(password, hashedPassword);
}

// Sign up with username and password
export const signupWithPassword = mutation({
  args: {
    username: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.username || args.username.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }

    if (!args.password || args.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    if (!args.name || args.name.length < 2) {
      throw new Error("Name must be at least 2 characters");
    }

    // Check if username already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username.toLowerCase()))
      .first();

    if (existingUser) {
      throw new Error("Username already taken");
    }

    // Check if email already exists (if provided)
    if (args.email) {
      const existingEmail = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

      if (existingEmail) {
        throw new Error("Email already registered");
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(args.password);

    // Create user
    const userId = await ctx.db.insert("users", {
      username: args.username.toLowerCase(),
      name: args.name,
      email: args.email,
      phone: args.phone,
      password: hashedPassword,
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${args.username}`,
      isOnline: true,
    });

    return {
      userId,
      username: args.username.toLowerCase(),
      name: args.name,
      email: args.email,
      message: "Signup successful! Please login.",
    };
  },
});

// Login with username/email and password
export const loginWithPassword = mutation({
  args: {
    identifier: v.string(), // username or email
    password: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.identifier || !args.password) {
      throw new Error("Username/Email and password required");
    }

    // Try to find user by username or email
    const allUsers = await ctx.db.query("users").collect();
    const user = allUsers.find(
      (u: { username?: string; email?: string }) =>
        u.username?.toLowerCase() === args.identifier.toLowerCase() ||
        (u.email && u.email.toLowerCase() === args.identifier.toLowerCase())
    );

    if (!user) {
      throw new Error("User not found. Please check your username/email.");
    }

    // Verify password
    if (!user.password || !(await verifyPassword(args.password, user.password))) {
      throw new Error("Invalid password");
    }

    // Update isOnline status
    await ctx.db.patch(user._id, { isOnline: true });

    return {
      userId: user._id.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
      image: user.image,
      message: "Login successful!",
    };
  },
});

// Check if username is available
export const checkUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username || args.username.length < 3) {
      return {
        available: false,
        reason: "Username must be at least 3 characters",
      };
    }

    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username.toLowerCase()))
      .first();

    return {
      available: !existing,
      reason: existing ? "Username already taken" : "",
    };
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Try to parse as Convex ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = await ctx.db.get(args.userId as any);
      if (!user) return null;

      // Don't send password to client
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user as Record<string, unknown>;
      return safeUser;
    } catch {
      return null;
    }
  },
});

// Logout
export const logout = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = args.userId as any;
      await ctx.db.patch(userId, { isOnline: false });
      return { message: "Logged out successfully" };
    } catch {
      return { message: "Logout failed" };
    }
  },
});

// Request password reset - generates token
export const requestPasswordReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    if (!args.email) {
      throw new Error("Email is required");
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("No account found with this email");
    }

    // Generate reset token (simple: base64 encoded timestamp + random)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const resetToken = Buffer.from(`${timestamp}_${random}`).toString("base64");
    const resetTokenExpiry = timestamp + 3600000; // 1 hour expiry

    // Save reset token to user
    await ctx.db.patch(user._id, {
      resetToken,
      resetTokenExpiry,
    });

    return {
      message: "Password reset token sent",
      resetToken, // In production, send this via email
      email: user.email,
    };
  },
});

// Verify reset token
export const verifyResetToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token) {
      throw new Error("Token is required");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("resetToken"), args.token))
      .first();

    if (!user) {
      throw new Error("Invalid or expired token");
    }

    // Check expiry
    const now = Date.now();
    if (user.resetTokenExpiry && user.resetTokenExpiry < now) {
      throw new Error("Reset token has expired");
    }

    return {
      valid: true,
      email: user.email,
      username: user.username,
    };
  },
});

// Reset password with token
export const resetPassword = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
    confirmPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.token) {
      throw new Error("Token is required");
    }

    if (!args.newPassword || args.newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    if (args.newPassword !== args.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    // Find user by reset token
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("resetToken"), args.token))
      .first();

    if (!user) {
      throw new Error("Invalid or expired token");
    }

    // Check expiry
    const now = Date.now();
    if (user.resetTokenExpiry && user.resetTokenExpiry < now) {
      throw new Error("Reset token has expired");
    }

    // Hash new password
    const hashedPassword = await hashPassword(args.newPassword);

    // Update password and clear reset token
    await ctx.db.patch(user._id, {
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });

    return {
      message: "Password reset successfully",
      email: user.email,
    };
  },
});
