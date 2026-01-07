import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Button, Card, Spinner, useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { FlatList } from "react-native-gesture-handler";

import { api } from "../../../utils/convex";
import { useWorkoutSession } from "../../../utils/useWorkoutSession";
import { formatTime } from "../../../utils/workoutUtils";
import { LocalSet, SetLabel, Side, WeightUnit } from "../../../store/store";

interface SetInputProps {
    set: LocalSet;
    isUnilateral?: boolean;
    onUpdate: (localId: string, updates: Partial<LocalSet>) => void;
    onRemove: (localId: string) => void;
}

const sideLabels: Record<Side, string> = {
    left: "L",
    right: "R",
    both: "B",
};

const sideColors: Record<Side, string> = {
    left: "#3b82f6",  // blue
    right: "#22c55e", // green
    both: "#a855f7",  // purple
};

function SetInputRow({ set, isUnilateral, onUpdate, onRemove }: SetInputProps) {
    const foregroundColor = useThemeColor("foreground");
    const mutedColor = useThemeColor("muted");
    const surfaceColor = useThemeColor("surface");
    const borderColor = useThemeColor("border");
    const successColor = useThemeColor("success");
    const dangerColor = useThemeColor("danger");

    const [localWeight, setLocalWeight] = useState(String(set.weight));
    const [localReps, setLocalReps] = useState(String(set.reps));

    useEffect(() => {
        setLocalWeight(String(set.weight));
        setLocalReps(String(set.reps));
    }, [set.weight, set.reps]);

    const handleWeightBlur = () => {
        const parsed = parseFloat(localWeight);
        const value = isNaN(parsed) ? 0 : parsed;
        if (value !== set.weight) {
            onUpdate(set.localId, { weight: value });
        }
    };

    const handleRepsBlur = () => {
        const parsed = parseInt(localReps, 10);
        const value = isNaN(parsed) ? 0 : parsed;
        if (value !== set.reps) {
            onUpdate(set.localId, { reps: value });
        }
    };

    const handleCycleSide = () => {
        if (!isUnilateral) return;
        const sides: Side[] = ["left", "right", "both"];
        const currentIndex = sides.indexOf(set.side || "both");
        const nextSide = sides[(currentIndex + 1) % sides.length];
        onUpdate(set.localId, { side: nextSide });
    };

    const currentSide = set.side || "both";

    return (
        <Card
            style={[
                styles.setCard,
                set.savedToDb && {
                    backgroundColor: successColor + "15",
                    borderWidth: 1,
                    borderColor: successColor,
                },
            ]}
        >
            <Card.Body>
                <View style={styles.setRow}>
                    <View style={[styles.setNumber, { backgroundColor: surfaceColor }]}>
                        <Text style={[styles.setNumberText, { color: mutedColor }]}>
                            {set.exerciseSetNumber}
                        </Text>
                    </View>

                    {/* Side selector for unilateral exercises */}
                    {isUnilateral && (
                        <Pressable
                            onPress={handleCycleSide}
                            style={[
                                styles.sideButton,
                                { backgroundColor: sideColors[currentSide] + "20", borderColor: sideColors[currentSide] },
                            ]}
                        >
                            <Text style={[styles.sideButtonText, { color: sideColors[currentSide] }]}>
                                {sideLabels[currentSide]}
                            </Text>
                        </Pressable>
                    )}

                    <View style={styles.setInputs}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: mutedColor }]}>
                                Weight ({set.weightUnit})
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: surfaceColor,
                                        borderColor,
                                        color: foregroundColor,
                                    },
                                ]}
                                value={localWeight}
                                onChangeText={setLocalWeight}
                                onBlur={handleWeightBlur}
                                keyboardType="decimal-pad"
                                placeholder="0"
                                placeholderTextColor={mutedColor}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: mutedColor }]}>Reps</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: surfaceColor,
                                        borderColor,
                                        color: foregroundColor,
                                    },
                                ]}
                                value={localReps}
                                onChangeText={setLocalReps}
                                onBlur={handleRepsBlur}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={mutedColor}
                            />
                        </View>
                    </View>

                    {set.savedToDb ? (
                        <View style={[styles.savedIndicator, { backgroundColor: successColor }]}>
                            <Ionicons name="checkmark" size={18} color="#fff" />
                        </View>
                    ) : (
                        <Pressable
                            style={[styles.removeButton]}
                            onPress={() => onRemove(set.localId)}
                        >
                            <Ionicons name="trash-outline" size={18} color={dangerColor} />
                        </Pressable>
                    )}
                </View>

                {set.label && (
                    <View style={[styles.labelBadge, { backgroundColor: surfaceColor }]}>
                        <Text style={[styles.labelText, { color: mutedColor }]}>{set.label}</Text>
                    </View>
                )}
            </Card.Body>
        </Card>
    );
}

