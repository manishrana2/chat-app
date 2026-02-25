import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createRequest = mutation({
  args: {
    requesterId: v.string(),
    recipientId: v.string(),
  },
  handler: async (ctx, args) => {
    // avoid duplicate pending requests
    const existing = await ctx.db
      .query("requests")
      .filter((q) => q.eq(q.field("requesterId"), args.requesterId))
      .filter((q) => q.eq(q.field("recipientId"), args.recipientId))
      .first();

    if (existing) return existing._id;

    const id = await ctx.db.insert("requests", {
      requesterId: args.requesterId,
      recipientId: args.recipientId,
      status: "pending",
      createdAt: Date.now(),
    });
    return id;
  },
});

export const acceptRequest = mutation({
  args: {
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, { status: "accepted", updatedAt: Date.now() });
    return true;
  },
});

export const declineRequest = mutation({
  args: {
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, { status: "declined", updatedAt: Date.now() });
    return true;
  },
});

export const getRequestsForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("requests")
      .filter((q) => q.eq(q.field("recipientId"), args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

export const getRequestBetween = query({
  args: { userA: v.string(), userB: v.string() },
  handler: async (ctx, args) => {
    const r = await ctx.db
      .query("requests")
      .filter((q) =>
        q.or(
          q.and(q.eq(q.field("requesterId"), args.userA), q.eq(q.field("recipientId"), args.userB)),
          q.and(q.eq(q.field("requesterId"), args.userB), q.eq(q.field("recipientId"), args.userA))
        )
      )
      .collect();
    return r[0] || null;
  },
});

export const syncContacts = mutation({
  args: { ownerId: v.string(), phones: v.array(v.string()) },
  handler: async (ctx, args) => {
    const results: Record<string, unknown>[] = [];
    for (const phone of args.phones) {
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("phone"), phone))
        .first();
      if (!user) continue;

      // create or accept request between ownerId and user.clerkId
      const existing = await ctx.db
        .query("requests")
        .filter((q) =>
          q.or(
            q.and(q.eq(q.field("requesterId"), args.ownerId), q.eq(q.field("recipientId"), user._id.toString())),
            q.and(q.eq(q.field("requesterId"), user._id.toString()), q.eq(q.field("recipientId"), args.ownerId))
          )
        )
        .collect();

      let req = existing[0];
      if (!req) {
        const id = await ctx.db.insert("requests", {
          requesterId: args.ownerId,
          recipientId: user._id.toString(),
          status: "accepted",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        const newReq = await ctx.db.get(id);
        if (!newReq) throw new Error("Failed to create request");
        req = newReq;
      } else {
        // if exists but not accepted, mark accepted
        if (req.status !== "accepted") {
          await ctx.db.patch(req._id, { status: "accepted", updatedAt: Date.now() });
        }
      }

      // ensure a conversation exists
      const convs = await ctx.db
        .query("conversations")
        .collect();
      let conv = convs.find((c: Record<string, unknown>) => (c.members as string[] || []).includes(args.ownerId) && (c.members as string[] || []).includes(user._id.toString()));
      if (!conv) {
        const cid = await ctx.db.insert("conversations", { members: [args.ownerId, user._id.toString()] });
        const newConv = await ctx.db.get(cid);
        if (!newConv) throw new Error("Failed to create conversation");
        conv = newConv;
      }

      results.push({ phone, userId: user._id.toString(), request: req, conversation: conv });
    }
    return results;
  },
});
