import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { setLabelEnum, sideEnum, visibilityEnum, weightUnitEnum, workoutStatusEnum } from "./schema";

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

// Start a new workout session from a routine
export const start = mutation({
    args: {
        routineId: v.id("routines"),
        visibility: v.optional(visibilityEnum),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Verify routine exists and user has access
        const routine = await ctx.db.get(args.routineId);
        if (!routine) {
            throw new Error("Routine not found");
        }

        // Use routine's visibility if not specified
        const workoutVisibility = args.visibility ?? routine.visibility;

        const now = Date.now();

        const workoutId = await ctx.db.insert("workoutSessions", {
            userId: identity.subject,
            routineId: args.routineId,
            status: "active",
            visibility: workoutVisibility,
            name: args.name,
            startedAt: now,
            totalPausedTime: 0,
            lastHeartbeat: now,
        });

        return {
            workoutId,
            status: "active" as const,
            routine,
        };
    },
});

// Add a set to the current workout
export const addSet = mutation({
    args: {
        workoutSessionId: v.id("workoutSessions"),
        exerciseId: v.string(),
        reps: v.number(),
        weight: v.number(),
        weightUnit: weightUnitEnum,
        side: v.optional(sideEnum),
        label: v.optional(setLabelEnum),
        note: v.optional(v.string()),
        rpe: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const session = await ctx.db.get(args.workoutSessionId);
        if (!session || session.userId !== identity.subject) {
            throw new Error("Workout not found");
        }

        if (session.status !== "active") {
            throw new Error("Workout is not active");
        }

        // Get current set count for this workout
        const existingSets = await ctx.db
            .query("workoutSets")
            .withIndex("by_workoutSessionId", (q) => q.eq("workoutSessionId", args.workoutSessionId))
            .collect();

        const setNumber = existingSets.length + 1;

        // Get set count for this specific exercise in this workout
        const exerciseSets = existingSets.filter((s) => s.exerciseId === args.exerciseId);
        const exerciseSetNumber = exerciseSets.length + 1;

        const now = Date.now();

        const setId = await ctx.db.insert("workoutSets", {
            userId: identity.subject,
            routineId: session.routineId,
            workoutSessionId: args.workoutSessionId,
            exerciseId: args.exerciseId,
            setNumber,
            exerciseSetNumber,
            reps: args.reps,
            weight: args.weight,
            weightUnit: args.weightUnit,
            side: args.side,
            label: args.label,
            note: args.note,
            rpe: args.rpe,
            completedAt: now,
            createdAt: now,
        });

        // Update heartbeat
        await ctx.db.patch(args.workoutSessionId, {
            lastHeartbeat: now,
        });

        return {
            setId,
            setNumber,
            exerciseSetNumber,
        };
    },
});

// Update an existing set
export const updateSet = mutation({
    args: {
        setId: v.id("workoutSets"),
        reps: v.optional(v.number()),
        weight: v.optional(v.number()),
        weightUnit: v.optional(weightUnitEnum),
        side: v.optional(sideEnum),
        label: v.optional(setLabelEnum),
        note: v.optional(v.string()),
        rpe: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const set = await ctx.db.get(args.setId);
        if (!set || set.userId !== identity.subject) {
            throw new Error("Set not found");
        }

        const updates: any = {};
        if (args.reps !== undefined) updates.reps = args.reps;
        if (args.weight !== undefined) updates.weight = args.weight;
        if (args.weightUnit !== undefined) updates.weightUnit = args.weightUnit;
        if (args.side !== undefined) updates.side = args.side;
        if (args.label !== undefined) updates.label = args.label;
        if (args.note !== undefined) updates.note = args.note;
        if (args.rpe !== undefined) updates.rpe = args.rpe;

        await ctx.db.patch(args.setId, updates);

        return { ok: true };
    },
});

