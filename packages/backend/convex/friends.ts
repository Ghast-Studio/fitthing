import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Get friends for a user (both as requester and recipient)
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Query friendships where user is the requester
    const asRequester = await ctx.db
      .query("friends")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", args.userId))
      .collect();

    // Query friendships where user is the recipient
    const asRecipient = await ctx.db
      .query("friends")
      .withIndex("by_recipientId", (q) => q.eq("recipientId", args.userId))
      .collect();

    // Combine and deduplicate by _id
    const friendMap = new Map<string, (typeof asRequester)[0]>();

    for (const friend of asRequester) {
      friendMap.set(friend._id, friend);
    }

    for (const friend of asRecipient) {
      friendMap.set(friend._id, friend);
    }

    return Array.from(friendMap.values());
  },
});

// Get friend requests received by a user
export const getRequests = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("friends")
      .withIndex("by_recipientId_status", (q) =>
        q.eq("recipientId", args.userId).eq("status", "pending")
      )
      .collect();

    return requests;
  },
});

// Send friend request (with uniqueness and self-friend validation)
export const sendRequest = mutation({
  args: {
    recipientId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const requesterId = identity.subject;

    // Validate: reject self-friending
    if (requesterId === args.recipientId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Enforce uniqueness: check if friendship already exists
    const existing = await ctx.db
      .query("friends")
      .withIndex("by_requesterId_recipientId", (q) =>
        q.eq("requesterId", requesterId).eq("recipientId", args.recipientId)
      )
      .first();

    if (existing) {
      throw new Error(
        `Friendship already exists between ${requesterId} and ${args.recipientId}`
      );
    }

    // Check reverse direction (if bidirectional storage is used)
    const reverse = await ctx.db
      .query("friends")
      .withIndex("by_requesterId_recipientId", (q) =>
        q.eq("requesterId", args.recipientId).eq("recipientId", requesterId)
      )
      .first();

    if (reverse) {
      throw new Error(
        `Friendship already exists between ${args.recipientId} and ${requesterId}`
      );
    }

    const now = Date.now();
    const friendId = await ctx.db.insert("friends", {
      requesterId,
      recipientId: args.recipientId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(friendId);
  },
});

// Accept friend request
export const acceptRequest = mutation({
  args: {
    friendId: v.id("friends"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const friend = await ctx.db.get(args.friendId);
    if (!friend) {
      throw new Error("Friend request not found");
    }

    // Only recipient can accept
    if (friend.recipientId !== identity.subject) {
      throw new Error("Unauthorized: only recipient can accept request");
    }

    if (friend.status !== "pending") {
      throw new Error("Friend request is not pending");
    }

    await ctx.db.patch(args.friendId, {
      status: "accepted",
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.friendId);
  },
});

// Reject or remove friend
export const remove = mutation({
  args: {
    friendId: v.id("friends"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const friend = await ctx.db.get(args.friendId);
    if (!friend) {
      throw new Error("Friend relationship not found");
    }

    // Only requester or recipient can remove
    if (
      friend.requesterId !== identity.subject &&
      friend.recipientId !== identity.subject
    ) {
      throw new Error("Unauthorized: only participants can remove friendship");
    }

    await ctx.db.delete(args.friendId);
    return { success: true };
  },
});

// Block user
export const block = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const requesterId = identity.subject;

    // Validate: reject self-blocking
    if (requesterId === args.userId) {
      throw new Error("Cannot block yourself");
    }

    // Check if relationship exists (caller as requester)
    const existing = await ctx.db
      .query("friends")
      .withIndex("by_requesterId_recipientId", (q) =>
        q.eq("requesterId", requesterId).eq("recipientId", args.userId)
      )
      .first();

    // Check reverse direction (caller as recipient)
    const reverse = await ctx.db
      .query("friends")
      .withIndex("by_requesterId_recipientId", (q) =>
        q.eq("requesterId", args.userId).eq("recipientId", requesterId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing relationship to blocked
      await ctx.db.patch(existing._id, {
        status: "blocked",
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    } else if (reverse) {
      // Update reverse relationship to blocked
      await ctx.db.patch(reverse._id, {
        status: "blocked",
        updatedAt: now,
      });
      return await ctx.db.get(reverse._id);
    } else {
      // Create new blocked relationship
      const friendId = await ctx.db.insert("friends", {
        requesterId,
        recipientId: args.userId,
        status: "blocked",
        createdAt: now,
        updatedAt: now,
      });
      return await ctx.db.get(friendId);
    }
  },
});
