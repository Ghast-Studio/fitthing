import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { workoutProgressValidator } from "./schema";

// Helper function to check if a user can view a workout
async function canViewWorkout(
  ctx: any,
  workoutUserId: string,
  visibility: "private" | "friends" | "public",
  viewerId: string | undefined
): Promise<boolean> {
  // Owner can always view
  if (viewerId === workoutUserId) {
    return true;
  }

  // Public workouts can be viewed by anyone
  if (visibility === "public") {
    return true;
  }

  // Private workouts can only be viewed by owner (already checked above)
  if (visibility === "private") {
    return false;
  }

  // Friends visibility: check if users are friends
  if (visibility === "friends" && viewerId) {
    // Check if friendship exists in either direction
    const asRequester = await ctx.db
      .query("friends")
      .withIndex("by_requesterId_recipientId", (q: any) =>
        q.eq("requesterId", viewerId).eq("recipientId", workoutUserId)
      )
      .first();

    if (asRequester && asRequester.status === "accepted") {
      return true;
    }

    const asRecipient = await ctx.db
      .query("friends")
      .withIndex("by_requesterId_recipientId", (q: any) =>
        q.eq("requesterId", workoutUserId).eq("recipientId", viewerId)
      )
      .first();

    if (asRecipient && asRecipient.status === "accepted") {
      return true;
    }
  }

  return false;
}

export const start = mutation({
  args: {
    routineId: v.optional(v.id("routines")),
    visibility: v.optional(
      v.union(v.literal("private"), v.literal("friends"), v.literal("public"))
    ),
    initialProgress: v.optional(workoutProgressValidator),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // If routineId is provided, use the routine's visibility
    let workoutVisibility: "private" | "friends" | "public" =
      args.visibility ?? "private";
    if (args.routineId) {
      const routine = await ctx.db.get(args.routineId);
      if (routine) {
        workoutVisibility = routine.visibility;
      }
    }

    const now = Date.now();
    const progress = args.initialProgress ?? {
      sets: [],
      startedAt: now,
      lastUpdatedAt: now,
    };

    // Ensure timestamps are set
    if (!progress.startedAt) progress.startedAt = now;
    if (!progress.lastUpdatedAt) progress.lastUpdatedAt = now;

    const workoutId = await ctx.db.insert("workoutSessions", {
      userId: identity.subject,
      routineId: args.routineId,
      status: "active",
      visibility: workoutVisibility,
      state: progress,
      startedAt: now,
      lastHeartbeat: now,
    });

    return {
      workoutId,
      status: "active",
    };
  },
});

export const saveProgress = mutation({
  args: {
    workoutId: v.id("workoutSessions"),
    progress: workoutProgressValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.workoutId);
    if (!session || session.userId !== identity.subject) {
      throw new Error("Workout not found");
    }

    if (session.status !== "active") {
      throw new Error("Workout is not active");
    }

    const now = Date.now();
    const progress = {
      ...args.progress,
      lastUpdatedAt: now,
    };

    await ctx.db.patch(args.workoutId, {
      state: progress,
      lastHeartbeat: now,
    });

    return { ok: true };
  },
});

export const complete = mutation({
  args: {
    workoutId: v.id("workoutSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.workoutId);
    if (!session || session.userId !== identity.subject) {
      throw new Error("Workout not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.workoutId, {
      status: "completed",
      endedAt: now,
      lastHeartbeat: now,
    });

    return { ok: true };
  },
});

export const cancel = mutation({
  args: {
    workoutId: v.id("workoutSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.workoutId);
    if (!session || session.userId !== identity.subject) {
      throw new Error("Workout not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.workoutId, {
      status: "cancelled",
      endedAt: now,
      lastHeartbeat: now,
    });

    return { ok: true };
  },
});

export const getById = query({
  args: { workoutId: v.id("workoutSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const session = await ctx.db.get(args.workoutId);
    if (!session) {
      return null;
    }

    // Check if viewer can access this workout
    const canView = await canViewWorkout(
      ctx,
      session.userId,
      session.visibility,
      identity?.subject
    );

    if (!canView) {
      return null;
    }

    return session;
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const activeWorkout = await ctx.db
      .query("workoutSessions")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", identity.subject).eq("status", "active")
      )
      .first();

    return activeWorkout;
  },
});

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const workouts = await ctx.db
      .query("workoutSessions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(args.limit ?? 10);

    return workouts;
  },
});

