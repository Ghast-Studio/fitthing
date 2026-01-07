import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { routineExerciseValidator, visibilityEnum, WorkoutSet } from "./schema";

// Helper function to check if a user can view a routine
async function canViewRoutine(
    ctx: any,
    routineUserId: string,
    visibility: "private" | "friends" | "public",
    viewerId: string | undefined
): Promise<boolean> {
    // Owner can always view
    if (viewerId === routineUserId) {
        return true;
    }

    // Public routines can be viewed by anyone
    if (visibility === "public") {
        return true;
    }

    // Private routines can only be viewed by owner (already checked above)
    if (visibility === "private") {
        return false;
    }

    // Friends visibility: check if users are friends
    if (visibility === "friends" && viewerId) {
        // Check if friendship exists in either direction
        const asRequester = await ctx.db
            .query("friends")
            .withIndex("by_requesterId_recipientId", (q: any) =>
                q.eq("requesterId", viewerId).eq("recipientId", routineUserId)
            )
            .first();

        if (asRequester && asRequester.status === "accepted") {
            return true;
        }

        const asRecipient = await ctx.db
            .query("friends")
            .withIndex("by_requesterId_recipientId", (q: any) =>
                q.eq("requesterId", routineUserId).eq("recipientId", viewerId)
            )
            .first();

        if (asRecipient && asRecipient.status === "accepted") {
            return true;
        }
    }

    return false;
}

// Get all routines for the authenticated user
export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const routines = await ctx.db
            .query("routines")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .collect();

        return routines;
    },
});

// Get a single routine by ID
export const getById = query({
    args: { id: v.id("routines") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const routine = await ctx.db.get(args.id);

        if (!routine) {
            return null;
        }

        // Check if viewer can access this routine
        const canView = await canViewRoutine(
            ctx,
            routine.userId,
            routine.visibility,
            identity.subject
        );

        if (!canView) {
            return null;
        }

        return routine;
    },
});

// Get routine with historical sets for each exercise
export const getByIdWithHistory = query({
    args: { id: v.id("routines") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const routine = await ctx.db.get(args.id);

        if (!routine) {
            return null;
        }

        // Check if viewer can access this routine
        const canView = await canViewRoutine(
            ctx,
            routine.userId,
            routine.visibility,
            identity.subject
        );

        if (!canView) {
            return null;
        }

        // Get historical sets for each exercise in this routine
        const exerciseHistory: Record<
            string,
            {
                sets: WorkoutSet[];
                lastPerformed: number | null;
                bestWeight: number;
                bestReps: number;
            }
        > = {};

        for (const exercise of routine.exercises) {
            const sets = await ctx.db
                .query("workoutSets")
                .withIndex("by_routineId_exerciseId", (q) =>
                    q.eq("routineId", args.id).eq("exerciseId", exercise.exerciseId)
                )
                .order("desc")
                .take(50); // Last 50 sets per exercise

            let bestWeight = 0;
            let bestReps = 0;
            let lastPerformed: number | null = null;

            for (const set of sets) {
                if (set.weight > bestWeight) {
                    bestWeight = set.weight;
                }
                if (set.reps > bestReps) {
                    bestReps = set.reps;
                }
                if (lastPerformed === null || set.completedAt > lastPerformed) {
                    lastPerformed = set.completedAt;
                }
            }

            exerciseHistory[exercise.exerciseId] = {
                sets: sets.reverse(), // Oldest first for display
                lastPerformed,
                bestWeight,
                bestReps,
            };
        }

        return {
            ...routine,
            exerciseHistory,
        };
    },
});

// Create a new routine
export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        exercises: v.array(routineExerciseValidator),
        visibility: v.optional(visibilityEnum),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const now = Date.now();

        const routineId = await ctx.db.insert("routines", {
            userId: identity.subject,
            name: args.name,
            description: args.description,
            exercises: args.exercises,
            visibility: args.visibility ?? "private",
            timesPerformed: 0,
            createdAt: now,
            updatedAt: now,
        });

        return await ctx.db.get(routineId);
    },
});

// Update an existing routine
export const update = mutation({
    args: {
        id: v.id("routines"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        exercises: v.optional(v.array(routineExerciseValidator)),
        visibility: v.optional(visibilityEnum),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.subject) {
            throw new Error("Routine not found");
        }

        const updates: Partial<{
            name: string;
            description: string;
            exercises: typeof args.exercises;
            visibility: "private" | "friends" | "public";
            updatedAt: number;
        }> = {
            updatedAt: Date.now(),
        };

        if (args.name !== undefined) updates.name = args.name;
        if (args.description !== undefined) updates.description = args.description;
        if (args.exercises !== undefined) updates.exercises = args.exercises;
        if (args.visibility !== undefined) updates.visibility = args.visibility;

        await ctx.db.patch(args.id, updates);

        return await ctx.db.get(args.id);
    },
});

// Delete a routine
export const remove = mutation({
    args: { id: v.id("routines") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const existing = await ctx.db.get(args.id);
        if (!existing || existing.userId !== identity.subject) {
            throw new Error("Routine not found");
        }

        await ctx.db.delete(args.id);

        return { success: true };
    },
});

// Get sets history for a specific exercise in a routine
export const getExerciseHistory = query({
    args: {
        routineId: v.id("routines"),
        exerciseId: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const routine = await ctx.db.get(args.routineId);
        if (!routine) {
            return null;
        }

        // Check if viewer can access this routine
        const canView = await canViewRoutine(
            ctx,
            routine.userId,
            routine.visibility,
            identity.subject
        );

        if (!canView) {
            return null;
        }

        // Get historical sets for this exercise in this routine
        const sets = await ctx.db
            .query("workoutSets")
            .withIndex("by_routineId_exerciseId", (q) =>
                q.eq("routineId", args.routineId).eq("exerciseId", args.exerciseId)
            )
            .order("desc")
            .take(args.limit ?? 100);

        // Group sets by workout session
        const sessionMap = new Map<string, any[]>();
        for (const set of sets) {
            const sessionId = set.workoutSessionId;
            if (!sessionMap.has(sessionId)) {
                sessionMap.set(sessionId, []);
            }
            sessionMap.get(sessionId)!.push(set);
        }

        // Get session details for each workout
        const sessions: Array<{ session: any; sets: any[] }> = [];
        for (const [sessionId, sessionSets] of sessionMap) {
            const session = await ctx.db.get(sessionId as any);
            sessions.push({
                session,
                sets: sessionSets.sort((a, b) => a.exerciseSetNumber - b.exerciseSetNumber),
            });
        }

        return {
            exerciseId: args.exerciseId,
            routineId: args.routineId,
            sessions: sessions.sort(
                (a, b) => ((b.session as any)?.startedAt ?? 0) - ((a.session as any)?.startedAt ?? 0)
            ),
            totalSets: sets.length,
        };
    },
});
