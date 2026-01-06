import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Get user profile by userId
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return profile;
  },
});

// Get user profile with Clerk public info
// Note: This returns the profile. Use getClerkPublicInfo action to fetch Clerk data
export const getProfileWithClerkInfo = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      return null;
    }

    // Return profile - Clerk info should be fetched separately using getClerkPublicInfo action
    // since queries cannot call external APIs
    return {
      profile,
      clerkInfo: null, // Will be populated by client using getClerkPublicInfo action
    };
  },
});

// Check if user needs onboarding
export const needsOnboarding = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const userId = identity.subject;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return !profile || !profile.onboardingCompleted;
  },
});

// Get all user IDs for search (returns userIds that match search term)
// Note: Actual name/email matching should be done client-side with Clerk data
export const searchUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const currentUserId = identity?.subject;

    const limit = args.limit ?? 50;

    // Get all profiles excluding current user
    const allProfiles = await ctx.db
      .query("userProfiles")
      .filter((q) => {
        if (currentUserId) {
          return q.neq(q.field("userId"), currentUserId);
        }
        return true;
      })
      .collect();

    // Return userIds for client to match with Clerk data
    return allProfiles.slice(0, limit).map((profile) => profile.userId);
  },
});

// Automatic onboarding - creates profile on first sign-in
export const createOnboarding = mutation({
  args: {
    bio: v.optional(v.string()),
    level: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("expert"),
        v.null()
      )
    ),
    units: v.optional(v.union(v.literal("metric"), v.literal("imperial"))),
    goals: v.optional(v.array(v.string())),
    preferredWorkoutTime: v.optional(
      v.union(
        v.literal("morning"),
        v.literal("afternoon"),
        v.literal("evening"),
        v.literal("anytime"),
        v.null()
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const userId = identity.subject;

    // Check if profile already exists
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update existing profile with onboarding data
      const now = Date.now();
      await ctx.db.patch(existing._id, {
        bio: args.bio ?? existing.bio,
        level: args.level ?? existing.level,
        units: args.units ?? existing.units,
        goals: args.goals ?? existing.goals,
        preferredWorkoutTime:
          args.preferredWorkoutTime ?? existing.preferredWorkoutTime,
        onboardingCompleted: true,
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    }

    // Create new profile
    const now = Date.now();
    const profileId = await ctx.db.insert("userProfiles", {
      userId: userId,
      bio: args.bio,
      totalWorkouts: 0,
      totalWorkoutTime: 0,
      level: args.level ?? null,
      onboardingCompleted: true,
      units: args.units ?? "metric",
      goals: args.goals,
      preferredWorkoutTime: args.preferredWorkoutTime ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(profileId);
  },
});

// Update user profile
export const update = mutation({
  args: {
    bio: v.optional(v.string()),
    level: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("expert"),
        v.null()
      )
    ),
    units: v.optional(v.union(v.literal("metric"), v.literal("imperial"))),
    goals: v.optional(v.array(v.string())),
    preferredWorkoutTime: v.optional(
      v.union(
        v.literal("morning"),
        v.literal("afternoon"),
        v.literal("evening"),
        v.literal("anytime"),
        v.null()
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.subject) {
      throw new Error("Unauthorized");
    }

    const userId = identity.subject;

    // Find existing profile
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!existing) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }

    const now = Date.now();
    await ctx.db.patch(existing._id, {
      bio: args.bio !== undefined ? args.bio : existing.bio,
      level: args.level !== undefined ? args.level : existing.level,
      units: args.units !== undefined ? args.units : existing.units,
      goals: args.goals !== undefined ? args.goals : existing.goals,
      preferredWorkoutTime:
        args.preferredWorkoutTime !== undefined
          ? args.preferredWorkoutTime
          : existing.preferredWorkoutTime,
      updatedAt: now,
    });

    return await ctx.db.get(existing._id);
  },
});
