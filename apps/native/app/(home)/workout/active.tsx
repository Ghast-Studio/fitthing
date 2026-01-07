import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Button, Card, Spinner, useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "convex/react";
import { api } from "../../../utils/convex";
import { useWorkoutSession, WorkoutSet } from "../../../utils/useWorkoutSession";
import { formatTime } from "../../../utils/workoutUtils";
import { FlatList } from "react-native-gesture-handler";

interface SetInputProps {
    set: WorkoutSet;
    index: number;
    onUpdate: (index: number, field: keyof WorkoutSet, value: number | boolean) => Promise<void>;
}

function SetInputRow({ set, index, onUpdate }: SetInputProps) {
    const foregroundColor = useThemeColor("foreground");
    const mutedColor = useThemeColor("muted");
    const surfaceColor = useThemeColor("surface");
    const borderColor = useThemeColor("border");

    const [localWeight, setLocalWeight] = useState(String(set.weight));
    const [localReps, setLocalReps] = useState(String(set.completedReps));

    useEffect(() => {
        setLocalWeight(String(set.weight));
        setLocalReps(String(set.completedReps));
    }, [set.weight, set.completedReps]);

    const handleWeightBlur = () => {
        const parsed = parseInt(localWeight, 10);
        const value = isNaN(parsed) ? 0 : parsed;
        void onUpdate(index, "weight", value);
    };

    const handleRepsBlur = () => {
        const parsed = parseInt(localReps, 10);
        const value = isNaN(parsed) ? set.targetReps : parsed;
        void onUpdate(index, "completedReps", value);
    };

    return (
        <View style={styles.setInputs}>
            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: mutedColor }]}>Weight</Text>
                <TextInput
                    style={[
                        styles.input,
                        { backgroundColor: surfaceColor, borderColor, color: foregroundColor },
                    ]}
                    value={localWeight}
                    onChangeText={setLocalWeight}
                    onBlur={handleWeightBlur}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={mutedColor}
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: mutedColor }]}>Reps</Text>
                <TextInput
                    style={[
                        styles.input,
                        { backgroundColor: surfaceColor, borderColor, color: foregroundColor },
                    ]}
                    value={localReps}
                    onChangeText={setLocalReps}
                    onBlur={handleRepsBlur}
                    keyboardType="numeric"
                    placeholder={String(set.targetReps)}
                    placeholderTextColor={mutedColor}
                />
            </View>
        </View>
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
        activeSession,
        sets,
        isSyncing,
        syncError,
        updateSet,
        completeWorkout,
        cancelWorkout,
        isCompleting,
    } = useWorkoutSession();

    const [elapsedTime, setElapsedTime] = useState(0);

    // Redirect if no active workout
    useEffect(() => {
        if (activeSession === null) {
            router.replace("/" as any);
        }
    }, [activeSession]);

    // Get exercise IDs from active session sets
    const exerciseIds = useMemo(() => {
        if (sets.length > 0) {
            return [...new Set(sets.map((s) => s.exerciseId))];
        }
        return [];
    }, [sets]);

    const exercisesData = useQuery(api.exercises.getByIds, { ids: exerciseIds });
    const allExercises = exercisesData?.exercises ?? [];

    // Timer for elapsed time
    useEffect(() => {
        if (!activeSession) return;

        const interval = setInterval(() => {
            setElapsedTime(Date.now() - activeSession.startedAt);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeSession]);

    const handleUpdateSet = async (
        index: number,
        field: keyof WorkoutSet,
        value: number | boolean
    ) => {
        const result = await updateSet(index, { [field]: value });
        result.match(
            () => {},
            (error: { type: string; message: string }) => {
                console.error("Failed to update set:", error);
            }
        );
    };

    const handleCompleteWorkout = () => {
        const completedSets = sets.filter((s) => s.completed).length;

        if (completedSets === 0) {
            Alert.alert(
                "No Sets Completed",
                "You haven't completed any sets yet. Are you sure you want to finish?",
                [
                    { text: "Continue Workout", style: "cancel" },
                    {
                        text: "Finish Anyway",
                        style: "destructive",
                        onPress: () => void finishWorkout(),
                    },
                ]
            );
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
                Alert.alert("Error", "Failed to complete workout. Please try again.");
            }
        );
    };

    const handleCancelWorkout = () => {
        Alert.alert(
            "Cancel Workout",
            "Are you sure you want to cancel this workout? All progress will be lost.",
            [
                { text: "Continue Workout", style: "cancel" },
                {
                    text: "Cancel Workout",
                    style: "destructive",
                    onPress: async () => {
                        const result = await cancelWorkout();
                        result.match(
                            () => {
                                router.replace("/" as any);
                            },
                            (error) => {
                                console.error("Failed to cancel workout:", error);
                                Alert.alert("Error", "Failed to cancel workout. Please try again.");
                            }
                        );
                    },
                },
            ]
        );
    };

    // Progress stats
    const stats = useMemo(() => {
        const totalSets = sets.length;
        const completedSets = sets.filter((s) => s.completed).length;
        const totalWeight = sets.reduce(
            (sum, s) => sum + (s.completed ? s.weight * s.completedReps : 0),
            0
        );

        return { totalSets, completedSets, totalWeight };
    }, [sets]);

    if (!activeSession) {
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
                    title: "Workout in Progress",
                    headerShown: true,
                    headerStyle: { backgroundColor: surfaceColor },
                    headerTintColor: foregroundColor,
                    headerLeft: () => (
                        <Pressable onPress={handleCancelWorkout} style={styles.cancelButton}>
                            <Text style={[styles.cancelText, { color: dangerColor }]}>Cancel</Text>
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
                <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={18} color={mutedColor} />
                    <Text style={[styles.statValue, { color: foregroundColor }]}>
                        {formatTime(elapsedTime)}
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={mutedColor} />
                    <Text style={[styles.statValue, { color: foregroundColor }]}>
                        {stats.completedSets}/{stats.totalSets}
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="barbell-outline" size={18} color={mutedColor} />
                    <Text style={[styles.statValue, { color: foregroundColor }]}>
                        {stats.totalWeight} kg
                    </Text>
                </View>
                <View style={styles.syncIndicator}>
                    {isSyncing ? (
                        <Spinner size="sm" color={accentColor} />
                    ) : syncError ? (
                        <Ionicons name="cloud-offline" size={18} color={dangerColor} />
                    ) : (
                        <Ionicons name="cloud-done" size={18} color={successColor} />
                    )}
                </View>
            </View>

            <FlatList
                data={sets}
                renderItem={({ item, index }) => {
                    const exercise = allExercises.find(
                        (ex: any) => ex.externalId === item.exerciseId
                    );
                    const exerciseSets = sets.filter((s) => s.exerciseId === item.exerciseId);
                    const isFirstSet = exerciseSets[0] === item;

                    return (
                        <View style={styles.setContainer}>
                            {isFirstSet && (
                                <View style={styles.exerciseHeader}>
                                    <Text style={[styles.exerciseName, { color: foregroundColor }]}>
                                        {exercise?.name || "Unknown Exercise"}
                                    </Text>
                                    <Text style={[styles.exerciseMeta, { color: mutedColor }]}>
                                        {exerciseSets.length} sets × {item.targetReps} reps
                                    </Text>
                                </View>
                            )}

                            <Card
                                style={[
                                    styles.setCard,
                                    item.completed && {
                                        backgroundColor: successColor + "15",
                                        borderWidth: 1,
                                        borderColor: successColor,
                                    },
                                ]}
                            >
                                <Card.Body>
                                    <View style={styles.setRow}>
                                        <View
                                            style={[
                                                styles.setNumber,
                                                { backgroundColor: surfaceColor },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.setNumberText,
                                                    { color: mutedColor },
                                                ]}
                                            >
                                                {item.setNumber}
                                            </Text>
                                        </View>

                                        <SetInputRow
                                            set={item}
                                            index={index}
                                            onUpdate={handleUpdateSet}
                                        />

                                        <Pressable
                                            style={[
                                                styles.checkButton,
                                                {
                                                    borderColor: item.completed
                                                        ? successColor
                                                        : accentColor,
                                                    backgroundColor: item.completed
                                                        ? successColor
                                                        : "transparent",
                                                },
                                            ]}
                                            onPress={() =>
                                                handleUpdateSet(index, "completed", !item.completed)
                                            }
                                        >
                                            <Ionicons
                                                name={
                                                    item.completed
                                                        ? "checkmark"
                                                        : "checkmark-outline"
                                                }
                                                size={24}
                                                color={item.completed ? "#fff" : accentColor}
                                            />
                                        </Pressable>
                                    </View>
                                </Card.Body>
                            </Card>
                        </View>
                    );
                }}
                keyExtractor={(item, index) => `${item.exerciseId}-${index}`}
                //estimatedItemSize={100}
                contentContainerStyle={styles.listContent}
            />

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
                            <Button.Label>Complete Workout</Button.Label>
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
    syncIndicator: {
        marginLeft: "auto",
    },
    listContent: {
        padding: 16,
    },
    setContainer: {
        marginBottom: 16,
    },
    exerciseHeader: {
        marginBottom: 12,
    },
    exerciseName: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 4,
    },
    exerciseMeta: {
        fontSize: 14,
    },
    setCard: {
        marginBottom: 8,
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
    checkButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 12,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
});