export default function ActiveWorkoutPage() {
    const backgroundColor = useThemeColor("background");
    const surfaceColor = useThemeColor("surface");
    const foregroundColor = useThemeColor("foreground");
    const mutedColor = useThemeColor("muted");
    const accentColor = useThemeColor("accent");
    const successColor = useThemeColor("success");
    const dangerColor = useThemeColor("danger");
    const borderColor = useThemeColor("border");

    const {
        workoutSessionId,
        routineName,
        exercises,
        currentExerciseIndex,
        sets,
        isPaused,
        hasActiveWorkout,
        setCurrentExerciseIndex,
        nextExercise,
        previousExercise,
        getActiveDuration,
        addSet,
        updateSet,
        removeSet,
        pauseWorkout,
        resumeWorkout,
        completeWorkout,
        cancelWorkout,
        isCompleting,
        isSavingSet,
    } = useWorkoutSession();

    const [elapsedTime, setElapsedTime] = useState(0);

    // Redirect if no active workout
    useEffect(() => {
        if (!hasActiveWorkout) {
            router.replace("/" as any);
        }
    }, [hasActiveWorkout]);

    // Get current exercise
    const currentExercise = exercises[currentExerciseIndex];
    
    // Calculate current exercise sets reactively based on sets array
    const currentExerciseSets = useMemo(() => {
        if (!currentExercise) return [];
        return sets.filter((s) => s.exerciseId === currentExercise.exerciseId);
    }, [sets, currentExercise]);

    // Get exercise details from DB
    const exerciseIds = useMemo(() => {
        return exercises.map((e) => e.exerciseId);
    }, [exercises]);

    const exercisesData = useQuery(api.exercises.getByIds, { ids: exerciseIds });
    const allExercises = exercisesData?.exercises ?? [];

    const currentExerciseData = allExercises.find(
        (ex: any) => ex.externalId === currentExercise?.exerciseId
    );

    // Timer for elapsed time
    useEffect(() => {
        if (!hasActiveWorkout || isPaused) return;

        const interval = setInterval(() => {
            setElapsedTime(getActiveDuration());
        }, 1000);

        return () => clearInterval(interval);
    }, [hasActiveWorkout, isPaused, getActiveDuration]);

    const handleAddSet = async () => {        
        if (!currentExercise) return;

        // Get previous set values as defaults
        const lastSet = currentExerciseSets[currentExerciseSets.length - 1];
        const defaultWeight = lastSet?.weight ?? 0;
        const defaultReps = lastSet?.reps ?? currentExercise.targetReps;
        const weightUnit: WeightUnit = lastSet?.weightUnit ?? "kg";
        
        // For unilateral exercises, alternate sides or use last set's side
        let side: Side | undefined;
        if (currentExercise.isUnilateral) {
            if (lastSet?.side === "left") {
                side = "right";
            } else if (lastSet?.side === "right") {
                side = "left";
            } else {
                side = "left"; // Start with left
            }
        }

        const result = await addSet(
            currentExercise.exerciseId,
            defaultReps,
            defaultWeight,
            weightUnit,
            { side }
        );

        result.match(
            () => {},
            (error) => {
                Alert.alert("Fehler", "Set konnte nicht hinzugefügt werden");
                console.error(error);
            }
        );
    };

    const handleUpdateSet = async (localId: string, updates: Partial<LocalSet>) => {
        const result = await updateSet(localId, updates);
        result.match(
            () => {},
            (error) => console.error("Failed to update set:", error)
        );
    };

    const handleRemoveSet = async (localId: string) => {
        const result = await removeSet(localId);
        result.match(
            () => {},
            (error) => {
                Alert.alert("Fehler", "Set konnte nicht gelöscht werden");
                console.error(error);
            }
        );
    };

    const handleCompleteWorkout = () => {
        const totalSets = sets.length;

        if (totalSets === 0) {
            Alert.alert("Keine Sets", "Du hast noch keine Sets absolviert. Trotzdem beenden?", [
                { text: "Weiter trainieren", style: "cancel" },
                {
                    text: "Trotzdem beenden",
                    style: "destructive",
                    onPress: () => void finishWorkout(),
                },
            ]);
            return;
        }

        void finishWorkout();
    };

    const finishWorkout = async () => {
        const result = await completeWorkout();

        result.match(
            () => {
                router.replace("/" as any);
            },
            () => {
                Alert.alert("Fehler", "Workout konnte nicht beendet werden.");
            }
        );
    };

    const handleCancelWorkout = () => {
        Alert.alert("Workout abbrechen", "Bist du sicher? Alle Fortschritte gehen verloren.", [
            { text: "Weiter trainieren", style: "cancel" },
            {
                text: "Abbrechen",
                style: "destructive",
                onPress: async () => {
                    const result = await cancelWorkout();
                    result.match(
                        () => router.replace("/" as any),
                        (error) => {
                            console.error(error);
                            Alert.alert("Fehler", "Workout konnte nicht abgebrochen werden.");
                        }
                    );
                },
            },
        ]);
    };

    const handleTogglePause = async () => {
        if (isPaused) {
            await resumeWorkout();
        } else {
            await pauseWorkout();
        }
    };

    // Progress stats
    const stats = useMemo(() => {
        const totalSets = sets.length;
        const totalWeight = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
        const savedSets = sets.filter((s) => s.savedToDb).length;

        return { totalSets, totalWeight, savedSets };
    }, [sets]);

    if (!hasActiveWorkout || !currentExercise) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor }]}>
                <Stack.Screen options={{ title: "Workout", headerShown: true }} />
                <View style={styles.loadingContainer}>
                    <Spinner size="lg" color={accentColor} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["bottom"]}>
            <Stack.Screen
                options={{
                    title: routineName || "Workout",
                    headerShown: true,
                    headerStyle: { backgroundColor: surfaceColor },
                    headerTintColor: foregroundColor,
                    headerLeft: () => (
                        <Pressable onPress={handleCancelWorkout} style={styles.cancelButton}>
                            <Text style={[styles.cancelText, { color: dangerColor }]}>
                                Abbrechen
                            </Text>
                        </Pressable>
                    ),
                }}
            />

            {/* Stats Bar */}
            <View
                style={[
                    styles.statsBar,
                    { backgroundColor: surfaceColor, borderBottomColor: borderColor },
                ]}
            >
                <Pressable style={styles.statItem} onPress={handleTogglePause}>
                    <Ionicons
                        name={isPaused ? "play" : "pause"}
                        size={18}
                        color={isPaused ? successColor : mutedColor}
                    />
                    <Text
                        style={[
                            styles.statValue,
                            { color: isPaused ? successColor : foregroundColor },
                        ]}
                    >
                        {formatTime(elapsedTime)}
                    </Text>
                </Pressable>
                <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={mutedColor} />
                    <Text style={[styles.statValue, { color: foregroundColor }]}>
                        {stats.totalSets} Sets
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="barbell-outline" size={18} color={mutedColor} />
                    <Text style={[styles.statValue, { color: foregroundColor }]}>
                        {stats.totalWeight} kg
                    </Text>
                </View>
                {isSavingSet && <Spinner size="sm" color={accentColor} />}
            </View>

            {/* Exercise Navigation */}
            <View
                style={[
                    styles.exerciseNav,
                    { backgroundColor: surfaceColor, borderBottomColor: borderColor },
                ]}
            >
                <Pressable
                    onPress={previousExercise}
                    disabled={currentExerciseIndex === 0}
                    style={[
                        styles.navButton,
                        currentExerciseIndex === 0 && styles.navButtonDisabled,
                    ]}
                >
                    <Ionicons
                        name="chevron-back"
                        size={24}
                        color={currentExerciseIndex === 0 ? mutedColor : foregroundColor}
                    />
                </Pressable>

                <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseCount, { color: mutedColor }]}>
                        {currentExerciseIndex + 1} / {exercises.length}
                    </Text>
                    <View style={styles.exerciseNameRow}>
                        <Text style={[styles.exerciseName, { color: foregroundColor }]}>
                            {currentExerciseData?.name || "Übung"}
                        </Text>
                        {currentExercise.isUnilateral && (
                            <View style={[styles.unilateralBadge, { backgroundColor: "#3b82f620", borderColor: "#3b82f6" }]}>
                                <Text style={[styles.unilateralBadgeText, { color: "#3b82f6" }]}>L/R</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.exerciseMeta, { color: mutedColor }]}>
                        Ziel: {currentExercise.targetSets} × {currentExercise.targetReps}
                    </Text>
                </View>

                <Pressable
                    onPress={nextExercise}
                    disabled={currentExerciseIndex === exercises.length - 1}
                    style={[
                        styles.navButton,
                        currentExerciseIndex === exercises.length - 1 && styles.navButtonDisabled,
                    ]}
                >
                    <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={
                            currentExerciseIndex === exercises.length - 1
                                ? mutedColor
                                : foregroundColor
                        }
                    />
                </Pressable>
            </View>

            {/* Sets List */}
            <FlatList
                data={currentExerciseSets}
                renderItem={({ item }) => (
                    <SetInputRow
                        set={item}
                        isUnilateral={currentExercise?.isUnilateral}
                        onUpdate={handleUpdateSet}
                        onRemove={handleRemoveSet}
                    />
                )}
                keyExtractor={(item) => item.localId}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="barbell-outline" size={48} color={mutedColor} />
                        <Text style={[styles.emptyText, { color: mutedColor }]}>
                            Noch keine Sets. Füge deinen ersten Set hinzu!
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    <Pressable
                        onPress={handleAddSet}
                        style={[styles.addSetButton, { borderColor: accentColor }]}
                    >
                        <Ionicons name="add" size={24} color={accentColor} />
                        <Text style={[styles.addSetText, { color: accentColor }]}>
                            Set hinzufügen
                        </Text>
                    </Pressable>
                }
            />

            {/* Footer */}
            <View
                style={[
                    styles.footer,
                    { backgroundColor: surfaceColor, borderTopColor: borderColor },
                ]}
            >
                <Button
                    variant="primary"
                    onPress={handleCompleteWorkout}
                    isDisabled={isCompleting}
                    className="bg-success"
                >
                    {isCompleting ? (
                        <Spinner size="sm" color="white" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Button.Label>Workout beenden</Button.Label>
                        </>
                    )}
                </Button>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButton: {
        padding: 8,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: "600",
    },
    statsBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 16,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: "600",
    },
    exerciseNav: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
    },
    navButton: {
        padding: 8,
    },
    navButtonDisabled: {
        opacity: 0.3,
    },
    exerciseInfo: {
        flex: 1,
        alignItems: "center",
    },
    exerciseCount: {
        fontSize: 12,
        fontWeight: "600",
    },
    exerciseNameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    exerciseName: {
        fontSize: 20,
        fontWeight: "700",
        marginVertical: 4,
    },
    unilateralBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    unilateralBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    exerciseMeta: {
        fontSize: 14,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    setCard: {
        marginBottom: 12,
    },
    setRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    setNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    setNumberText: {
        fontSize: 14,
        fontWeight: "700",
    },
    sideButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    sideButtonText: {
        fontSize: 14,
        fontWeight: "700",
    },
    setInputs: {
        flex: 1,
        flexDirection: "row",
        gap: 12,
    },
    inputGroup: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    savedIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 12,
    },
    removeButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 12,
    },
    labelBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 8,
    },
    labelText: {
        fontSize: 12,
        fontWeight: "600",
        textTransform: "capitalize",
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 48,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        textAlign: "center",
    },
    addSetButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderWidth: 2,
        borderStyle: "dashed",
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    addSetText: {
        fontSize: 16,
        fontWeight: "600",
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
});
