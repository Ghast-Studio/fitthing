import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// ===== Exercise Enums =====
export const equipmentEnum = v.union(
    v.literal("medicine ball"),
    v.literal("dumbbell"),
    v.literal("body only"),
    v.literal("bands"),
    v.literal("kettlebells"),
    v.literal("foam roll"),
    v.literal("cable"),
    v.literal("machine"),
    v.literal("barbell"),
    v.literal("exercise ball"),
    v.literal("e-z curl bar"),
    v.literal("other"),
    v.null()
);

export const categoryEnum = v.union(
    v.literal("powerlifting"),
    v.literal("strength"),
    v.literal("stretching"),
    v.literal("cardio"),
    v.literal("olympic weightlifting"),
    v.literal("strongman"),
    v.literal("plyometrics")
);

export const muscleEnum = v.union(
    v.literal("abdominals"),
    v.literal("abductors"),
    v.literal("adductors"),
    v.literal("biceps"),
    v.literal("calves"),
    v.literal("chest"),
    v.literal("forearms"),
    v.literal("glutes"),
    v.literal("hamstrings"),
    v.literal("lats"),
    v.literal("lower back"),
    v.literal("middle back"),
    v.literal("neck"),
    v.literal("quadriceps"),
    v.literal("shoulders"),
    v.literal("traps"),
    v.literal("triceps")
);

export const mechanicEnum = v.union(v.literal("isolation"), v.literal("compound"), v.null());

export const levelEnum = v.union(
    v.literal("beginner"),
    v.literal("intermediate"),
    v.literal("expert")
);

// ===== Exercise Validator =====
export const exerciseValidator = v.object({
    externalId: v.string(),
    name: v.string(),
    force: v.optional(
        v.union(v.literal("static"), v.literal("pull"), v.literal("push"), v.null())
    ),
    level: levelEnum,
    mechanic: v.optional(mechanicEnum),
    equipment: v.optional(equipmentEnum),
    primaryMuscles: v.array(muscleEnum),
    secondaryMuscles: v.optional(v.array(muscleEnum)),
    instructions: v.array(v.string()),
    category: categoryEnum,
    images: v.array(v.string()),
});

export type ExerciseType = Infer<typeof exerciseValidator>;

export const ExerciseFilters = v.object({
    primaryMuscles: v.optional(v.array(muscleEnum)),
    secondaryMuscles: v.optional(v.array(muscleEnum)),
    level: v.optional(levelEnum),
    category: v.optional(categoryEnum),
    equipment: v.optional(equipmentEnum),
    mechanic: v.optional(mechanicEnum),
    searchQuery: v.optional(v.string()),
});

export type ExerciseFiltersType = Infer<typeof ExerciseFilters>;

// ===== Visibility Enum =====
export const visibilityEnum = v.union(
    v.literal("private"),
    v.literal("friends"),
    v.literal("public")
);

// ===== Set Label Enum =====
export const setLabelEnum = v.union(
    v.literal("warmup"),
    v.literal("working"),
    v.literal("dropset"),
    v.literal("failure"),
    v.literal("pr"),
    v.literal("backoff")
);

// ===== Weight Unit Enum =====
export const weightUnitEnum = v.union(v.literal("kg"), v.literal("lbs"));

// ===== Side Enum (for unilateral exercises) =====
export const sideEnum = v.union(v.literal("left"), v.literal("right"), v.literal("both"));

// ===== Recording Plan Enum =====
export const recordingPlanEnum = v.union(
    v.literal("minimal"),
    v.literal("balanced"),
    v.literal("detailed"),
    v.literal("custom"),
    v.null()
);

// ===== Rest Time Enum =====
export const restTimeEnum = v.union(
    v.literal("1min"),
    v.literal("2min"),
    v.literal("5min"),
    v.literal("custom"),
    v.null()
);

// ===== Routine Exercise Validator =====
// Defines which exercises are in a routine and their default configuration
export const routineExerciseValidator = v.object({
    exerciseId: v.string(), // externalId from exercises table
    order: v.number(), // Order in the routine
    targetSets: v.number(), // Default number of sets
    targetReps: v.number(), // Default target reps
    isUnilateral: v.optional(v.boolean()), // Whether to track left/right separately
    notes: v.optional(v.string()), // Notes for this exercise in the routine
});

export type RoutineExercise = Infer<typeof routineExerciseValidator>;

