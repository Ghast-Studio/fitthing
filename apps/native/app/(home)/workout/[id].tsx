import { useEffect } from "react";
import { Alert, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";

import { Container } from "@/components/container";
import { api } from "@/utils/convex";
import { useWorkoutSession } from "@/utils/useWorkoutSession";

export default function StartWorkoutPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const accentColor = useThemeColor("accent");
    const mutedColor = useThemeColor("muted");

    const routine = useQuery(api.routines.getById, { id: id as any });
    const { hasActiveWorkout, startWorkout, isStarting } = useWorkoutSession();

    // Get exercise details
    const exerciseIds = routine?.exercises.map((e: any) => e.exerciseId) ?? [];
    const exercisesData = useQuery(
        api.exercises.getByIds,
        exerciseIds.length > 0 ? { ids: exerciseIds } : "skip"
    );
    const allExercises = exercisesData?.exercises ?? [];

    // Redirect to active workout if there's already one
    useEffect(() => {
        if (hasActiveWorkout) {
            router.replace("/(home)/workout/active");
        }
    }, [hasActiveWorkout]);

    const handleStartWorkout = async () => {
        if (!routine) return;

        const result = await startWorkout(
            id,
            routine.name,
            routine.exercises,
            routine.visibility as "private" | "friends" | "public"
        );

        result.match(
            () => router.replace("/(home)/workout/active"),
            () => Alert.alert("Fehler", "Workout konnte nicht gestartet werden.")
        );
    };

    if (routine === undefined) {
        return (
            <Container>
                <Stack.Screen options={{ title: "Workout starten", headerShown: true }} />
                <View className="flex-1 justify-center items-center">
                    <Spinner size="lg" />
                </View>
            </Container>
        );
    }

    if (routine === null) {
        return (
            <Container>
                <Stack.Screen options={{ title: "Workout", headerShown: true }} />
                <View className="flex-1 justify-center items-center p-5">
                    <Ionicons name="alert-circle-outline" size={64} color={mutedColor} />
                    <Text className="text-muted mt-4 text-center">Routine nicht gefunden</Text>
                </View>
            </Container>
        );
    }

    const totalSets = routine.exercises.reduce(
        (sum: number, ex: any) => sum + (ex.targetSets || ex.sets || 0),
        0
    );

    return (
        <Container>
            <Stack.Screen
                options={{
                    title: "Workout starten",
                    headerShown: true,
                }}
            />
            <View className="flex-1 justify-center items-center p-5">
                <Ionicons name="fitness" size={80} color={accentColor} />

                <Text className="text-foreground text-3xl font-extrabold mt-6 text-center">
                    {routine.name}
                </Text>

                {routine.description && (
                    <Text className="text-muted text-center mt-2">{routine.description}</Text>
                )}

                {/* Stats */}
                <View className="flex-row gap-8 mt-8 mb-8">
                    <View className="items-center">
                        <Text className="text-accent text-4xl font-bold">
                            {routine.exercises.length}
                        </Text>
                        <Text className="text-muted">Übungen</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-accent text-4xl font-bold">{totalSets}</Text>
                        <Text className="text-muted">Sets</Text>
                    </View>
                </View>

                {/* Exercise Preview */}
                <Surface className="w-full rounded-xl p-4 mb-8">
                    <Text className="text-muted text-sm mb-2">Übungen:</Text>
                    {routine.exercises.slice(0, 4).map((exercise: any, index: number) => {
                        const exerciseData = allExercises.find(
                            (ex: any) => ex.externalId === exercise.exerciseId
                        );
                        return (
                            <Text
                                key={`${exercise.exerciseId}-${index}`}
                                className="text-foreground"
                            >
                                • {exerciseData?.name || exercise.exerciseId}
                            </Text>
                        );
                    })}
                    {routine.exercises.length > 4 && (
                        <Text className="text-muted mt-1">
                            + {routine.exercises.length - 4} weitere
                        </Text>
                    )}
                </Surface>

                {/* Start Button */}
                <Button
                    variant="primary"
                    size="lg"
                    onPress={handleStartWorkout}
                    isDisabled={isStarting}
                    className="w-full"
                >
                    {isStarting ? (
                        <Spinner size="sm" color="white" />
                    ) : (
                        <>
                            <Ionicons name="play-circle" size={24} color="#fff" />
                            <Button.Label>Workout starten</Button.Label>
                        </>
                    )}
                </Button>
            </View>
        </Container>
    );
}
