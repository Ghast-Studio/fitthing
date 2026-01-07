import { create } from "zustand";

import type {
    ExerciseType,
    RoutineExercise,
    WorkoutSet,
} from "@ex/backend/convex/schema";

// ===== Re-export types from schema =====
export type { RoutineExercise, WorkoutSet };

// ===== Set Label Type =====
export type SetLabel = "warmup" | "working" | "dropset" | "failure" | "pr" | "backoff";

// ===== Weight Unit Type =====
export type WeightUnit = "kg" | "lbs";

// ===== Side Type (for unilateral exercises) =====
export type Side = "left" | "right" | "both";

// ===== Routine Store =====
export interface RoutineState {
    name: string;
    description: string;
    exercises: RoutineExercise[];
    visibility: "private" | "friends" | "public";
    setName: (name: string) => void;
    setDescription: (description: string) => void;
    setVisibility: (visibility: "private" | "friends" | "public") => void;
    addExercise: (exercise: RoutineExercise) => void;
    removeExercise: (exerciseId: string) => void;
    updateExercise: (exerciseId: string, updates: Partial<RoutineExercise>) => void;
    reorderExercises: (fromIndex: number, toIndex: number) => void;
    reset: () => void;
}

export const useRoutineStore = create<RoutineState>((set) => ({
    name: "",
    description: "",
    exercises: [],
    visibility: "private",
    setName: (name) => set({ name }),
    setDescription: (description) => set({ description }),
    setVisibility: (visibility) => set({ visibility }),
    addExercise: (exercise) =>
        set((state) => {
            // Auto-assign order based on current length
            const newExercise = {
                ...exercise,
                order: state.exercises.length,
            };
            return { exercises: [...state.exercises, newExercise] };
        }),
    removeExercise: (exerciseId) =>
        set((state) => {
            const filtered = state.exercises.filter((e) => e.exerciseId !== exerciseId);
            // Re-assign order after removal
            return {
                exercises: filtered.map((e, i) => ({ ...e, order: i })),
            };
        }),
    updateExercise: (exerciseId, updates) =>
        set((state) => ({
            exercises: state.exercises.map((e) =>
                e.exerciseId === exerciseId ? { ...e, ...updates } : e
            ),
        })),
    reorderExercises: (fromIndex, toIndex) =>
        set((state) => {
            const exercises = [...state.exercises];
            const [removed] = exercises.splice(fromIndex, 1);
            exercises.splice(toIndex, 0, removed);
            // Re-assign order after reorder
            return {
                exercises: exercises.map((e, i) => ({ ...e, order: i })),
            };
        }),
    reset: () => set({ name: "", description: "", exercises: [], visibility: "private" }),
}));

// ===== Local Set (for UI before saving to DB) =====
export interface LocalSet {
    localId: string; // Temporary ID before saved
    exerciseId: string;
    exerciseSetNumber: number;
    reps: number;
    weight: number;
    weightUnit: WeightUnit;
    side?: Side; // For unilateral exercises: left, right, or both (default)
    label?: SetLabel;
    note?: string;
    rpe?: number;
    savedToDb: boolean;
    dbId?: string; // Set after saved to DB
}

// ===== Active Workout Store =====
export interface ActiveWorkoutState {
    workoutSessionId: string | null;
    routineId: string | null;
    routineName: string | null;
    exercises: RoutineExercise[];
    currentExerciseIndex: number;
    sets: LocalSet[];
    startedAt: number | null;
    isPaused: boolean;
    pausedAt: number | null;
    totalPausedTime: number;

    // Actions
    startWorkout: (
        workoutSessionId: string,
        routineId: string,
        routineName: string,
        exercises: RoutineExercise[]
    ) => void;
    addSet: (set: Omit<LocalSet, "localId" | "savedToDb">) => string;
    updateSet: (localId: string, updates: Partial<LocalSet>) => void;
    markSetSaved: (localId: string, dbId: string) => void;
    removeSet: (localId: string) => void;
    setCurrentExerciseIndex: (index: number) => void;
    nextExercise: () => void;
    previousExercise: () => void;
    pause: () => void;
    resume: () => void;
    getActiveDuration: () => number;
    getCurrentExerciseSets: () => LocalSet[];
    reset: () => void;
}

