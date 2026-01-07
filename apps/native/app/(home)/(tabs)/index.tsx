import { useEffect } from "react";
import { Pressable, ScrollView, View, Text } from "react-native";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Spinner, Surface, useThemeColor } from "heroui-native";

import { Container } from "@/components/container";

import { api } from "@ex/backend/convex/_generated/api";

import { useWorkoutSession } from "@/utils/useWorkoutSession";

export default function HomePage() {
    const { user } = useUser();
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

    const { hasActiveWorkout, routineName, getActiveDuration } = useWorkoutSession();

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
                {hasActiveWorkout && (
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
                                    {routineName || "Workout"}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <Text className="text-white font-semibold">
                                    {formatDuration(getActiveDuration())}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </View>
                        </View>
                    </Pressable>
                )}

                {/* Routines List */}
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-foreground text-lg font-bold">Meine Routinen</Text>
                    <Pressable
                        onPress={() => router.push("/(home)/routine/create")}
                        className="flex-row items-center"
                    >
                        <Ionicons name="add" size={20} color={accentColor} />
                        <Text className="text-accent font-semibold ml-1">Neu</Text>
                    </Pressable>
                </View>

                {routines && routines.length > 0 ? (
                    routines.map((routine) => (
                        <Pressable
                            key={routine._id}
                            onPress={() => router.push(`/(home)/routine/${routine._id}` as any)}
                        >
                            <Surface className="rounded-xl p-4 mb-3">
                                <View className="flex-row items-center">
                                    <View className="flex-1">
                                        <Text className="text-foreground text-base font-semibold">
                                            {routine.name}
                                        </Text>
                                        <Text className="text-muted mt-1">
                                            {routine.exercises.length} Übungen •{" "}
                                            {routine.exercises.reduce(
                                                (sum, ex: any) => sum + (ex.targetSets || ex.sets || 0),
                                                0
                                            )}{" "}
                                            Sets
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={20}
                                        color={mutedColor}
                                    />
                                </View>
                            </Surface>
                        </Pressable>
                    ))
                ) : (
                    <Surface className="rounded-xl p-6 items-center">
                        <Ionicons name="fitness" size={48} color={mutedColor} />
                        <Text className="text-muted mt-3 text-center">
                            Noch keine Routinen. Erstelle deine erste Routine!
                        </Text>
                    </Surface>
                )}
            </ScrollView>
        </Container>
    );
}
