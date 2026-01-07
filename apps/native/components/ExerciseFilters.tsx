import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Chip, useThemeColor } from "heroui-native";

import type { ExerciseFiltersType } from "@ex/backend/convex/schema";

interface Props {
    visible: boolean;
    onClose: () => void;
    filters: ExerciseFiltersType;
    onApplyFilters: (filters: ExerciseFiltersType) => void;
}

const MUSCLES = [
    "abdominals",
    "abductors",
    "adductors",
    "biceps",
    "calves",
    "chest",
    "forearms",
    "glutes",
    "hamstrings",
    "lats",
    "lower back",
    "middle back",
    "neck",
    "quadriceps",
    "shoulders",
    "traps",
    "triceps",
] as const;

const LEVELS = ["beginner", "intermediate", "expert"] as const;

const CATEGORIES = [
    "powerlifting",
    "strength",
    "stretching",
    "cardio",
    "olympic weightlifting",
    "strongman",
    "plyometrics",
] as const;

const EQUIPMENT = [
    "medicine ball",
    "dumbbell",
    "body only",
    "bands",
    "kettlebells",
    "foam roll",
    "cable",
    "machine",
    "barbell",
    "exercise ball",
    "e-z curl bar",
    "other",
] as const;

const MECHANICS = ["isolation", "compound"] as const;