const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set, get) => ({
    workoutSessionId: null,
    routineId: null,
    routineName: null,
    exercises: [],
    currentExerciseIndex: 0,
    sets: [],
    startedAt: null,
    isPaused: false,
    pausedAt: null,
    totalPausedTime: 0,

    startWorkout: (workoutSessionId, routineId, routineName, exercises) =>
        set({
            workoutSessionId,
            routineId,
            routineName,
            exercises,
            currentExerciseIndex: 0,
            sets: [],
            startedAt: Date.now(),
            isPaused: false,
            pausedAt: null,
            totalPausedTime: 0,
        }),

    addSet: (setData) => {
        const localId = generateLocalId();
        set((state) => ({
            sets: [
                ...state.sets,
                {
                    ...setData,
                    localId,
                    savedToDb: false,
                },
            ],
        }));
        return localId;
    },

    updateSet: (localId, updates) =>
        set((state) => ({
            sets: state.sets.map((s) => (s.localId === localId ? { ...s, ...updates } : s)),
        })),

    markSetSaved: (localId, dbId) =>
        set((state) => ({
            sets: state.sets.map((s) =>
                s.localId === localId ? { ...s, savedToDb: true, dbId } : s
            ),
        })),

    removeSet: (localId) =>
        set((state) => {
            const setToRemove = state.sets.find((s) => s.localId === localId);
            if (!setToRemove) return state;

            // Remove the set
            const filtered = state.sets.filter((s) => s.localId !== localId);

            // Re-number remaining sets for this exercise
            const exerciseId = setToRemove.exerciseId;
            let exerciseSetNumber = 1;
            const renumbered = filtered.map((s) => {
                if (s.exerciseId === exerciseId) {
                    return { ...s, exerciseSetNumber: exerciseSetNumber++ };
                }
                return s;
            });

            return { sets: renumbered };
        }),

    setCurrentExerciseIndex: (index) => set({ currentExerciseIndex: index }),

    nextExercise: () => {
        const { currentExerciseIndex, exercises } = get();
        if (currentExerciseIndex < exercises.length - 1) {
            set({ currentExerciseIndex: currentExerciseIndex + 1 });
        }
    },

    previousExercise: () => {
        const { currentExerciseIndex } = get();
        if (currentExerciseIndex > 0) {
            set({ currentExerciseIndex: currentExerciseIndex - 1 });
        }
    },

    pause: () =>
        set({
            isPaused: true,
            pausedAt: Date.now(),
        }),

    resume: () => {
        const { pausedAt, totalPausedTime } = get();
        if (pausedAt) {
            const pauseDuration = Date.now() - pausedAt;
            set({
                isPaused: false,
                pausedAt: null,
                totalPausedTime: totalPausedTime + pauseDuration,
            });
        }
    },

    getActiveDuration: () => {
        const { startedAt, isPaused, pausedAt, totalPausedTime } = get();
        if (!startedAt) return 0;

        const now = Date.now();
        let duration = now - startedAt - totalPausedTime;

        // If currently paused, subtract current pause duration
        if (isPaused && pausedAt) {
            duration -= now - pausedAt;
        }

        return Math.max(0, duration);
    },

    getCurrentExerciseSets: () => {
        const { sets, exercises, currentExerciseIndex } = get();
        const currentExercise = exercises[currentExerciseIndex];
        if (!currentExercise) return [];
        return sets.filter((s) => s.exerciseId === currentExercise.exerciseId);
    },

    reset: () =>
        set({
            workoutSessionId: null,
            routineId: null,
            routineName: null,
            exercises: [],
            currentExerciseIndex: 0,
            sets: [],
            startedAt: null,
            isPaused: false,
            pausedAt: null,
            totalPausedTime: 0,
        }),
}));

