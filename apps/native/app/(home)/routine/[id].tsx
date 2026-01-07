import { Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";

import { Container } from "@/components/container";
import { api } from "@/utils/convex";
import { useWorkoutSession } from "@/utils/useWorkoutSession";
import { Id } from "@ex/backend/convex/_generated/dataModel";

export default function RoutineDetailPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const accentColor = useThemeColor("accent");
    const mutedColor = useThemeColor("muted");

    const routine = useQuery(api.routines.getByIdWithHistory, { id: id as Id<"routines"> });
    const { hasActiveWorkout, startWorkout, isStarting } = useWorkoutSession();

    // Get exercise details
    const exerciseIds = routine?.exercises.map((e) => e.exerciseId) ?? [];
    const exercisesData = useQuery(
        api.exercises.getByIds,
        exerciseIds.length > 0 ? { ids: exerciseIds } : "skip"
    );
    const allExercises = exercisesData?.exercises ?? [];

    if (routine === undefined) {
        return (
            <Container>
                <Stack.Screen options={{ title: "Routine", headerShown: true }} />
                <View className="flex-1 justify-center items-center">
                    <Spinner size="lg" />
                </View>
            </Container>
        );
    }

    if (routine === null) {
        return (
            <Container>
                <Stack.Screen options={{ title: "Routine", headerShown: true }} />
                <View className="flex-1 justify-center items-center p-5">
                    <Ionicons name="alert-circle-outline" size={64} color={mutedColor} />
                    <Text className="text-muted mt-4 text-center">Routine nicht gefunden</Text>
                </View>
            </Container>
        );
    }

    const handleStartWorkout = async () => {
        if (hasActiveWorkout) {
            router.push("/(home)/workout/active");
            return;
        }

        const result = await startWorkout(
            id,
            routine.name,
            routine.exercises,
            routine.visibility as "private" | "friends" | "public"
        );

        result.match(
            () => router.replace("/(home)/workout/active"),
            (error) => console.error("Failed to start workout:", error)
        );
    };

    return (
        <Container>
            <Stack.Screen
                options={{
                    title: routine.name,
                    headerShown: true,
                }}
            />
            <ScrollView className="flex-1" contentContainerClassName="p-4">
                {/* Header */}
                <View className="mb-4">
                    {routine.description && (
                        <Text className="text-muted mb-2">{routine.description}</Text>
                    )}
                    <View className="flex-row gap-4">
                        <Text className="text-muted">
                            {routine.exercises.length} Übungen
                        </Text>
                        <Text className="text-muted">
                            {routine.exercises.reduce((sum, ex) => sum + ex.targetSets, 0)} Sets
                        </Text>
                    </View>
                </View>

                {/* Start Workout Button */}
                <Button
                    variant="primary"
                    size="lg"
                    onPress={handleStartWorkout}
                    isDisabled={isStarting}
                    className="mb-6"
                >
                    {isStarting ? (
                        <Spinner size="sm" color="white" />
                    ) : hasActiveWorkout ? (
                        <>
                            <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
                            <Button.Label>Zum aktiven Workout</Button.Label>
                        </>
                    ) : (
                        <>
                            <Ionicons name="play-circle" size={24} color="#fff" />
                            <Button.Label>Workout starten</Button.Label>
                        </>
                    )}
                </Button>

                {/* Exercise List */}
                <Text className="text-foreground text-lg font-bold mb-3">Übungen</Text>
                {routine.exercises.map((exercise, index) => {
                    const exerciseData = allExercises.find(
                        (ex: any) => ex.externalId === exercise.exerciseId
                    );
                    return (
                        <Pressable
                            key={`${exercise.exerciseId}-${index}`}
                            onPress={() =>
                                router.push({
                                    pathname: "/(home)/routine/exercise/[routineId]/[exerciseId]",
                                    params: { routineId: id, exerciseId: exercise.exerciseId },
                                })
                            }
                        >
                            <Surface className="rounded-xl p-4 mb-3">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 rounded-full bg-accent/20 items-center justify-center mr-3">
                                        <Text className="text-accent font-bold">{index + 1}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center gap-2">
                                            <Text className="text-foreground text-base font-semibold">
                                                {exerciseData?.name || exercise.exerciseId}
                                            </Text>
                                            {exercise.isUnilateral && (
                                                <View className="bg-blue-500/20 px-2 py-0.5 rounded">
                                                    <Text className="text-blue-500 text-xs font-semibold">
                                                        L/R
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View className="flex-1 flex-row gap-2 items-center">
                                            <Text className="text-muted text-sm">
                                                {exercise.targetSets} × {exercise.targetReps} Wdh
                                            </Text>
                                            <Ionicons
                                                color={mutedColor}
                                                name="ellipse"
                                                size={4}
                                            />
                                            <Text className="text-muted text-sm">
                                                {routine.exerciseHistory[exercise.exerciseId]?.sets
                                                    .length ?? 0}{" "}
                                                Sets
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Ionicons
                                            name="chevron-forward"
                                            size={20}
                                            color={mutedColor}
                                        />
                                    </View>
                                </View>
                            </Surface>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </Container>
    );
}
