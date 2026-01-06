import AsyncStorage from "@react-native-async-storage/async-storage";
import { Result } from "neverthrow";

import type { ExerciseType } from "@ex/backend/convex/schema";

import { fromThrowable } from "./result";

const EXERCISE_DB_KEY = "@exercise_database";
const EXERCISE_VERSION_KEY = "@exercise_version";

export interface ExerciseDatabase {
  version: string;
  timestamp: number;
  exercises: ExerciseType[];
}

export type ExerciseCacheError = {
  type: "storage_error" | "parse_error" | "not_found";
  message: string;
  originalError?: unknown;
};

function createError(
  type: ExerciseCacheError["type"],
  message: string,
  originalError?: unknown
): ExerciseCacheError {
  return { type, message, originalError };
}

/**
 * Get the current version of the local exercise database
 */
export async function getLocalVersion(): Promise<
  Result<string | null, ExerciseCacheError>
> {
  return fromThrowable(
    async () => {
      const version = await AsyncStorage.getItem(EXERCISE_VERSION_KEY);
      return version;
    },
    (error) => createError("storage_error", "Failed to get local version", error)
  );
}

/**
 * Get all exercises from local storage
 */
export async function getLocalExercises(): Promise<
  Result<ExerciseType[] | null, ExerciseCacheError>
> {
  return fromThrowable(
    async () => {
      const data = await AsyncStorage.getItem(EXERCISE_DB_KEY);
      if (!data) return null;

      try {
        const db: ExerciseDatabase = JSON.parse(data);
        return db.exercises;
      } catch (parseError) {
        throw createError(
          "parse_error",
          "Failed to parse exercise database",
          parseError
        );
      }
    },
    (error) => {
      if (error && typeof error === "object" && "type" in error) {
        return error as ExerciseCacheError;
      }
      return createError("storage_error", "Failed to get local exercises", error);
    }
  );
}

/**
 * Save exercises to local storage with version
 */
export async function saveExercisesToLocal(
  exercises: ExerciseType[],
  version: string
): Promise<Result<void, ExerciseCacheError>> {
  return fromThrowable(
    async () => {
      const db: ExerciseDatabase = {
        version,
        timestamp: Date.now(),
        exercises,
      };

      await AsyncStorage.multiSet([
        [EXERCISE_DB_KEY, JSON.stringify(db)],
        [EXERCISE_VERSION_KEY, version],
      ]);
    },
    (error) =>
      createError("storage_error", "Failed to save exercises to local storage", error)
  );
}

/**
 * Clear local exercise cache
 */
export async function clearLocalExercises(): Promise<
  Result<void, ExerciseCacheError>
> {
  return fromThrowable(
    async () => {
      await AsyncStorage.multiRemove([EXERCISE_DB_KEY, EXERCISE_VERSION_KEY]);
    },
    (error) =>
      createError("storage_error", "Failed to clear local exercises", error)
  );
}

/**
 * Get database info (version and timestamp)
 */
export async function getLocalDatabaseInfo(): Promise<
  Result<
    {
      version: string | null;
      timestamp: number | null;
      exerciseCount: number;
    } | null,
    ExerciseCacheError
  >
> {
  return fromThrowable(
    async () => {
      const data = await AsyncStorage.getItem(EXERCISE_DB_KEY);
      if (!data) return null;

      try {
        const db: ExerciseDatabase = JSON.parse(data);
        return {
          version: db.version,
          timestamp: db.timestamp,
          exerciseCount: db.exercises.length,
        };
      } catch (parseError) {
        throw createError(
          "parse_error",
          "Failed to parse exercise database",
          parseError
        );
      }
    },
    (error) => {
      if (error && typeof error === "object" && "type" in error) {
        return error as ExerciseCacheError;
      }
      return createError("storage_error", "Failed to get database info", error);
    }
  );
}
