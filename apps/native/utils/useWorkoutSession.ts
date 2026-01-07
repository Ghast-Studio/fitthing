import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { err, ok, Result } from "neverthrow";

import { api } from "@ex/backend/convex/_generated/api";

import { RoutineId, WorkoutSessionId, WorkoutSetId } from "./convex";
import { wrapConvexMutation } from "./result";
import {
    LocalSet,
    SetLabel,
    Side,
    useActiveWorkoutStore,
    WeightUnit,
} from "../store/store";

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
    const [isSavingSet, setIsSavingSet] = useState(false);

    // Convex mutations
    const startMutation = useMutation(api.workouts.start);
    const addSetMutation = useMutation(api.workouts.addSet);
    const updateSetMutation = useMutation(api.workouts.updateSet);
    const deleteSetMutation = useMutation(api.workouts.deleteSet);
    const completeMutation = useMutation(api.workouts.complete);
    const cancelMutation = useMutation(api.workouts.cancel);
    const pauseMutation = useMutation(api.workouts.pause);
    const resumeMutation = useMutation(api.workouts.resume);
    const heartbeatMutation = useMutation(api.workouts.heartbeat);

    // Convex queries
    const activeWorkoutQuery = useQuery(api.workouts.getActive);

    // Zustand store
    const store = useActiveWorkoutStore();

    // Sync from Convex query to store on initial load
    useEffect(() => {
        if (activeWorkoutQuery && !store.workoutSessionId) {
            // Restore workout state from server
            store.startWorkout(
                activeWorkoutQuery._id,
                activeWorkoutQuery.routineId,
                activeWorkoutQuery.routine?.name ?? "Workout",
                activeWorkoutQuery.routine?.exercises ?? []
            );

            // Restore sets from server
            for (const set of activeWorkoutQuery.sets ?? []) {
                store.addSet({
                    exerciseId: set.exerciseId,
                    exerciseSetNumber: set.exerciseSetNumber,
                    reps: set.reps,
                    weight: set.weight,
                    weightUnit: set.weightUnit as WeightUnit,
                    side: set.side as Side | undefined,
                    label: set.label as SetLabel | undefined,
                    note: set.note,
                    rpe: set.rpe,
                });
                // Mark as saved with DB ID
                const localSets = store.sets;
                const lastSet = localSets[localSets.length - 1];
                if (lastSet) {
                    store.markSetSaved(lastSet.localId, set._id);
                }
            }
        }
    }, [activeWorkoutQuery, store.workoutSessionId]);

    // Heartbeat every 30 seconds
    useEffect(() => {
        if (!store.workoutSessionId || store.isPaused) return;

        const interval = setInterval(() => {
            heartbeatMutation({ workoutId: store.workoutSessionId as WorkoutSessionId });
        }, 30000);

        return () => clearInterval(interval);
    }, [store.workoutSessionId, store.isPaused, heartbeatMutation]);

    const hasActiveWorkout = !!store.workoutSessionId;

    const startWorkout = useCallback(
        async (
            routineId: string,
            routineName: string,
            exercises: any[],
            visibility: "private" | "friends" | "public" = "private"
        ): Promise<Result<string, WorkoutError>> => {
            setIsStarting(true);

            try {
                const result = await wrapConvexMutation(
                    startMutation,
                    {
                        routineId: routineId as RoutineId,
                        visibility,
                    },
                    (error) =>
                        createWorkoutError("mutation_error", "Failed to start workout", error)
                );

                if (result.isOk()) {
                    const { workoutId, routine } = result.value;
                    store.startWorkout(
                        workoutId,
                        routineId,
                        routineName,
                        exercises
                    );
                    return ok(workoutId);
                }

                return err(result.error);
            } finally {
                setIsStarting(false);
            }
        },
        [startMutation, store]
    );

    const addSet = useCallback(
        async (
            exerciseId: string,
            reps: number,
            weight: number,
            weightUnit: WeightUnit,
            options?: {
                side?: Side;
                label?: SetLabel;
                note?: string;
                rpe?: number;
            }
        ): Promise<Result<string, WorkoutError>> => {
            if (!store.workoutSessionId) {
                return err(createWorkoutError("invalid_state", "No active workout"));
            }

            // Get next exercise set number
            const exerciseSets = store.sets.filter((s) => s.exerciseId === exerciseId);
            const exerciseSetNumber = exerciseSets.length + 1;

            // Add to local store first (optimistic)
            const localId = store.addSet({
                exerciseId,
                exerciseSetNumber,
                reps,
                weight,
                weightUnit,
                side: options?.side,
                label: options?.label,
                note: options?.note,
                rpe: options?.rpe,
            });

            setIsSavingSet(true);

            try {
                const result = await wrapConvexMutation(
                    addSetMutation,
                    {
                        workoutSessionId: store.workoutSessionId as WorkoutSessionId,
                        exerciseId,
                        reps,
                        weight,
                        weightUnit,
                        side: options?.side,
                        label: options?.label,
                        note: options?.note,
                        rpe: options?.rpe,
                    },
                    (error) => createWorkoutError("mutation_error", "Failed to add set", error)
                );

                if (result.isOk()) {
                    store.markSetSaved(localId, result.value.setId);
                    return ok(result.value.setId);
                }

                // Rollback on error
                store.removeSet(localId);
                return err(result.error);
            } finally {
                setIsSavingSet(false);
            }
        },
        [store, addSetMutation]
    );

    const updateSet = useCallback(
        async (
            localId: string,
            updates: Partial<{
                reps: number;
                weight: number;
                weightUnit: WeightUnit;
                side: Side;
                label: SetLabel;
                note: string;
                rpe: number;
            }>
        ): Promise<Result<void, WorkoutError>> => {
            const set = store.sets.find((s) => s.localId === localId);
            if (!set) {
                return err(createWorkoutError("not_found", "Set not found"));
            }

            // Update local store immediately
            store.updateSet(localId, updates);

            // If saved to DB, update on server
            if (set.dbId) {
                const result = await wrapConvexMutation(
                    updateSetMutation,
                    {
                        setId: set.dbId as WorkoutSetId,
                        ...updates,
                    },
                    (error) => createWorkoutError("mutation_error", "Failed to update set", error)
                );

                if (result.isErr()) {
                    // Revert local change
                    store.updateSet(localId, set);
                    return err(result.error);
                }
            }

            return ok(undefined);
        },
        [store, updateSetMutation]
    );

    const removeSet = useCallback(
        async (localId: string): Promise<Result<void, WorkoutError>> => {
            const set = store.sets.find((s) => s.localId === localId);
            if (!set) {
                return err(createWorkoutError("not_found", "Set not found"));
            }

            // Store for potential rollback
            const setBackup = { ...set };

            // Remove locally first
            store.removeSet(localId);

            // If saved to DB, delete on server
            if (set.dbId) {
                const result = await wrapConvexMutation(
                    deleteSetMutation,
                    { setId: set.dbId as WorkoutSetId },
                    (error) => createWorkoutError("mutation_error", "Failed to delete set", error)
                );

                if (result.isErr()) {
                    // Re-add the set on error
                    store.addSet(setBackup);
                    return err(result.error);
                }
            }

            return ok(undefined);
        },
        [store, deleteSetMutation]
    );

    const pauseWorkout = useCallback(async (): Promise<Result<void, WorkoutError>> => {
        if (!store.workoutSessionId) {
            return err(createWorkoutError("invalid_state", "No active workout"));
        }

        store.pause();

        const result = await wrapConvexMutation(
            pauseMutation,
            { workoutId: store.workoutSessionId as WorkoutSessionId },
            (error) => createWorkoutError("mutation_error", "Failed to pause workout", error)
        );

        if (result.isErr()) {
            store.resume();
            return err(result.error);
        }

        return ok(undefined);
    }, [store, pauseMutation]);

    const resumeWorkout = useCallback(async (): Promise<Result<void, WorkoutError>> => {
        if (!store.workoutSessionId) {
            return err(createWorkoutError("invalid_state", "No active workout"));
        }

        store.resume();

        const result = await wrapConvexMutation(
            resumeMutation,
            { workoutId: store.workoutSessionId as WorkoutSessionId },
            (error) => createWorkoutError("mutation_error", "Failed to resume workout", error)
        );

        if (result.isErr()) {
            store.pause();
            return err(result.error);
        }

        return ok(undefined);
    }, [store, resumeMutation]);

    const completeWorkout = useCallback(
        async (notes?: string): Promise<Result<void, WorkoutError>> => {
            if (!store.workoutSessionId) {
                return err(createWorkoutError("not_found", "No active workout found"));
            }

            setIsCompleting(true);

            try {
                const result = await wrapConvexMutation(
                    completeMutation,
                    {
                        workoutId: store.workoutSessionId as WorkoutSessionId,
                        notes,
                    },
                    (error) =>
                        createWorkoutError("mutation_error", "Failed to complete workout", error)
                );

                if (result.isOk()) {
                    store.reset();
                }

                return result.map(() => undefined);
            } finally {
                setIsCompleting(false);
            }
        },
        [store, completeMutation]
    );

    const cancelWorkout = useCallback(async (): Promise<Result<void, WorkoutError>> => {
        if (!store.workoutSessionId) {
            return err(createWorkoutError("not_found", "No active workout found"));
        }

        const result = await wrapConvexMutation(
            cancelMutation,
            { workoutId: store.workoutSessionId as WorkoutSessionId },
            (error) => createWorkoutError("mutation_error", "Failed to cancel workout", error)
        );

        if (result.isOk()) {
            store.reset();
        }

        return result.map(() => undefined);
    }, [store, cancelMutation]);

    return {
        // State
        workoutSessionId: store.workoutSessionId,
        routineId: store.routineId,
        routineName: store.routineName,
        exercises: store.exercises,
        currentExerciseIndex: store.currentExerciseIndex,
        sets: store.sets,
        startedAt: store.startedAt,
        isPaused: store.isPaused,
        hasActiveWorkout,

        // Exercise navigation
        setCurrentExerciseIndex: store.setCurrentExerciseIndex,
        nextExercise: store.nextExercise,
        previousExercise: store.previousExercise,
        getCurrentExerciseSets: store.getCurrentExerciseSets,

        // Duration
        getActiveDuration: store.getActiveDuration,

        // Actions
        startWorkout,
        addSet,
        updateSet,
        removeSet,
        pauseWorkout,
        resumeWorkout,
        completeWorkout,
        cancelWorkout,

        // Loading states
        isStarting,
        isCompleting,
        isSavingSet,
    };
}