// ===== Workout Set Validator =====
// Individual set as a database entry with full metadata
export const workoutSetValidator = v.object({
    userId: v.string(),
    routineId: v.id("routines"),
    workoutSessionId: v.id("workoutSessions"),
    exerciseId: v.string(), // externalId from exercises table
    setNumber: v.number(), // Order within workout (1, 2, 3...)
    exerciseSetNumber: v.number(), // Set number for this specific exercise (1, 2, 3...)
    reps: v.number(),
    weight: v.number(),
    weightUnit: weightUnitEnum,
    side: v.optional(sideEnum), // For unilateral exercises: left, right, or both (default)
    label: v.optional(setLabelEnum),
    note: v.optional(v.string()),
    rpe: v.optional(v.number()), // Rate of Perceived Exertion (1-10)
    completedAt: v.number(), // Timestamp when set was completed
    createdAt: v.number(),
});

export type WorkoutSet = Infer<typeof workoutSetValidator>;

// ===== Workout Session Status =====
export const workoutStatusEnum = v.union(
    v.literal("active"),
    v.literal("completed"),
    v.literal("cancelled"),
    v.literal("paused")
);

// ===== User Profile Validator =====
export const userProfileValidator = v.object({
    userId: v.string(),
    bio: v.optional(v.string()),
    totalWorkouts: v.number(),
    totalWorkoutTime: v.number(),
    level: v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("expert"),
        v.null()
    ),
    onboardingCompleted: v.boolean(),
    units: v.union(v.literal("metric"), v.literal("imperial")),
    goals: v.optional(v.array(v.string())),
    recordingPlan: v.optional(recordingPlanEnum),
    restTime: v.optional(restTimeEnum),
    preferredWorkoutTime: v.optional(
        v.union(
            v.literal("morning"),
            v.literal("afternoon"),
            v.literal("evening"),
            v.literal("anytime"),
            v.null()
        )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
});

export type UserProfile = Infer<typeof userProfileValidator>;

// ===== Friend Status Enum =====
export const friendStatusEnum = v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("blocked")
);

// ===== Schema Definition =====
export default defineSchema({
    // Exercise definitions (from external database)
    exercises: defineTable(exerciseValidator).index("by_externalId", ["externalId"]),

    // Routines - templates for workouts
    routines: defineTable({
        userId: v.string(),
        name: v.string(),
        description: v.optional(v.string()),
        exercises: v.array(routineExerciseValidator), // Which exercises and their defaults
        visibility: visibilityEnum,
        lastPerformedAt: v.optional(v.number()), // When was this routine last used
        timesPerformed: v.number(), // How many times this routine was completed
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_userId_createdAt", ["userId", "createdAt"])
        .index("by_userId_lastPerformed", ["userId", "lastPerformedAt"]),

    // Workout Sessions - actual workout instances
    workoutSessions: defineTable({
        userId: v.string(),
        routineId: v.id("routines"), // Required reference to routine
        status: workoutStatusEnum,
        visibility: visibilityEnum,
        name: v.optional(v.string()), // Can override routine name
        notes: v.optional(v.string()), // Overall workout notes
        startedAt: v.number(),
        endedAt: v.optional(v.number()),
        pausedAt: v.optional(v.number()), // When workout was paused
        totalPausedTime: v.number(), // Total time spent paused
        lastHeartbeat: v.number(), // For live tracking
    })
        .index("by_userId", ["userId"])
        .index("by_userId_startedAt", ["userId", "startedAt"])
        .index("by_userId_status", ["userId", "status"])
        .index("by_routineId", ["routineId"])
        .index("by_routineId_status", ["routineId", "status"])
        .index("by_status_visibility", ["status", "visibility"]),

    // Individual Sets - each set is a separate database entry
    workoutSets: defineTable(workoutSetValidator)
        .index("by_userId", ["userId"])
        .index("by_workoutSessionId", ["workoutSessionId"])
        .index("by_routineId", ["routineId"])
        .index("by_routineId_exerciseId", ["routineId", "exerciseId"])
        .index("by_userId_exerciseId", ["userId", "exerciseId"])
        .index("by_workoutSessionId_exerciseId", ["workoutSessionId", "exerciseId"]),

    // User Profiles
    userProfiles: defineTable(userProfileValidator).index("by_userId", ["userId"]),

    // Friend relationships
    friends: defineTable({
        requesterId: v.string(),
        recipientId: v.string(),
        status: friendStatusEnum,
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_requesterId", ["requesterId"])
        .index("by_recipientId", ["recipientId"])
        .index("by_recipientId_status", ["recipientId", "status"])
        .index("by_requesterId_recipientId", ["requesterId", "recipientId"])
        .index("by_requesterId_status", ["requesterId", "status"]),
});

