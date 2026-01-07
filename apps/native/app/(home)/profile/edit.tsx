import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Avatar, Button, Card, Chip, Spinner, useThemeColor } from "heroui-native";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../utils/convex";

type Level = "beginner" | "intermediate" | "expert" | null;
type Units = "metric" | "imperial";
type WorkoutTime = "morning" | "afternoon" | "evening" | "anytime" | null;

export default function EditProfilePage() {
    const backgroundColor = useThemeColor("background");
    const surfaceColor = useThemeColor("surface");
    const foregroundColor = useThemeColor("foreground");
    const mutedColor = useThemeColor("muted");
    const accentColor = useThemeColor("accent");
    const borderColor = useThemeColor("border");

    const { user } = useUser();
    const userId = user?.id || "";

    const profile = useQuery(api.userProfiles.getByUserId, { userId });
    const updateProfile = useMutation(api.userProfiles.update);

    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        bio: "",
        level: null as Level,
        units: "metric" as Units,
        preferredWorkoutTime: null as WorkoutTime,
    });

    const isLoading = profile === undefined;

    // Initialize form data when profile loads
    useEffect(() => {
        if (profile) {
            setFormData({
                bio: profile.bio || "",
                level: profile.level as Level,
                units: (profile.units as Units) || "metric",
                preferredWorkoutTime: profile.preferredWorkoutTime as WorkoutTime,
            });
        }
    }, [profile]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                bio: formData.bio.trim() || undefined,
                level: formData.level ?? undefined,
                units: formData.units,
                preferredWorkoutTime: formData.preferredWorkoutTime ?? undefined,
            });
            Alert.alert("Success", "Profile updated successfully", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor }]}>
                <Stack.Screen
                    options={{
                        title: "Edit Profile",
                        headerShown: true,
                        headerStyle: { backgroundColor: surfaceColor },
                        headerTintColor: foregroundColor,
                    }}
                />
                <View style={styles.loadingContainer}>
                    <Spinner size="lg" color={accentColor} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <Stack.Screen
                options={{
                    title: "Edit Profile",
                    headerShown: true,
                    headerStyle: { backgroundColor: surfaceColor },
                    headerTintColor: foregroundColor,
                }}
            />

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <Card>
                    <Card.Body>
                        {/* Profile Header */}
                        <View style={styles.profileHeader}>
                            <Avatar size="lg" alt={user?.fullName || "User"}>
                                {user?.imageUrl ? (
                                    <Avatar.Image source={{ uri: user.imageUrl }} />
                                ) : (
                                    <Avatar.Fallback>{user?.firstName?.[0] || "U"}</Avatar.Fallback>
                                )}
                            </Avatar>
                            <View style={styles.profileInfo}>
                                <Text style={[styles.displayName, { color: foregroundColor }]}>
                                    {user?.fullName || user?.firstName || "User"}
                                </Text>
                                <Text style={[styles.email, { color: mutedColor }]}>
                                    {user?.primaryEmailAddress?.emailAddress}
                                </Text>
                            </View>
                        </View>

                        {/* Bio Input */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: mutedColor }]}>Bio</Text>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    {
                                        backgroundColor: surfaceColor,
                                        color: foregroundColor,
                                        borderColor,
                                    },
                                ]}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor={mutedColor}
                                value={formData.bio}
                                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        {/* Level Selection */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: mutedColor }]}>
                                Experience Level
                            </Text>
                            <View style={styles.chipContainer}>
                                {(["beginner", "intermediate", "expert"] as const).map((level) => (
                                    <Chip
                                        key={level}
                                        variant={formData.level === level ? "primary" : "secondary"}
                                        color={formData.level === level ? "accent" : "default"}
                                        onPress={() =>
                                            setFormData({
                                                ...formData,
                                                level: formData.level === level ? null : level,
                                            })
                                        }
                                    >
                                        <Chip.Label>
                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                        </Chip.Label>
                                    </Chip>
                                ))}
                            </View>
                        </View>

                        {/* Units Selection */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: mutedColor }]}>Units</Text>
                            <View style={styles.buttonRow}>
                                <Button
                                    variant={formData.units === "metric" ? "primary" : "secondary"}
                                    onPress={() => setFormData({ ...formData, units: "metric" })}
                                    className="flex-1"
                                >
                                    <Button.Label>Metric (kg)</Button.Label>
                                </Button>
                                <Button
                                    variant={
                                        formData.units === "imperial" ? "primary" : "secondary"
                                    }
                                    onPress={() => setFormData({ ...formData, units: "imperial" })}
                                    className="flex-1"
                                >
                                    <Button.Label>Imperial (lbs)</Button.Label>
                                </Button>
                            </View>
                        </View>

                        {/* Preferred Workout Time */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: mutedColor }]}>
                                Preferred Workout Time
                            </Text>
                            <View style={styles.chipContainer}>
                                {(["morning", "afternoon", "evening", "anytime"] as const).map(
                                    (time) => (
                                        <Chip
                                            key={time}
                                            variant={
                                                formData.preferredWorkoutTime === time
                                                    ? "primary"
                                                    : "secondary"
                                            }
                                            color={
                                                formData.preferredWorkoutTime === time
                                                    ? "accent"
                                                    : "default"
                                            }
                                            onPress={() =>
                                                setFormData({
                                                    ...formData,
                                                    preferredWorkoutTime:
                                                        formData.preferredWorkoutTime === time
                                                            ? null
                                                            : time,
                                                })
                                            }
                                        >
                                            <Chip.Label>
                                                {time.charAt(0).toUpperCase() + time.slice(1)}
                                            </Chip.Label>
                                        </Chip>
                                    )
                                )}
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actions}>
                            <Button
                                variant="secondary"
                                onPress={() => router.back()}
                                isDisabled={isSaving}
                            >
                                <Button.Label>Cancel</Button.Label>
                            </Button>
                            <Button variant="primary" onPress={handleSave} isDisabled={isSaving}>
                                {isSaving ? (
                                    <Spinner size="sm" color="white" />
                                ) : (
                                    <Button.Label>Save Changes</Button.Label>
                                )}
                            </Button>
                        </View>
                    </Card.Body>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    profileHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    displayName: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 8,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: "top",
    },
    chipContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
    },
    actions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
});
