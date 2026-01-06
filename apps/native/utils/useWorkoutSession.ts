import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { err, Result } from "neverthrow";

import { api } from "@ex/backend/convex/_generated/api";
import type { WorkoutProgress } from "@ex/backend/convex/schema";

import { RoutineId } from "./convex";
import { wrapConvexMutation } from "./result";
import { router } from "expo-router";

export interface WorkoutSet {
  exerciseId: string;
  setNumber: number;
  targetReps: number;
  completedReps: number;
  weight: number;
  completed: boolean;
}

export type WorkoutError = {
  type: "mutation_error" | "invalid_state" | "not_found";
  message: string;
  originalError?: unknown;
};

function createWorkoutError(
  type: WorkoutError["type"],
  message: string,
  originalError?: unknown
): WorkoutError {
  return { type, message, originalError };
}

export function useWorkoutSession() {
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const startMutation = useMutation(api.workouts.start);
  const saveMutation = useMutation(api.workouts.saveProgress).withOptimisticUpdate(
    (localStore, args) => {
      const currentWorkout = localStore.getQuery(api.workouts.getActive);
      // If we have the active workout loaded, update it optimistically
      if (
        currentWorkout !== undefined &&
        currentWorkout !== null &&
        currentWorkout._id === args.workoutId
      ) {
        localStore.setQuery(
          api.workouts.getActive,
          {},
          {
            ...currentWorkout,
            state: args.progress,
            lastHeartbeat: args.progress.lastUpdatedAt ?? Date.now(),
          }
        );
      }
    }
  );
  const completeMutation = useMutation(api.workouts.complete);
  const cancelMutation = useMutation(api.workouts.cancel);

  const activeWorkout = useQuery(api.workouts.getActive);

  const activeSession = useMemo(() => {
    if (!activeWorkout) return null;
    return {
      workoutId: activeWorkout._id,
      routineId: activeWorkout.routineId,
      status: activeWorkout.status,
      startedAt: activeWorkout.startedAt,
    };
  }, [activeWorkout]);

  const sets: WorkoutSet[] = useMemo(() => {
    return activeWorkout?.state?.sets ?? [];
  }, [activeWorkout]);

  const notes = useMemo(() => {
    return activeWorkout?.state?.notes ?? "";
  }, [activeWorkout]);

  const hasActiveWorkout = activeWorkout?.status === "active";

  const startWorkout = useCallback(
    async (
      routineId?: string,
      initialSets: WorkoutSet[] = [],
      visibility: "private" | "friends" | "public" = "private"
    ): Promise<Result<any, WorkoutError>> => {
      setIsStarting(true);

      const now = Date.now();
      const initialProgress: WorkoutProgress = {
        sets: initialSets,
        startedAt: now,
        lastUpdatedAt: now,
      };

      try {
        const result = await wrapConvexMutation(
          startMutation,
          {
            routineId: routineId as RoutineId | undefined,
            visibility,
            initialProgress,
          },
          (error) =>
            createWorkoutError("mutation_error", "Failed to start workout", error)
        );

        return result;
      } finally {
        setIsStarting(false);
      }
    },
    [startMutation]
  );

  const updateSet = useCallback(
    async (
      index: number,
      updates: Partial<WorkoutSet>
    ): Promise<Result<void, WorkoutError>> => {
      if (!activeWorkout || activeWorkout.status !== "active") {
        return err(createWorkoutError("invalid_state", "No active workout found"));
      }

      const updatedSets = sets.map((s, i) =>
        i === index ? { ...s, ...updates } : s
      );

      const progress: WorkoutProgress = {
        sets: updatedSets,
        notes: notes || undefined,
        startedAt: activeWorkout.startedAt,
        lastUpdatedAt: Date.now(),
      };

      const result = await wrapConvexMutation(
        saveMutation,
        {
          workoutId: activeWorkout._id,
          progress,
        },
        (error) =>
          createWorkoutError("mutation_error", "Failed to update set", error)
      );

      return result.map(() => undefined);
    },
    [activeWorkout, sets, notes, saveMutation]
  );

  const setNotes = useCallback(
    async (newNotes: string): Promise<Result<void, WorkoutError>> => {
      if (!activeWorkout || activeWorkout.status !== "active") {
        return err(createWorkoutError("invalid_state", "No active workout found"));
      }

      const progress: WorkoutProgress = {
        sets,
        notes: newNotes || undefined,
        startedAt: activeWorkout.startedAt,
        lastUpdatedAt: Date.now(),
      };

      const result = await wrapConvexMutation(
        saveMutation,
        {
          workoutId: activeWorkout._id,
          progress,
        },
        (error) =>
          createWorkoutError("mutation_error", "Failed to update notes", error)
      );

      return result.map(() => undefined);
    },
    [activeWorkout, sets, saveMutation]
  );

  const completeWorkout = useCallback(async (): Promise<
    Result<void, WorkoutError>
  > => {
    if (!activeWorkout) {
      return err(createWorkoutError("not_found", "No active workout found"));
    }

    setIsCompleting(true);

    try {
      const result = await wrapConvexMutation(
        completeMutation,
        {
          workoutId: activeWorkout._id,
        },
        (error) =>
          createWorkoutError("mutation_error", "Failed to complete workout", error)
      );

      return result.map(() => undefined);
    } finally {
      setIsCompleting(false);
    }
  }, [activeWorkout, completeMutation]);

  const cancelWorkout = useCallback(async (): Promise<
    Result<void, WorkoutError>
  > => {
    if (!activeWorkout) {
      return err(createWorkoutError("not_found", "No active workout found"));
    }

    const result = await wrapConvexMutation(
      cancelMutation,
      {
        workoutId: activeWorkout._id,
      },
      (error) =>
        createWorkoutError("mutation_error", "Failed to cancel workout", error)
    );

    return result.map(() => undefined);
  }, [activeWorkout, cancelMutation]);

  return {
    activeSession,
    sets,
    notes,
    hasActiveWorkout,

    startWorkout,
    updateSet,
    setNotes,
    completeWorkout,
    cancelWorkout,

    isStarting,
    isCompleting,

    isSyncing: false,
    syncError: null,
  };
}
