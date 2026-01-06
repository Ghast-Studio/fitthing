/**
 * Utility functions for working with neverthrow Result types
 */

import { err, ok, Result } from "neverthrow";

/**
 * Wrap an async function that may throw into a Result
 */
export function fromThrowable<T, E = Error>(
  fn: () => Promise<T>,
  errorMapper?: (error: unknown) => E
): Promise<Result<T, E>> {
  return Promise.resolve()
    .then(() => fn())
    .then((value) => ok(value))
    .catch((error) => {
      if (errorMapper) {
        return err(errorMapper(error));
      }
      // Normalize unknown error into Error instance when no mapper provided
      const normalizedError =
        error instanceof Error
          ? (error as E)
          : (new Error(String(error)) as unknown as E);
      return err(normalizedError);
    });
}

/**
 * Wrap a Convex mutation call into a Result
 */
export async function wrapConvexMutation<T, E = Error>(
  mutation: (args: any) => Promise<T>,
  args: any,
  errorMapper?: (error: unknown) => E
): Promise<Result<T, E>> {
  return fromThrowable(() => mutation(args), errorMapper);
}

/**
 * Wrap a Convex query call into a Result
 */
export async function wrapConvexQuery<T, E = Error>(
  query: (args: any) => Promise<T>,
  args: any,
  errorMapper?: (error: unknown) => E
): Promise<Result<T, E>> {
  return fromThrowable(() => query(args), errorMapper);
}

/**
 * Execute a Result and handle success/error with callbacks
 */
export function executeResult<T, E>(
  result: Result<T, E>,
  onSuccess: (value: T) => void,
  onError: (error: E) => void
): void {
  result.match(onSuccess, onError);
}

/**
 * Execute a Result and return a default value on error
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.match(
    (value: T) => value,
    () => defaultValue
  );
}

/**
 * Execute a Result and throw on error (for cases where you need to throw)
 */
export function unwrapOrThrow<T, E>(result: Result<T, E>): T {
  return result.match(
    (value: T) => value,
    (error: E) => {
      throw error;
    }
  );
}
