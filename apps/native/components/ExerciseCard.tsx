import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, useThemeColor } from "heroui-native";

import type { ExerciseType } from "@ex/backend/convex/schema";

interface ExerciseCardProps {
    exercise: ExerciseType;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
    const router = useRouter();
    const foregroundColor = useThemeColor("foreground");
    const mutedForeground = useThemeColor("muted");
    const primaryColor = useThemeColor("accent");

    const levelColorMap: Record<string, "success" | "warning" | "accent" | "default"> = {
        beginner: "success",
        intermediate: "warning",
        advanced: "accent",
        expert: "accent",
    };

    const levelColor = levelColorMap[exercise.level.toLowerCase()] || "default";

    return (
        <Pressable
            onPress={() => router.push(`/(home)/exercise/${exercise.externalId}` as any)}
            style={styles.pressable}
        >
            <Card variant="secondary">
                <Card.Body className="flex-row items-center">
                    <View style={styles.exerciseContent}>
                        <View style={styles.exerciseInfo}>
                            <Text
                                style={[styles.exerciseName, { color: foregroundColor }]}
                                numberOfLines={2}
                            >
                                {exercise.name}
                            </Text>
                            <View style={styles.metaInfo}>
                                <Chip size="sm" variant="secondary" color="default">
                                    <Chip.Label>{exercise.category}</Chip.Label>
                                </Chip>
                                <Chip size="sm" variant="soft" color={levelColor}>
                                    <Chip.Label>{exercise.level}</Chip.Label>
                                </Chip>
                            </View>
                        </View>
                        <View style={styles.muscleInfo}>
                            <Text style={[styles.muscleLabel, { color: mutedForeground }]}>
                                PRIMARY
                            </Text>
                            <Text
                                style={[styles.muscleText, { color: mutedForeground }]}
                                numberOfLines={2}
                            >
                                {exercise.primaryMuscles.slice(0, 2).join(", ")}
                                {exercise.primaryMuscles.length > 2 &&
                                    ` +${exercise.primaryMuscles.length - 2}`}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.arrowIcon}>
                        <Ionicons name="chevron-forward" size={24} color={mutedForeground} />
                    </View>
                </Card.Body>
            </Card>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        marginBottom: 12,
    },
    exerciseContent: {
        flex: 1,
        gap: 12,
    },
    exerciseInfo: {
        gap: 8,
    },
    exerciseName: {
        fontSize: 17,
        fontWeight: "700",
        lineHeight: 22,
    },
    metaInfo: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    muscleInfo: {
        gap: 4,
    },
    muscleLabel: {
        textTransform: "uppercase",
        fontSize: 11,
        fontWeight: "500",
    },
    muscleText: {
        fontSize: 13,
        textTransform: "capitalize",
    },
    arrowIcon: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
    },
});
