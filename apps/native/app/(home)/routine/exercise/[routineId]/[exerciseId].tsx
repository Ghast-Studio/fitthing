import { Pressable, ScrollView, Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Spinner, Surface, useThemeColor } from "heroui-native";

import { Container } from "@/components/container";
import { api } from "@/utils/convex";

const SIDE_LABELS: Record<string, { label: string; color: string }> = {
    left: { label: "L", color: "#3b82f6" },
    right: { label: "R", color: "#22c55e" },
    both: { label: "B", color: "#a855f7" },
};

export default function ExerciseHistoryPage() {
    const { routineId, exerciseId } = useLocalSearchParams<{
        routineId: string;
        exerciseId: string;
    }>();
    const mutedColor = useThemeColor("muted");
    const successColor = useThemeColor("success");

    // Get exercise history for this routine
    const history = useQuery(api.routines.getExerciseHistory, {
        routineId: routineId as any,
        exerciseId: exerciseId,
    });

    // Get exercise details
    const exerciseData = useQuery(api.exercises.getByIds, { ids: [exerciseId] });
    const exercise = exerciseData?.exercises?.[0];

    if (history === undefined) {
        return (
            <Container>
                <Stack.Screen options={{ title: "Übung", headerShown: true }} />
                <View className="flex-1 justify-center items-center">
                    <Spinner size="lg" />
                </View>
            </Container>
        );
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Container>
            <Stack.Screen
                options={{
                    title: exercise?.name || "Übung",
                    headerShown: true,
                }}
            />
            <ScrollView className="flex-1" contentContainerClassName="p-4">
                {/* Exercise Info */}
                {exercise && (
                    <View className="mb-6">
                        <Text className="text-foreground text-xl font-bold">{exercise.name}</Text>
                        {exercise.primaryMuscles && (
                            <Text className="text-muted mt-1">
                                {exercise.primaryMuscles.join(", ")}
                            </Text>
                        )}
                    </View>
                )}

                {/* History by Session */}
                {!history || history.sessions.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-12">
                        <Ionicons name="barbell-outline" size={64} color={mutedColor} />
                        <Text className="text-muted mt-4 text-center">
                            Noch keine Sets für diese Übung absolviert
                        </Text>
                    </View>
                ) : (
                    history.sessions.map((session: any, sessionIndex: number) => (
                        <View key={session.session._id} className="mb-6">
                            {/* Session Header */}
                            <View className="flex-row items-center mb-3">
                                <View className="w-8 h-8 rounded-full bg-accent items-center justify-center mr-3">
                                    <Text className="text-white font-bold">
                                        {history.sessions.length - sessionIndex}
                                    </Text>
                                </View>
                                <View>
                                    <Text className="text-foreground font-semibold">
                                        {formatDate(session.session.startedAt)}
                                    </Text>
                                    <Text className="text-muted text-sm">
                                        {formatTime(session.session.startedAt)}
                                    </Text>
                                </View>
                            </View>

                            {/* Sets in this session */}
                            {session.sets.map((set: any, setIndex: number) => (
                                <Pressable
                                    key={set._id}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(home)/routine/set/[id]",
                                            params: { id: set._id },
                                        } as any)
                                    }
                                >
                                    <Surface className="rounded-xl p-4 mb-2 ml-11">
                                        <View className="flex-row items-center">
                                            <View className="w-6 h-6 rounded-full bg-muted/30 items-center justify-center mr-3">
                                                <Text className="text-muted text-sm font-bold">
                                                    {setIndex + 1}
                                                </Text>
                                            </View>
                                            {/* Side indicator for unilateral exercises */}
                                            {set.side && (
                                                <View 
                                                    style={{ 
                                                        backgroundColor: SIDE_LABELS[set.side]?.color + "20",
                                                        borderColor: SIDE_LABELS[set.side]?.color,
                                                        borderWidth: 1,
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: 4,
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        marginRight: 8,
                                                    }}
                                                >
                                                    <Text 
                                                        style={{ 
                                                            color: SIDE_LABELS[set.side]?.color,
                                                            fontSize: 12,
                                                            fontWeight: "700",
                                                        }}
                                                    >
                                                        {SIDE_LABELS[set.side]?.label}
                                                    </Text>
                                                </View>
                                            )}
                                            <View className="flex-1">
                                                <Text className="text-foreground font-semibold">
                                                    {set.weight} {set.weightUnit} × {set.reps} Wdh
                                                </Text>
                                                {set.label && (
                                                    <View className="flex-row mt-1">
                                                        <View className="bg-accent/20 rounded px-2 py-0.5">
                                                            <Text className="text-accent text-xs">
                                                                {set.label}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                )}
                                                {set.note && (
                                                    <Text className="text-muted text-sm mt-1">
                                                        {set.note}
                                                    </Text>
                                                )}
                                            </View>
                                            {set.rpe && (
                                                <View className="bg-warning/20 rounded-full px-2 py-1 mr-2">
                                                    <Text className="text-warning text-xs font-semibold">
                                                        RPE {set.rpe}
                                                    </Text>
                                                </View>
                                            )}
                                            <Ionicons
                                                name="chevron-forward"
                                                size={18}
                                                color={mutedColor}
                                            />
                                        </View>
                                    </Surface>
                                </Pressable>
                            ))}
                        </View>
                    ))
                )}
            </ScrollView>
        </Container>
    );
}
