import type { ExerciseFiltersType, ExerciseType } from "@ex/backend/convex/schema";

/**
 * Apply filters to exercises locally
 */
export function applyLocalFilters(
    exercises: ExerciseType[],
    filters?: ExerciseFiltersType
): ExerciseType[] {
    if (!filters) return exercises;

    return exercises.filter((exercise) => {
        // Filter by primary muscles
        if (filters.primaryMuscles && filters.primaryMuscles.length > 0) {
            const hasMatch = filters.primaryMuscles.some((muscle) =>
                exercise.primaryMuscles.includes(muscle)
            );
            if (!hasMatch) return false;
        }

        // Filter by secondary muscles
        if (filters.secondaryMuscles && filters.secondaryMuscles.length > 0) {
            if (!exercise.secondaryMuscles) return false;
            const hasMatch = filters.secondaryMuscles.some((muscle) =>
                exercise.secondaryMuscles?.includes(muscle)
            );
            if (!hasMatch) return false;
        }

        // Filter by level
        if (filters.level && exercise.level !== filters.level) {
            return false;
        }

        // Filter by category
        if (filters.category && exercise.category !== filters.category) {
            return false;
        }

        // Filter by equipment
        if (filters.equipment && exercise.equipment !== filters.equipment) {
            return false;
        }

        // Filter by mechanic
        if (filters.mechanic && exercise.mechanic !== filters.mechanic) {
            return false;
        }

        return true;
    });
}

/**
 * Tokenize and normalize text for search
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2);
}

/**
 * Create searchable text from exercise
 */
function createSearchableText(exercise: ExerciseType): string {
    return [
        exercise.name.repeat(3), // Boost name importance
        exercise.category,
        exercise.level,
        exercise.primaryMuscles.join(" "),
        exercise.secondaryMuscles?.join(" ") || "",
        exercise.equipment || "",
        exercise.mechanic || "",
        exercise.instructions.slice(0, 3).join(" "),
    ]
        .join(" ")
        .toLowerCase();
}

/**
 * Calculate TF-IDF score for search
 */
function calculateTFIDF(
    query: string,
    documents: { id: string; text: string; exercise: ExerciseType }[]
): Map<string, number> {
    const queryTokens = tokenize(query);
    const scores = new Map<string, number>();

    // Calculate document frequency (DF) for each term
    const documentFrequency = new Map<string, number>();
    const tokenizedDocs = documents.map((doc) => ({
        ...doc,
        tokens: tokenize(doc.text),
    }));

    for (const token of queryTokens) {
        let df = 0;
        for (const doc of tokenizedDocs) {
            if (doc.tokens.includes(token)) {
                df++;
            }
        }
        documentFrequency.set(token, df);
    }

    // Calculate TF-IDF score for each document
    for (const doc of tokenizedDocs) {
        let score = 0;
        const tokenCounts = new Map<string, number>();

        // Calculate term frequency (TF)
        for (const token of doc.tokens) {
            tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
        }

        // Calculate TF-IDF for each query token
        for (const token of queryTokens) {
            const tf = tokenCounts.get(token) || 0;
            const df = documentFrequency.get(token) || 0;

            if (tf > 0 && df > 0) {
                // TF * IDF
                const tfScore = tf / doc.tokens.length;
                const idf = Math.log(documents.length / df);
                score += tfScore * idf;
            }
        }

        // Boost score for exact phrase matches
        if (doc.text.toLowerCase().includes(query.toLowerCase())) {
            score *= 1.5;
        }

        // Boost score for matches in name (most important field)
        const nameMatches = queryTokens.filter((token) =>
            doc.exercise.name.toLowerCase().includes(token)
        ).length;
        score += nameMatches * 0.5;

        scores.set(doc.id, score);
    }

    return scores;
}

/**
 * Perform local TF-IDF search on exercises
 */
export function searchLocalExercises(
    exercises: ExerciseType[],
    searchQuery: string,
    limit: number = 20
): ExerciseType[] {
    if (!searchQuery.trim()) return exercises.slice(0, limit);

    // Create searchable documents
    const documents = exercises.map((exercise) => ({
        id: exercise.externalId,
        text: createSearchableText(exercise),
        exercise,
    }));

    // Calculate TF-IDF scores
    const scores = calculateTFIDF(searchQuery, documents);

    // Sort by score (highest first) and return top results
    return exercises
        .map((exercise) => ({
            exercise,
            score: scores.get(exercise.externalId) || 0,
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.exercise);
}

/**
 * Paginate exercises locally
 */
export function paginateExercises(
    exercises: ExerciseType[],
    page: number,
    pageSize: number = 20
): {
    exercises: ExerciseType[];
    hasMore: boolean;
    total: number;
} {
    const start = page * pageSize;
    const end = start + pageSize;

    return {
        exercises: exercises.slice(start, end),
        hasMore: end < exercises.length,
        total: exercises.length,
    };
}
