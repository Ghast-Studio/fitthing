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

export const mechanicEnum = v.union(
  v.literal("isolation"),
  v.literal("compound"),
  v.null()
);

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

// ===== Routine Validators =====
export const exerciseInRoutineValidator = v.object({
  exerciseId: v.string(),
  sets: v.number(),
  reps: v.number(),
  notes: v.optional(v.string()),
});

// ===== Workout Validators =====
export const workoutSetValidator = v.object({
  exerciseId: v.string(),
  setNumber: v.number(),
  targetReps: v.number(),
  completedReps: v.number(),
  weight: v.number(),
  completed: v.boolean(),
});

export const workoutProgressValidator = v.object({
  sets: v.array(workoutSetValidator),
  notes: v.optional(v.string()),
  startedAt: v.optional(v.number()),
  lastUpdatedAt: v.optional(v.number()),
});

export type WorkoutProgress = Infer<typeof workoutProgressValidator>;

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
  exercises: defineTable(exerciseValidator).index("by_externalId", [
    "externalId",
  ]),

  routines: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    exercises: v.array(exerciseInRoutineValidator),
    visibility: v.union(
      v.literal("private"),
      v.literal("friends"),
      v.literal("public")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  workoutSessions: defineTable({
    userId: v.string(),
    routineId: v.optional(v.id("routines")),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("archived")
    ),
    visibility: v.union(
      v.literal("private"),
      v.literal("friends"),
      v.literal("public")
    ),
    state: workoutProgressValidator,
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    lastHeartbeat: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_startedAt", ["userId", "startedAt"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_status_visibility", ["status", "visibility"]),

  userProfiles: defineTable(userProfileValidator).index("by_userId", ["userId"]),

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

