/**
 * Convex API exports and types
 */

import { api } from "@ex/backend/convex/_generated/api";

import type { Id } from "@ex/backend/convex/_generated/dataModel";

// Re-export the api for direct access
export { api };

// Type exports for convenience
export type RoutineId = Id<"routines">;
export type WorkoutId = Id<"workoutSessions">;
export type ExerciseDoc =
    typeof api.exercises.getById._returnType extends Promise<infer T>
        ? T extends { exercise: infer E }
            ? E
            : never
        : never;
