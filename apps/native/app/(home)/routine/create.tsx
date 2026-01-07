import { useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { Surface, useThemeColor } from "heroui-native";
import { Text } from "react-native";

import { api } from "@ex/backend/convex/_generated/api";

import { useRoutineStore, RoutineExercise } from "@/store/store";

export default function CreateRoutinePage() {
    const backgroundColor = useThemeColor("background");
    const foregroundColor = useThemeColor("foreground");
    const primaryColor = useThemeColor("accent");
    const mutedForeground = useThemeColor("muted");

    const createRoutine = useMutation(api.routines.create);
    const [isSaving, setIsSaving] = useState(false);

    const {
        name,
        description,
        exercises,
        visibility,
        setName,
        setDescription,
        setVisibility,
        removeExercise,
        updateExercise,
        reset,
    } = useRoutineStore();

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Please enter a routine name");
            return;
        }

        if (exercises.length === 0) {
            Alert.alert("Error", "Please add at least one exercise");
            return;
        }

        setIsSaving(true);
        try {
            await createRoutine({
                name: name.trim(),
                description: description.trim() || undefined,
                exercises,
                visibility,
            });
            reset();
            router.back();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to create routine");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor }} edges={["bottom"]}>
            <Stack.Screen
                options={{
                    title: "Create Routine",
                    headerShown: true,
                }}
            />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                {/* Name */}
                <View style={{ marginBottom: 20 }}>
                    <Text
                        style={{
                            color: foregroundColor,
                            fontSize: 14,
                            fontWeight: "600",
                            marginBottom: 8,
                        }}
                    >
                        Routine Name
                    </Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g., Push Day"
                        placeholderTextColor={mutedForeground}
                        style={{
                            color: foregroundColor,
                            borderWidth: 1,
                            borderColor: mutedForeground,
                            borderRadius: 12,
                            padding: 14,
                            fontSize: 16,
                        }}
                    />
                </View>

                {/* Description */}
                <View style={{ marginBottom: 20 }}>
                    <Text
                        style={{
                            color: foregroundColor,
                            fontSize: 14,
                            fontWeight: "600",
                            marginBottom: 8,
                        }}
                    >
                        Description (optional)
                    </Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe your routine..."
                        placeholderTextColor={mutedForeground}
                        multiline
                        numberOfLines={3}
                        style={{
                            color: foregroundColor,
                            borderWidth: 1,
                            borderColor: mutedForeground,
                            borderRadius: 12,
                            padding: 14,
                            fontSize: 16,
                            minHeight: 80,
                            textAlignVertical: "top",
                        }}
                    />
                </View>

                {/* Visibility */}
                <View style={{ marginBottom: 20 }}>
                    <Text
                        style={{
                            color: foregroundColor,
                            fontSize: 14,
                            fontWeight: "600",
                            marginBottom: 8,
                        }}
                    >
                        Visibility
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        {(["private", "friends", "public"] as const).map((v) => (
                            <Pressable
                                key={v}
                                onPress={() => setVisibility(v)}
                                style={{
                                    flex: 1,
                                    padding: 12,
                                    borderRadius: 8,
                                    backgroundColor:
                                        visibility === v ? primaryColor : "transparent",
                                    borderWidth: 1,
                                    borderColor: visibility === v ? primaryColor : mutedForeground,
                                }}
                            >
                                <Text
                                    style={{
                                        color: visibility === v ? "#fff" : foregroundColor,
                                        textAlign: "center",
                                        textTransform: "capitalize",
                                        fontWeight: "600",
                                    }}
                                >
                                    {v}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Exercises */}
                <View style={{ marginBottom: 20 }}>
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                        }}
                    >
                        <Text
                            style={{
                                color: foregroundColor,
                                fontSize: 14,
                                fontWeight: "600",
                            }}
                        >
                            Exercises ({exercises.length})
                        </Text>
                        <Pressable
                            onPress={() => router.push("/(home)/routine/select-exercise")}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                            }}
                        >
                            <Ionicons name="add" size={20} color={primaryColor} />
                            <Text style={{ color: primaryColor, fontWeight: "600" }}>Add</Text>
                        </Pressable>
                    </View>

                    {exercises.length === 0 ? (
                        <Surface
                            style={{
                                borderRadius: 12,
                                padding: 24,
                                alignItems: "center",
                            }}
                        >
                            <Ionicons name="barbell" size={40} color={mutedForeground} />
                            <Text
                                style={{
                                    color: mutedForeground,
                                    marginTop: 8,
                                    textAlign: "center",
                                }}
                            >
                                No exercises added yet
                            </Text>
                        </Surface>
                    ) : (
                        exercises.map((exercise, index) => (
                            <Surface
                                key={exercise.exerciseId}
                                style={{
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 8,
                                }}
                            >
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: foregroundColor, fontWeight: "600" }}>
                                            Exercise {index + 1}
                                        </Text>
                                        <Text style={{ color: mutedForeground, fontSize: 13 }}>
                                            {exercise.targetSets} sets × {exercise.targetReps} reps
                                        </Text>
                                    </View>
                                    <Pressable onPress={() => removeExercise(exercise.exerciseId)}>
                                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                    </Pressable>
                                </View>
                                {/* Unilateral Toggle */}
                                <Pressable
                                    onPress={() => updateExercise(exercise.exerciseId, { isUnilateral: !exercise.isUnilateral })}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginTop: 12,
                                        gap: 8,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 4,
                                            borderWidth: 2,
                                            borderColor: exercise.isUnilateral ? primaryColor : mutedForeground,
                                            backgroundColor: exercise.isUnilateral ? primaryColor : "transparent",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {exercise.isUnilateral && (
                                            <Ionicons name="checkmark" size={14} color="#fff" />
                                        )}
                                    </View>
                                    <Text style={{ color: foregroundColor, fontSize: 14 }}>
                                        Unilateral (L/R separat tracken)
                                    </Text>
                                </Pressable>
                            </Surface>
                        ))
                    )}
                </View>

                {/* Save Button */}
                <Pressable
                    onPress={handleSave}
                    disabled={isSaving}
                    style={{
                        backgroundColor: primaryColor,
                        padding: 16,
                        borderRadius: 12,
                        opacity: isSaving ? 0.6 : 1,
                        marginBottom: 40,
                    }}
                >
                    <Text
                        style={{
                            color: "#fff",
                            textAlign: "center",
                            fontWeight: "700",
                            fontSize: 16,
                        }}
                    >
                        {isSaving ? "Saving..." : "Create Routine"}
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
