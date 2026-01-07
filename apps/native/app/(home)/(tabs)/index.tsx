import { useEffect } from "react";
import { Pressable, ScrollView, View, Text } from "react-native";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";

import { Container } from "@/components/container";

import { api } from "@ex/backend/convex/_generated/api";

import { useWorkoutSession } from "@/utils/useWorkoutSession";

export default function HomePage() {
    const { user } = useUser();
    const backgroundColor = useThemeColor("background");
    const accentColor = useThemeColor("accent");
    const mutedColor = useThemeColor("muted");

    const needsOnboarding = useQuery(api.userProfiles.needsOnboarding, {});
    const routines = useQuery(api.routines.list, {});

    // Redirect to onboarding if needed
    useEffect(() => {
        if (needsOnboarding) {
            router.replace("/(home)/onboarding");
        }
    }, [needsOnboarding]);

    const isLoading = routines === undefined || needsOnboarding === undefined;

    const { activeSession } = useWorkoutSession();

    // Find active workout routine name
    const activeWorkoutRoutine = routines?.find((r) => r._id === activeSession?.routineId);

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m`;
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <Spinner size="lg" />
            </View>
        );
    }

    return (
        <Container>
            <ScrollView className="flex-1" contentContainerClassName="p-5">
                {/* Header */}
                <View className="mb-6 pt-2">
                    <Text className="text-muted text-sm">Willkommen zurück</Text>
                    <Text className="text-foreground text-3xl font-extrabold">
                        {user?.firstName || "User"}
                    </Text>
                </View>

                {/* Active Workout Banner */}
                {activeSession && (
                    <Pressable
                        onPress={() => router.push("/(home)/workout/active")}
                        className="bg-accent rounded-xl p-4 mb-5"
                    >
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-white font-semibold text-base">
                                    Aktives Training
                                </Text>
                                <Text className="text-white/80 text-sm">
                                    {activeWorkoutRoutine?.name || "Schnelles Training"}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <Text className="text-white font-semibold">
                                    {formatDuration(Date.now() - activeSession.startedAt)}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </View>
                        </View>
                    </Pressable>
                )}

                {/* Quick Actions */}
                <View className="mb-6">
                    <Text className="text-foreground text-lg font-bold mb-3">Schnellaktionen</Text>
                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={() => router.push("/(home)/(tabs)/exercises")}
                            className="flex-1 bg-background rounded-xl p-4 items-center border border-muted"
                        >
                            <Ionicons name="barbell" size={28} color={accentColor} />
                            <Text className="text-foreground mt-2 font-semibold">Übungen</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => router.push("/(home)/routine/create")}
                            className="flex-1 bg-background rounded-xl p-4 items-center border border-muted"
                        >
                            <Ionicons name="add-circle" size={28} color={accentColor} />
                            <Text className="text-foreground mt-2 font-semibold">Neue Routine</Text>
                        </Pressable>
                    </View>
                </View>

                {/* My Routines */}
                <View className="mb-6">
                    <Text className="text-foreground text-lg font-bold mb-3">Meine Routinen</Text>
                    {routines && routines.length > 0 ? (
                        routines.map((routine) => (
                            <Surface key={routine._id} className="rounded-xl p-4 mb-3">
                                <Text className="text-foreground text-base font-semibold">
                                    {routine.name}
                                </Text>
                                <Text className="text-muted mt-1">
                                    {routine.exercises.length} Übungen
                                </Text>
                                <Button
                                    className="mt-3"
                                    onPress={() =>
                                        router.navigate(`/(home)/workout/${routine._id}`)
                                    }
                                >
                                    <Button.Label>Starten</Button.Label>
                                </Button>
                            </Surface>
                        ))
                    ) : (
                        <Surface className="rounded-xl p-6 items-center">
                            <Ionicons name="fitness" size={48} color={mutedColor} />
                            <Text className="text-muted mt-3 text-center">
                                Noch keine Routinen. Erstelle deine erste Routine!
                            </Text>
                        </Surface>
                    )}
                </View>
            </ScrollView>
        </Container>
    );
}