export function ExerciseFiltersModal({ visible, onClose, filters, onApplyFilters }: Props) {
    const backgroundColor = useThemeColor("background");
    const foregroundColor = useThemeColor("foreground");
    const borderColor = useThemeColor("border");
    const primaryColor = useThemeColor("accent");

    const [localFilters, setLocalFilters] = useState<ExerciseFiltersType>(filters);

    const toggleMuscle = (muscle: (typeof MUSCLES)[number], type: "primary" | "secondary") => {
        const key = type === "primary" ? "primaryMuscles" : "secondaryMuscles";
        const current = localFilters[key] ?? [];
        const newMuscles = current.includes(muscle)
            ? current.filter((m) => m !== muscle)
            : [...current, muscle];

        setLocalFilters({
            ...localFilters,
            [key]: newMuscles.length > 0 ? newMuscles : undefined,
        });
    };

    const handleApply = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    const handleClear = () => {
        setLocalFilters({});
    };

    const activeFilterCount =
        (localFilters.primaryMuscles?.length ?? 0) +
        (localFilters.secondaryMuscles?.length ?? 0) +
        (localFilters.level ? 1 : 0) +
        (localFilters.category ? 1 : 0) +
        (localFilters.equipment ? 1 : 0) +
        (localFilters.mechanic ? 1 : 0);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.container, { backgroundColor }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: borderColor }]}>
                    <Pressable onPress={onClose}>
                        <Ionicons name="close" size={28} color={foregroundColor} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: foregroundColor }]}>Filters</Text>
                    <Pressable onPress={handleClear}>
                        <Text style={[styles.clearText, { color: primaryColor }]}>Clear</Text>
                    </Pressable>
                </View>

                <ScrollView style={styles.content}>
                    {/* Level */}
                    <FilterSection
                        title="Level"
                        borderColor={borderColor}
                        foregroundColor={foregroundColor}
                    >
                        {LEVELS.map((level) => (
                            <Pressable
                                key={level}
                                onPress={() =>
                                    setLocalFilters({
                                        ...localFilters,
                                        level:
                                            localFilters.level === level
                                                ? undefined
                                                : (level as any),
                                    })
                                }
                            >
                                <Chip
                                    size="md"
                                    variant={localFilters.level === level ? "primary" : "secondary"}
                                    color={localFilters.level === level ? "accent" : "default"}
                                >
                                    <Chip.Label>{level}</Chip.Label>
                                </Chip>
                            </Pressable>
                        ))}
                    </FilterSection>

                    {/* Category */}
                    <FilterSection
                        title="Category"
                        borderColor={borderColor}
                        foregroundColor={foregroundColor}
                    >
                        {CATEGORIES.map((category) => (
                            <Pressable
                                key={category}
                                onPress={() =>
                                    setLocalFilters({
                                        ...localFilters,
                                        category:
                                            localFilters.category === category
                                                ? undefined
                                                : (category as any),
                                    })
                                }
                            >
                                <Chip
                                    size="md"
                                    variant={
                                        localFilters.category === category ? "primary" : "secondary"
                                    }
                                    color={
                                        localFilters.category === category ? "accent" : "default"
                                    }
                                >
                                    <Chip.Label>{category}</Chip.Label>
                                </Chip>
                            </Pressable>
                        ))}
                    </FilterSection>

                    {/* Primary Muscles */}
                    <FilterSection
                        title="Primary Muscles"
                        borderColor={borderColor}
                        foregroundColor={foregroundColor}
                    >
                        {MUSCLES.map((muscle) => (
                            <Pressable key={muscle} onPress={() => toggleMuscle(muscle, "primary")}>
                                <Chip
                                    size="md"
                                    variant={
                                        localFilters.primaryMuscles?.includes(muscle)
                                            ? "primary"
                                            : "secondary"
                                    }
                                    color={
                                        localFilters.primaryMuscles?.includes(muscle)
                                            ? "accent"
                                            : "default"
                                    }
                                >
                                    <Chip.Label>{muscle}</Chip.Label>
                                </Chip>
                            </Pressable>
                        ))}
                    </FilterSection>

                    {/* Secondary Muscles */}
                    <FilterSection
                        title="Secondary Muscles"
                        borderColor={borderColor}
                        foregroundColor={foregroundColor}
                    >
                        {MUSCLES.map((muscle) => (
                            <Pressable
                                key={muscle}
                                onPress={() => toggleMuscle(muscle, "secondary")}
                            >
                                <Chip
                                    size="md"
                                    variant={
                                        localFilters.secondaryMuscles?.includes(muscle)
                                            ? "primary"
                                            : "secondary"
                                    }
                                    color={
                                        localFilters.secondaryMuscles?.includes(muscle)
                                            ? "accent"
                                            : "default"
                                    }
                                >
                                    <Chip.Label>{muscle}</Chip.Label>
                                </Chip>
                            </Pressable>
                        ))}
                    </FilterSection>

                    {/* Equipment */}
                    <FilterSection
                        title="Equipment"
                        borderColor={borderColor}
                        foregroundColor={foregroundColor}
                    >
                        {EQUIPMENT.map((equipment) => (
                            <Pressable
                                key={equipment}
                                onPress={() =>
                                    setLocalFilters({
                                        ...localFilters,
                                        equipment:
                                            localFilters.equipment === equipment
                                                ? undefined
                                                : (equipment as any),
                                    })
                                }
                            >
                                <Chip
                                    size="md"
                                    variant={
                                        localFilters.equipment === equipment
                                            ? "primary"
                                            : "secondary"
                                    }
                                    color={
                                        localFilters.equipment === equipment ? "accent" : "default"
                                    }
                                >
                                    <Chip.Label>{equipment}</Chip.Label>
                                </Chip>
                            </Pressable>
                        ))}
                    </FilterSection>

                    {/* Mechanic */}
                    <FilterSection
                        title="Mechanic"
                        borderColor={borderColor}
                        foregroundColor={foregroundColor}
                    >
                        {MECHANICS.map((mechanic) => (
                            <Pressable
                                key={mechanic}
                                onPress={() =>
                                    setLocalFilters({
                                        ...localFilters,
                                        mechanic:
                                            localFilters.mechanic === mechanic
                                                ? undefined
                                                : (mechanic as any),
                                    })
                                }
                            >
                                <Chip
                                    size="md"
                                    variant={
                                        localFilters.mechanic === mechanic ? "primary" : "secondary"
                                    }
                                    color={
                                        localFilters.mechanic === mechanic ? "accent" : "default"
                                    }
                                >
                                    <Chip.Label>{mechanic}</Chip.Label>
                                </Chip>
                            </Pressable>
                        ))}
                    </FilterSection>
                </ScrollView>

                {/* Footer */}
                <View style={[styles.footer, { borderTopColor: borderColor }]}>
                    <Button onPress={handleApply}>
                        <Button.Label>
                            Apply {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
                        </Button.Label>
                    </Button>
                </View>
            </View>
        </Modal>
    );
}

interface FilterSectionProps {
    title: string;
    borderColor: string;
    foregroundColor: string;
    children: React.ReactNode;
}

function FilterSection({ title, borderColor, foregroundColor, children }: FilterSectionProps) {
    return (
        <View style={[styles.section, { borderBottomColor: borderColor }]}>
            <Text style={[styles.sectionTitle, { color: foregroundColor }]}>{title}</Text>
            <View style={styles.chipContainer}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
    },
    clearText: {
        fontSize: 16,
        fontWeight: "500",
    },
    content: {
        flex: 1,
    },
    section: {
        borderBottomWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
});