// Delete a set
export const deleteSet = mutation({
    args: {
        setId: v.id("workoutSets"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const set = await ctx.db.get(args.setId);
        if (!set || set.userId !== identity.subject) {
            throw new Error("Set not found");
        }

        await ctx.db.delete(args.setId);

        return { ok: true };
    },
});

// Pause workout
export const pause = mutation({
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

        if (session.status !== "active") {
            throw new Error("Workout is not active");
        }

        const now = Date.now();

        await ctx.db.patch(args.workoutId, {
            status: "paused",
            pausedAt: now,
            lastHeartbeat: now,
        });

        return { ok: true };
    },
});

// Resume workout
export const resume = mutation({
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

        if (session.status !== "paused") {
            throw new Error("Workout is not paused");
        }

        const now = Date.now();
        const pausedDuration = session.pausedAt ? now - session.pausedAt : 0;

        await ctx.db.patch(args.workoutId, {
            status: "active",
            pausedAt: undefined,
            totalPausedTime: session.totalPausedTime + pausedDuration,
            lastHeartbeat: now,
        });

        return { ok: true };
    },
});

// Complete workout
export const complete = mutation({
    args: {
        workoutId: v.id("workoutSessions"),
        notes: v.optional(v.string()),
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
            notes: args.notes,
            lastHeartbeat: now,
        });

        // Update routine stats
        await ctx.db.patch(session.routineId, {
            lastPerformedAt: now,
            timesPerformed: (await ctx.db.get(session.routineId))!.timesPerformed + 1,
            updatedAt: now,
        });

        return { ok: true };
    },
});

// Cancel workout
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

        // Delete all sets for this workout
        const sets = await ctx.db
            .query("workoutSets")
            .withIndex("by_workoutSessionId", (q) => q.eq("workoutSessionId", args.workoutId))
            .collect();

        for (const set of sets) {
            await ctx.db.delete(set._id);
        }

        await ctx.db.patch(args.workoutId, {
            status: "cancelled",
            endedAt: now,
            lastHeartbeat: now,
        });

        return { ok: true };
    },
});

// Get workout by ID with all sets
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

        // Get all sets for this workout
        const sets = await ctx.db
            .query("workoutSets")
            .withIndex("by_workoutSessionId", (q) => q.eq("workoutSessionId", args.workoutId))
            .collect();

        // Get routine info
        const routine = await ctx.db.get(session.routineId);

        return {
            ...session,
            sets: sets.sort((a, b) => a.setNumber - b.setNumber),
            routine,
        };
    },
});

// Get a single set by ID
export const getSetById = query({
    args: { setId: v.id("workoutSets") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const set = await ctx.db.get(args.setId);
        if (!set) {
            return null;
        }

        // Only owner can view their sets
        if (set.userId !== identity.subject) {
            return null;
        }

        return set;
    },
});

// Get active workout for current user
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

        if (!activeWorkout) {
            // Also check for paused workouts
            const pausedWorkout = await ctx.db
                .query("workoutSessions")
                .withIndex("by_userId_status", (q) =>
                    q.eq("userId", identity.subject).eq("status", "paused")
                )
                .first();

            if (!pausedWorkout) {
                return null;
            }

            const sets = await ctx.db
                .query("workoutSets")
                .withIndex("by_workoutSessionId", (q) =>
                    q.eq("workoutSessionId", pausedWorkout._id)
                )
                .collect();

            const routine = await ctx.db.get(pausedWorkout.routineId);

            return {
                ...pausedWorkout,
                sets: sets.sort((a, b) => a.setNumber - b.setNumber),
                routine,
            };
        }

        const sets = await ctx.db
            .query("workoutSets")
            .withIndex("by_workoutSessionId", (q) => q.eq("workoutSessionId", activeWorkout._id))
            .collect();

        const routine = await ctx.db.get(activeWorkout.routineId);

        return {
            ...activeWorkout,
            sets: sets.sort((a, b) => a.setNumber - b.setNumber),
            routine,
        };
    },
});

// Get recent workouts
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

        // Enrich with routine info
        const enriched = await Promise.all(
            workouts.map(async (workout) => {
                const routine = await ctx.db.get(workout.routineId);
                const setCount = await ctx.db
                    .query("workoutSets")
                    .withIndex("by_workoutSessionId", (q) => q.eq("workoutSessionId", workout._id))
                    .collect();

                return {
                    ...workout,
                    routine,
                    setCount: setCount.length,
                };
            })
        );

        return enriched;
    },
});

