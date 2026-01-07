import { create } from "zustand";

import type { ExerciseType } from "@ex/backend/convex/schema";

// ===== Exercise In Routine Type =====
export interface ExerciseInRoutine {
    exerciseId: string;
    sets: number;
    reps: number;
    notes?: string;
}

// ===== Routine Store =====
export interface RoutineState {
    name: string;
    description: string;
    exercises: ExerciseInRoutine[];
    visibility: "private" | "friends" | "public";
    setName: (name: string) => void;
    setDescription: (description: string) => void;
    setVisibility: (visibility: "private" | "friends" | "public") => void;
    addExercise: (exercise: ExerciseInRoutine) => void;
    removeExercise: (exerciseId: string) => void;
    updateExercise: (exerciseId: string, updates: Partial<ExerciseInRoutine>) => void;
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
        set((state) => ({
            exercises: [...state.exercises, exercise],
        })),
    removeExercise: (exerciseId) =>
        set((state) => ({
            exercises: state.exercises.filter((e) => e.exerciseId !== exerciseId),
        })),
    updateExercise: (exerciseId, updates) =>
        set((state) => ({
            exercises: state.exercises.map((e) =>
                e.exerciseId === exerciseId ? { ...e, ...updates } : e
            ),
        })),
    reset: () => set({ name: "", description: "", exercises: [], visibility: "private" }),
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
