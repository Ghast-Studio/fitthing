import { useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Spinner, Surface, useThemeColor } from "heroui-native";
import { Text } from "react-native";
import { useDebounce } from "use-debounce";

import { searchLocalExercises } from "@/utils/exerciseSearch";
import { useExerciseDatabase } from "@/utils/useExerciseDatabase";
import { useRoutineStore } from "@/store/store";
import { FlatList } from "react-native-gesture-handler";

export default function SelectExercisePage() {
    const backgroundColor = useThemeColor("background");
    const foregroundColor = useThemeColor("foreground");
    const primaryColor = useThemeColor("accent");
    const mutedForeground = useThemeColor("muted");
    const surfaceColor = useThemeColor("muted");

    const { exercises, isInitialized, isSyncing } = useExerciseDatabase();
    const { addExercise } = useRoutineStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch] = useDebounce(searchQuery, 300);

    const filteredExercises = useMemo(() => {
        if (debouncedSearch) {
            return searchLocalExercises(exercises, debouncedSearch, 50);
        }
        return exercises.slice(0, 50);
    }, [exercises, debouncedSearch]);

    const handleSelectExercise = (exerciseId: string) => {
        addExercise({
            exerciseId,
            sets: 3,
            reps: 10,
        });
        router.back();
    };

    if (!isInitialized || isSyncing) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor,
                }}
            >
                <Spinner size="lg" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["bottom"]}>
            <Stack.Screen
                options={{
                    title: "Select Exercise",
                    headerShown: true,
                }}
            />

            {/* Search */}
            <View style={{ padding: 16 }}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: surfaceColor,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        gap: 8,
                    }}
                >
                    <Ionicons name="search" size={18} color={mutedForeground} />
                    <TextInput
                        style={{
                            flex: 1,
                            color: foregroundColor,
                            fontSize: 16,
                        }}
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={mutedForeground}
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                </View>
            </View>

            <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.externalId}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                renderItem={({ item }) => (
                    <Pressable onPress={() => handleSelectExercise(item.externalId)}>
                        <Surface
                            style={{
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 8,
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: foregroundColor,
                                        fontSize: 15,
                                        fontWeight: "600",
                                    }}
                                >
                                    {item.name}
                                </Text>
                                <Text
                                    style={{
                                        color: mutedForeground,
                                        fontSize: 13,
                                        marginTop: 2,
                                    }}
                                >
                                    {item.primaryMuscles[0]} • {item.level}
                                </Text>
                            </View>
                            <Ionicons name="add-circle" size={24} color={primaryColor} />
                        </Surface>
                    </Pressable>
                )}
            />
        </SafeAreaView>
    );
}