// Get workout history
export const history = query({
    args: {
        status: v.optional(workoutStatusEnum),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        let workouts = await ctx.db
            .query("workoutSessions")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .take(args.limit ?? 20);

        if (args.status) {
            workouts = workouts.filter((w) => w.status === args.status);
        }

        // Enrich with routine info
        const enriched = await Promise.all(
            workouts.map(async (workout) => {
                const routine = await ctx.db.get(workout.routineId);
                const sets = await ctx.db
                    .query("workoutSets")
                    .withIndex("by_workoutSessionId", (q) => q.eq("workoutSessionId", workout._id))
                    .collect();

                return {
                    ...workout,
                    routine,
                    setCount: sets.length,
                    sets,
                };
            })
        );

        return {
            workouts: enriched,
            hasMore: workouts.length === (args.limit ?? 20),
        };
    },
});

// Follow/spectate a workout (real-time updates)
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

        // Get all sets
        const sets = await ctx.db
            .query("workoutSets")
            .withIndex("by_workoutSessionId", (q) => q.eq("workoutSessionId", args.workoutId))
            .collect();

        const routine = await ctx.db.get(session.routineId);

        return {
            visibility: session.visibility,
            status: session.status,
            sets: sets.sort((a, b) => a.setNumber - b.setNumber),
            routine,
            startedAt: session.startedAt,
            lastHeartbeat: session.lastHeartbeat,
        };
    },
});

// Get active workouts from friends
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
                if (workout.visibility === "friends" || workout.visibility === "public") {
                    const routine = await ctx.db.get(workout.routineId);
                    workouts.push({ ...workout, routine });
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

        // Enrich with routine info
        const enriched = await Promise.all(
            allActive.map(async (workout) => {
                const routine = await ctx.db.get(workout.routineId);
                return { ...workout, routine };
            })
        );

        return enriched;
    },
});

// Get all spectatable workouts
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
                    const routine = await ctx.db.get(workout.routineId);
                    friendWorkouts.push({ ...workout, routine });
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

        // Enrich with routine info
        const enrichedPublic = await Promise.all(
            publicWorkouts.map(async (workout) => {
                const routine = await ctx.db.get(workout.routineId);
                return { ...workout, routine };
            })
        );

        // Combine and return
        return [...friendWorkouts, ...enrichedPublic];
    },
});

// Get personal records for an exercise
export const getExercisePRs = query({
    args: {
        exerciseId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const sets = await ctx.db
            .query("workoutSets")
            .withIndex("by_userId_exerciseId", (q) =>
                q.eq("userId", identity.subject).eq("exerciseId", args.exerciseId)
            )
            .collect();

        if (sets.length === 0) {
            return null;
        }

        let maxWeight = 0;
        let maxReps = 0;
        let maxVolume = 0;
        let maxWeightSet = null;
        let maxRepsSet = null;
        let maxVolumeSet = null;

        for (const set of sets) {
            if (set.weight > maxWeight) {
                maxWeight = set.weight;
                maxWeightSet = set;
            }
            if (set.reps > maxReps) {
                maxReps = set.reps;
                maxRepsSet = set;
            }
            const volume = set.weight * set.reps;
            if (volume > maxVolume) {
                maxVolume = volume;
                maxVolumeSet = set;
            }
        }

        return {
            exerciseId: args.exerciseId,
            maxWeight: { value: maxWeight, set: maxWeightSet },
            maxReps: { value: maxReps, set: maxRepsSet },
            maxVolume: { value: maxVolume, set: maxVolumeSet },
            totalSets: sets.length,
        };
    },
});

// Heartbeat to keep workout session alive
export const heartbeat = mutation({
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

        await ctx.db.patch(args.workoutId, {
            lastHeartbeat: Date.now(),
        });

        return { ok: true };
    },
});
