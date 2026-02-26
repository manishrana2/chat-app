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

// Check if email is available
export const checkEmailAvailable = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    if (!args.email) {
      return {
        available: true,
        reason: "Email is optional",
      };
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      return {
        available: false,
        reason: "Invalid email format",
      };
    }

    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email.toLowerCase()))
      .first();

    return {
      available: !existing,
      reason: existing ? "Email already registered" : "",
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

  // Set user online status (login/logout hooks)
  export const setUserOnline = mutation({
    args: { userId: v.id("users"), isOnline: v.boolean() },
    handler: async (ctx, args) => {
      try {
        const updates: any = { isOnline: args.isOnline };
        if (!args.isOnline) updates.lastSeen = Date.now();
        await ctx.db.patch(args.userId, updates);
        return true;
      } catch (e) {
        console.error("Failed to set user online status", e);
        return false;
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

// Request password reset - generates OTP
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

    // Generate 6-digit OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetOtpExpiry = Date.now() + 600000; // 10 minutes expiry

    // Save OTP to user
    await ctx.db.patch(user._id, {
      resetOtp,
      resetOtpExpiry,
    });

    // Attempt to send the OTP via email using SendGrid
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    if (SENDGRID_API_KEY) {
      try {
        const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: args.email }],
              },
            ],
            from: { email: "no-reply@chathub.example.com", name: "ChatHub" },
            subject: "Your ChatHub password reset code",
            content: [
              {
                type: "text/plain",
                value: `Your OTP is ${resetOtp}. It expires in 10 minutes.`,
              },
            ],
          }),
        });
        if (!resp.ok) {
          const body = await resp.text();
          console.error("SendGrid error", resp.status, body);
          throw new Error("Email service returned an error");
        }
      } catch (e) {
        console.error("Failed to send OTP email:", e);
        // communicate failure to client
        throw new Error("Unable to send OTP email, please try again later.");
      }
    } else {
      console.warn("SENDGRID_API_KEY not set; OTP email not sent");
    }

    return {
      message: "OTP sent to your email",
      otp: resetOtp, // Still returned for development if needed
      email: user.email,
    };
  },
});

// Verify OTP for password reset
export const verifyResetOtp = mutation({
  args: { email: v.string(), otp: v.string() },
  handler: async (ctx, args) => {
    if (!args.email || !args.otp) {
      throw new Error("Email and OTP are required");
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if OTP matches
    if (user.resetOtp !== args.otp) {
      throw new Error("Invalid OTP");
    }

    // Check expiry
    const now = Date.now();
    if (user.resetOtpExpiry && user.resetOtpExpiry < now) {
      throw new Error("OTP has expired. Request a new one.");
    }

    return {
      valid: true,
      email: user.email,
      username: user.username,
    };
  },
});

// Reset password with OTP
export const resetPassword = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
    newPassword: v.string(),
    confirmPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.email || !args.otp) {
      throw new Error("Email and OTP are required");
    }

    if (!args.newPassword || args.newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    if (args.newPassword !== args.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if OTP matches
    if (user.resetOtp !== args.otp) {
      throw new Error("Invalid OTP");
    }

    // Check expiry
    const now = Date.now();
    if (user.resetOtpExpiry && user.resetOtpExpiry < now) {
      throw new Error("OTP has expired");
    }

    // Hash new password
    const hashedPassword = await hashPassword(args.newPassword);

    // Update password and clear OTP
    await ctx.db.patch(user._id, {
      password: hashedPassword,
      resetOtp: undefined,
      resetOtpExpiry: undefined,
    });

    return {
      message: "Password reset successfully",
      email: user.email,
    };
  },
});
