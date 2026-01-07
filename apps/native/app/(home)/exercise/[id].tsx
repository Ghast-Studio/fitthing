import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { Spinner, Surface, useThemeColor } from "heroui-native";
import { Text } from "react-native";

import { api } from "@ex/backend/convex/_generated/api";

export default function ExerciseDetailPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const backgroundColor = useThemeColor("background");
    const foregroundColor = useThemeColor("foreground");
    const primaryColor = useThemeColor("accent");
    const mutedForeground = useThemeColor("muted");
    const surfaceColor = useThemeColor("muted");

    const exerciseResult = useQuery(api.exercises.getById, { id: id || "" });

    if (!exerciseResult) {
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

    const exercise = exerciseResult.exercise;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["bottom"]}>
            <Stack.Screen
                options={{
                    title: exercise.name,
                    headerShown: true,
                }}
            />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                {/* Name */}
                <Text
                    style={{
                        color: foregroundColor,
                        fontSize: 24,
                        fontWeight: "700",
                        marginBottom: 16,
                    }}
                >
                    {exercise.name}
                </Text>

                {/* Tags */}
                <View
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 8,
                        marginBottom: 24,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: primaryColor + "20",
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                        }}
                    >
                        <Text style={{ color: primaryColor, fontWeight: "600" }}>
                            {exercise.category}
                        </Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: surfaceColor,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                        }}
                    >
                        <Text style={{ color: foregroundColor }}>{exercise.level}</Text>
                    </View>
                    {exercise.equipment && (
                        <View
                            style={{
                                backgroundColor: surfaceColor,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 8,
                            }}
                        >
                            <Text style={{ color: foregroundColor }}>{exercise.equipment}</Text>
                        </View>
                    )}
                </View>

                {/* Muscles */}
                <Surface style={{ borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <Text
                        style={{
                            color: foregroundColor,
                            fontSize: 16,
                            fontWeight: "600",
                            marginBottom: 12,
                        }}
                    >
                        Target Muscles
                    </Text>
                    <Text style={{ color: mutedForeground, marginBottom: 8 }}>Primary:</Text>
                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                            marginBottom: 12,
                        }}
                    >
                        {exercise.primaryMuscles.map((muscle) => (
                            <View
                                key={muscle}
                                style={{
                                    backgroundColor: primaryColor,
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                }}
                            >
                                <Text style={{ color: "#fff", fontSize: 13 }}>{muscle}</Text>
                            </View>
                        ))}
                    </View>
                    {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                        <>
                            <Text style={{ color: mutedForeground, marginBottom: 8 }}>
                                Secondary:
                            </Text>
                            <View
                                style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    gap: 8,
                                }}
                            >
                                {exercise.secondaryMuscles.map((muscle) => (
                                    <View
                                        key={muscle}
                                        style={{
                                            backgroundColor: surfaceColor,
                                            paddingHorizontal: 10,
                                            paddingVertical: 4,
                                            borderRadius: 6,
                                        }}
                                    >
                                        <Text style={{ color: foregroundColor, fontSize: 13 }}>
                                            {muscle}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </Surface>

                {/* Instructions */}
                <Surface style={{ borderRadius: 12, padding: 16 }}>
                    <Text
                        style={{
                            color: foregroundColor,
                            fontSize: 16,
                            fontWeight: "600",
                            marginBottom: 12,
                        }}
                    >
                        Instructions
                    </Text>
                    {exercise.instructions.map((instruction, index) => (
                        <View
                            key={index}
                            style={{
                                flexDirection: "row",
                                marginBottom: 12,
                            }}
                        >
                            <View
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    backgroundColor: primaryColor,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginRight: 12,
                                }}
                            >
                                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
                                    {index + 1}
                                </Text>
                            </View>
                            <Text
                                style={{
                                    color: foregroundColor,
                                    flex: 1,
                                    lineHeight: 22,
                                }}
                            >
                                {instruction}
                            </Text>
                        </View>
                    ))}
                </Surface>
            </ScrollView>
        </SafeAreaView>
    );
}