export const history = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("archived")
      )
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("workoutSessions")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    let workoutsQuery = ctx.db
      .query("workoutSessions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc");

    const workouts = await workoutsQuery.take(args.limit ?? 20);

    const filtered = args.status
      ? workouts.filter((w) => w.status === args.status)
      : workouts;

    return {
      workouts: filtered,
      hasMore: workouts.length === (args.limit ?? 20),
    };
  },
});

export const follow = query({
  args: { workoutId: v.id("workoutSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.workoutId);

    if (!session) {
      throw new Error("Workout not found");
    }

    const identity = await ctx.auth.getUserIdentity();

    // Check if viewer can access this workout
    const canView = await canViewWorkout(
      ctx,
      session.userId,
      session.visibility,
      identity?.subject
    );

    if (!canView) {
      throw new Error("Workout not found");
    }

    return {
      visibility: session.visibility,
      status: session.status,
      state: session.state,
    };
  },
});

// Get active workouts from friends (visibility: 'friends' or 'public')
export const getActiveForFriends = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUserId = identity.subject;

    // Get all accepted friends
    const asRequester = await ctx.db
      .query("friends")
      .withIndex("by_requesterId_status", (q) =>
        q.eq("requesterId", currentUserId).eq("status", "accepted")
      )
      .collect();

    const asRecipient = await ctx.db
      .query("friends")
      .withIndex("by_recipientId_status", (q) =>
        q.eq("recipientId", currentUserId).eq("status", "accepted")
      )
      .collect();

    // Collect all friend user IDs
    const friendIds = new Set<string>();
    for (const friend of asRequester) {
      friendIds.add(friend.recipientId);
    }
    for (const friend of asRecipient) {
      friendIds.add(friend.requesterId);
    }

    // Get active workouts from friends with 'friends' or 'public' visibility
    const workouts = [];
    for (const friendId of friendIds) {
      const friendWorkouts = await ctx.db
        .query("workoutSessions")
        .withIndex("by_userId_status", (q) =>
          q.eq("userId", friendId).eq("status", "active")
        )
        .collect();

      for (const workout of friendWorkouts) {
        if (
          workout.visibility === "friends" ||
          workout.visibility === "public"
        ) {
          workouts.push(workout);
        }
      }
    }

    return workouts;
  },
});

// Get all active public workouts
export const getActivePublic = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get all active public workouts
    const allActive = await ctx.db
      .query("workoutSessions")
      .withIndex("by_status_visibility", (q) =>
        q.eq("status", "active").eq("visibility", "public")
      )
      .order("desc")
      .collect();

    return allActive;
  },
});

// Get all workouts user can spectate (friends' workouts with 'friends' visibility + all public workouts)
export const getSpectatableWorkouts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUserId = identity.subject;

    // Get all accepted friends
    const asRequester = await ctx.db
      .query("friends")
      .withIndex("by_requesterId_status", (q) =>
        q.eq("requesterId", currentUserId).eq("status", "accepted")
      )
      .collect();

    const asRecipient = await ctx.db
      .query("friends")
      .withIndex("by_recipientId_status", (q) =>
        q.eq("recipientId", currentUserId).eq("status", "accepted")
      )
      .collect();

    // Collect all friend user IDs
    const friendIds = new Set<string>();
    for (const friend of asRequester) {
      friendIds.add(friend.recipientId);
    }
    for (const friend of asRecipient) {
      friendIds.add(friend.requesterId);
    }

    // Get active workouts from friends with 'friends' visibility
    const friendWorkouts = [];
    for (const friendId of friendIds) {
      const workouts = await ctx.db
        .query("workoutSessions")
        .withIndex("by_userId_status", (q) =>
          q.eq("userId", friendId).eq("status", "active")
        )
        .collect();

      for (const workout of workouts) {
        if (workout.visibility === "friends") {
          friendWorkouts.push(workout);
        }
      }
    }

    // Get all active public workouts (excluding own workouts)
    const publicWorkouts = await ctx.db
      .query("workoutSessions")
      .withIndex("by_status_visibility", (q) =>
        q.eq("status", "active").eq("visibility", "public")
      )
      .filter((q) => q.neq(q.field("userId"), currentUserId))
      .order("desc")
      .collect();

    // Combine and return
    return [...friendWorkouts, ...publicWorkouts];
  },
});
