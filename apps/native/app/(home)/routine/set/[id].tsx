import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";

import { Container } from "@/components/container";
import { api, WorkoutSetId } from "@/utils/convex";

const LABELS = [
    { value: "warmup", label: "Aufwärmen" },
    { value: "working", label: "Arbeitssatz" },
    { value: "dropset", label: "Dropset" },
    { value: "failure", label: "Bis Muskelversagen" },
    { value: "pr", label: "Persönlicher Rekord" },
    { value: "backoff", label: "Backoff" },
] as const;

const SIDES = [
    { value: "left", label: "Links", color: "#3b82f6" },
    { value: "right", label: "Rechts", color: "#22c55e" },
    { value: "both", label: "Beide", color: "#a855f7" },
] as const;

export default function SetDetailPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const foregroundColor = useThemeColor("foreground");
    const mutedColor = useThemeColor("muted");
    const surfaceColor = useThemeColor("surface");
    const borderColor = useThemeColor("border");
    const dangerColor = useThemeColor("danger");

    const set = useQuery(api.workouts.getSetById, { setId: id as WorkoutSetId });
    const updateSetMutation = useMutation(api.workouts.updateSet);
    const deleteSetMutation = useMutation(api.workouts.deleteSet);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Local edit state
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");
    const [note, setNote] = useState("");
    const [label, setLabel] = useState<string | null>(null);
    const [rpe, setRpe] = useState("");

    // Initialize edit state when set loads
    const initializeEditState = () => {
        if (set) {
            setWeight(String(set.weight));
            setReps(String(set.reps));
            setNote(set.note || "");
            setLabel(set.label || null);
            setRpe(set.rpe ? String(set.rpe) : "");
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        if (!set) return;

        setIsSaving(true);
        try {
            await updateSetMutation({
                setId: id as WorkoutSetId,
                weight: parseFloat(weight) || 0,
                reps: parseInt(reps, 10) || 0,
                note: note || undefined,
                label: (label as any) || undefined,
                rpe: rpe ? parseFloat(rpe) : undefined,
            });
            setIsEditing(false);
        } catch (error) {
            Alert.alert("Fehler", "Set konnte nicht gespeichert werden");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert("Set löschen", "Bist du sicher, dass du diesen Set löschen möchtest?", [
            { text: "Abbrechen", style: "cancel" },
            {
                text: "Löschen",
                style: "destructive",
                onPress: async () => {
                    setIsDeleting(true);
                    try {
                        await deleteSetMutation({ setId: id as WorkoutSetId });
                        router.back();
                    } catch (error) {
                        Alert.alert("Fehler", "Set konnte nicht gelöscht werden");
                        console.error(error);
                    } finally {
                        setIsDeleting(false);
                    }
                },
            },
        ]);
    };

    if (set === undefined) {
        return (
            <Container>
                <Stack.Screen options={{ title: "Set", headerShown: true }} />
                <View className="flex-1 justify-center items-center">
                    <Spinner size="lg" />
                </View>
            </Container>
        );
    }

    if (set === null) {
        return (
            <Container>
                <Stack.Screen options={{ title: "Set", headerShown: true }} />
                <View className="flex-1 justify-center items-center p-5">
                    <Ionicons name="alert-circle-outline" size={64} color={mutedColor} />
                    <Text className="text-muted mt-4 text-center">Set nicht gefunden</Text>
                </View>
            </Container>
        );
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString("de-DE", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Container>
            <Stack.Screen
                options={{
                    title: `Set ${set.exerciseSetNumber}`,
                    headerShown: true,
                }}
            />
            <ScrollView className="flex-1" contentContainerClassName="p-4">
                {/* Date */}
                <Text className="text-muted text-sm mb-4">{formatDate(set.completedAt)}</Text>

                {isEditing ? (
                    /* Edit Mode */
                    <View>
                        {/* Weight & Reps */}
                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1">
                                <Text className="text-muted text-sm mb-2">Gewicht (kg)</Text>
                                <TextInput
                                    style={{
                                        backgroundColor: surfaceColor,
                                        borderColor,
                                        borderWidth: 1,
                                        borderRadius: 12,
                                        padding: 16,
                                        color: foregroundColor,
                                        fontSize: 18,
                                        fontWeight: "600",
                                    }}
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="decimal-pad"
                                    placeholder="0"
                                    placeholderTextColor={mutedColor}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-muted text-sm mb-2">Wiederholungen</Text>
                                <TextInput
                                    style={{
                                        backgroundColor: surfaceColor,
                                        borderColor,
                                        borderWidth: 1,
                                        borderRadius: 12,
                                        padding: 16,
                                        color: foregroundColor,
                                        fontSize: 18,
                                        fontWeight: "600",
                                    }}
                                    value={reps}
                                    onChangeText={setReps}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                    placeholderTextColor={mutedColor}
                                />
                            </View>
                        </View>

                        {/* RPE */}
                        <View className="mb-4">
                            <Text className="text-muted text-sm mb-2">RPE (1-10)</Text>
                            <TextInput
                                style={{
                                    backgroundColor: surfaceColor,
                                    borderColor,
                                    borderWidth: 1,
                                    borderRadius: 12,
                                    padding: 16,
                                    color: foregroundColor,
                                    fontSize: 16,
                                }}
                                value={rpe}
                                onChangeText={setRpe}
                                keyboardType="decimal-pad"
                                placeholder="Optional"
                                placeholderTextColor={mutedColor}
                            />
                        </View>

                        {/* Label */}
                        <View className="mb-4">
                            <Text className="text-muted text-sm mb-2">Label</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {LABELS.map((l) => (
                                    <Button
                                        key={l.value}
                                        variant={label === l.value ? "primary" : "ghost"}
                                        size="sm"
                                        onPress={() =>
                                            setLabel(label === l.value ? null : l.value)
                                        }
                                    >
                                        <Button.Label>{l.label}</Button.Label>
                                    </Button>
                                ))}
                            </View>
                        </View>

                        {/* Note */}
                        <View className="mb-6">
                            <Text className="text-muted text-sm mb-2">Notiz</Text>
                            <TextInput
                                style={{
                                    backgroundColor: surfaceColor,
                                    borderColor,
                                    borderWidth: 1,
                                    borderRadius: 12,
                                    padding: 16,
                                    color: foregroundColor,
                                    fontSize: 16,
                                    minHeight: 100,
                                    textAlignVertical: "top",
                                }}
                                value={note}
                                onChangeText={setNote}
                                multiline
                                placeholder="Optionale Notiz hinzufügen..."
                                placeholderTextColor={mutedColor}
                            />
                        </View>

                        {/* Save & Cancel Buttons */}
                        <View className="flex-row gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onPress={() => setIsEditing(false)}
                            >
                                <Button.Label>Abbrechen</Button.Label>
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onPress={handleSave}
                                isDisabled={isSaving}
                            >
                                {isSaving ? (
                                    <Spinner size="sm" color="white" />
                                ) : (
                                    <Button.Label>Speichern</Button.Label>
                                )}
                            </Button>
                        </View>
                    </View>
                ) : (
                    /* View Mode */
                    <View>
                        {/* Main Stats */}
                        <Surface className="rounded-xl p-6 mb-4">
                            <View className="flex-row justify-around">
                                <View className="items-center">
                                    <Text className="text-muted text-sm">Gewicht</Text>
                                    <Text className="text-foreground text-3xl font-bold">
                                        {set.weight}
                                    </Text>
                                    <Text className="text-muted text-sm">{set.weightUnit}</Text>
                                </View>
                                <View className="w-px bg-border" />
                                <View className="items-center">
                                    <Text className="text-muted text-sm">Wiederholungen</Text>
                                    <Text className="text-foreground text-3xl font-bold">
                                        {set.reps}
                                    </Text>
                                    <Text className="text-muted text-sm">Wdh</Text>
                                </View>
                            </View>
                        </Surface>

                        {/* Additional Info */}
                        {(set.side || set.label || set.rpe || set.note) && (
                            <Surface className="rounded-xl p-4 mb-4">
                                {set.side && (
                                    <View className="flex-row items-center mb-3">
                                        <Ionicons
                                            name="body-outline"
                                            size={18}
                                            color={mutedColor}
                                        />
                                        <Text className="text-muted ml-2">Seite:</Text>
                                        <View 
                                            style={{ 
                                                backgroundColor: SIDES.find(s => s.value === set.side)?.color + "20",
                                                borderColor: SIDES.find(s => s.value === set.side)?.color,
                                                borderWidth: 1,
                                            }}
                                            className="rounded px-2 py-1 ml-2"
                                        >
                                            <Text 
                                                style={{ color: SIDES.find(s => s.value === set.side)?.color }}
                                                className="font-semibold"
                                            >
                                                {SIDES.find((s) => s.value === set.side)?.label ||
                                                    set.side}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                {set.label && (
                                    <View className="flex-row items-center mb-3">
                                        <Ionicons
                                            name="pricetag-outline"
                                            size={18}
                                            color={mutedColor}
                                        />
                                        <Text className="text-muted ml-2">Label:</Text>
                                        <View className="bg-accent/20 rounded px-2 py-1 ml-2">
                                            <Text className="text-accent font-semibold">
                                                {LABELS.find((l) => l.value === set.label)?.label ||
                                                    set.label}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                {set.rpe && (
                                    <View className="flex-row items-center mb-3">
                                        <Ionicons
                                            name="fitness-outline"
                                            size={18}
                                            color={mutedColor}
                                        />
                                        <Text className="text-muted ml-2">RPE:</Text>
                                        <Text className="text-foreground font-semibold ml-2">
                                            {set.rpe}
                                        </Text>
                                    </View>
                                )}
                                {set.note && (
                                    <View>
                                        <View className="flex-row items-center mb-2">
                                            <Ionicons
                                                name="document-text-outline"
                                                size={18}
                                                color={mutedColor}
                                            />
                                            <Text className="text-muted ml-2">Notiz:</Text>
                                        </View>
                                        <Text className="text-foreground ml-6">{set.note}</Text>
                                    </View>
                                )}
                            </Surface>
                        )}

                        {/* Action Buttons */}
                        <View className="flex-row gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onPress={initializeEditState}
                            >
                                <Ionicons name="pencil" size={18} color={foregroundColor} />
                                <Button.Label>Bearbeiten</Button.Label>
                            </Button>
                            <Button
                                variant="danger-soft"
                                onPress={handleDelete}
                                isDisabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <Spinner size="sm" color={dangerColor} />
                                ) : (
                                    <Ionicons name="trash-outline" size={18} color={dangerColor} />
                                )}
                            </Button>
                        </View>
                    </View>
                )}
            </ScrollView>
        </Container>
    );
}
