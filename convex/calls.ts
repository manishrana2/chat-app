import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createCallOffer = mutation({
  args: {
    callerId: v.string(),
    calleeId: v.string(),
    offerSdp: v.string(),
    callType: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("calls", {
      callerId: args.callerId,
      calleeId: args.calleeId,
      offerSdp: args.offerSdp,
      callType: args.callType,
      status: "pending",
      createdAt: Date.now(),
    });
    return id;
  },
});

export const answerCall = mutation({
  args: {
    callId: v.id("calls"),
    answerSdp: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.callId, {
      answerSdp: args.answerSdp,
      status: "answered",
    });
    return true;
  },
});

export const endCall = mutation({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.callId, { status: "ended" });
    return true;
  },
});

export const getIncomingCalls = query({
  args: { calleeId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calls")
      .filter((q) => q.eq(q.field("calleeId"), args.calleeId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

export const getCallById = query({
  args: { callId: v.optional(v.id("calls")) },
  handler: async (ctx, args) => {
    if (!args.callId) return null;
    return await ctx.db.get(args.callId);
  },
});
