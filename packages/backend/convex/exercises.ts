import { v } from "convex/values";

import { query } from "./_generated/server";
import { categoryEnum, equipmentEnum, levelEnum, muscleEnum } from "./schema";

// Get exercises by their external IDs (like "barbell_bench_press")
export const getByIds = query({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, args) => {
    const exercises = await Promise.all(
      args.ids.map(async (id) => {
        const exercise = await ctx.db
          .query("exercises")
          .withIndex("by_externalId", (q) => q.eq("externalId", id))
          .first();
        return exercise;
      })
    );

    return {
      exercises: exercises.filter(
        (ex): ex is NonNullable<typeof ex> => ex !== null
      ),
    };
  },
});

// Get a single exercise by its external ID
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const exercise = await ctx.db
      .query("exercises")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.id))
      .first();

    if (!exercise) {
      throw new Error("Exercise not found");
    }

    return { exercise };
  },
});

// Get version info and total count (for sync)
export const version = query({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();
    const totalExercises = exercises.length;

    // Create a simple version string based on count
    const version = `v1.0.${totalExercises}`;

    return {
      version,
      totalExercises,
      timestamp: Date.now(),
    };
  },
});

// Sync all exercises (for initial client sync)
export const sync = query({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();

    const version = `v1.0.${exercises.length}`;

    return {
      version,
      exercises,
      timestamp: Date.now(),
    };
  },
});

// Search exercises by name or muscle group
export const search = query({
  args: {
    searchTerm: v.optional(v.string()),
    muscle: v.optional(muscleEnum),
    category: v.optional(categoryEnum),
    equipment: v.optional(equipmentEnum),
    level: v.optional(levelEnum),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let exercises = await ctx.db.query("exercises").collect();

    // Filter by search term (name)
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      exercises = exercises.filter((ex) =>
        ex.name.toLowerCase().includes(term)
      );
    }

    // Filter by primary muscle
    if (args.muscle) {
      exercises = exercises.filter((ex) =>
        ex.primaryMuscles.includes(args.muscle!)
      );
    }

    // Filter by category
    if (args.category) {
      exercises = exercises.filter((ex) => ex.category === args.category);
    }

    // Filter by equipment
    if (args.equipment) {
      exercises = exercises.filter((ex) => ex.equipment === args.equipment);
    }

    // Filter by level
    if (args.level) {
      exercises = exercises.filter((ex) => ex.level === args.level);
    }

    // Apply limit
    if (args.limit) {
      exercises = exercises.slice(0, args.limit);
    }

    return { exercises };
  },
});