// ===== Exercise Database Store =====
export interface ExerciseDatabaseState {
    isInitialized: boolean;
    isSyncing: boolean;
    exercises: ExerciseType[];
    version: string | null;
    lastSync: number | null;
    error: string | null;
    setExercises: (exercises: ExerciseType[], version: string, timestamp: number) => void;
    setError: (error: string | null) => void;
    setSyncing: (isSyncing: boolean) => void;
    setInitialized: (isInitialized: boolean) => void;
    clearDatabase: () => void;
}

export const useExerciseDatabaseStore = create<ExerciseDatabaseState>((set) => ({
    isInitialized: false,
    isSyncing: false,
    exercises: [],
    version: null,
    lastSync: null,
    error: null,
    setExercises: (exercises, version, timestamp) =>
        set({
            exercises,
            version,
            lastSync: timestamp,
            isInitialized: true,
            isSyncing: false,
            error: null,
        }),
    setError: (error) => set({ error, isSyncing: false }),
    setSyncing: (isSyncing) => set({ isSyncing, error: null }),
    setInitialized: (isInitialized) => set({ isInitialized }),
    clearDatabase: () =>
        set({
            isInitialized: false,
            isSyncing: false,
            exercises: [],
            version: null,
            lastSync: null,
            error: null,
        }),
}));

// ===== Onboarding Store =====
export type RecordingPlan = "minimal" | "balanced" | "detailed" | "custom";
export type WeeklyGoal = "1" | "2" | "3" | "4" | "5" | "6" | "7";
export type RestTime = "1min" | "2min" | "5min" | "custom";

export interface OnboardingState {
    step: number;
    selectedGoals: string[];
    recordingPlan: RecordingPlan | null;
    weeklyGoal: WeeklyGoal;
    restTime: RestTime;
    createPlan: boolean;

    // Actions
    setStep: (step: number) => void;
    nextStep: () => void;
    previousStep: () => void;
    toggleGoal: (goalId: string) => void;
    setRecordingPlan: (plan: RecordingPlan) => void;
    setWeeklyGoal: (goal: WeeklyGoal) => void;
    setRestTime: (time: RestTime) => void;
    setCreatePlan: (create: boolean) => void;
    canProceed: () => boolean;
    reset: () => void;
}

const TOTAL_STEPS = 5;

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
    step: 1,
    selectedGoals: [],
    recordingPlan: "balanced",
    weeklyGoal: "3",
    restTime: "2min",
    createPlan: false,

    setStep: (step) => set({ step }),

    nextStep: () => {
        const { step } = get();
        if (step < TOTAL_STEPS) {
            set({ step: step + 1 });
        }
    },

    previousStep: () => {
        const { step } = get();
        if (step > 1) {
            set({ step: step - 1 });
        }
    },

    toggleGoal: (goalId) =>
        set((state) => ({
            selectedGoals: state.selectedGoals.includes(goalId)
                ? state.selectedGoals.filter((g) => g !== goalId)
                : [...state.selectedGoals, goalId],
        })),

    setRecordingPlan: (plan) => set({ recordingPlan: plan }),

    setWeeklyGoal: (goal) => set({ weeklyGoal: goal }),

    setRestTime: (time) => set({ restTime: time }),

    setCreatePlan: (create) => set({ createPlan: create }),

    canProceed: () => {
        const { step, selectedGoals, recordingPlan, weeklyGoal, restTime } = get();
        switch (step) {
            case 1:
                return selectedGoals.length > 0;
            case 2:
                return recordingPlan !== null;
            case 3:
                return weeklyGoal !== null;
            case 4:
                return restTime !== null;
            case 5:
                return true;
            default:
                return false;
        }
    },

    reset: () =>
        set({
            step: 1,
            selectedGoals: [],
            recordingPlan: null,
            weeklyGoal: "3",
            restTime: "2min",
            createPlan: false,
        }),
}));
