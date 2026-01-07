import { useState } from "react";
import { Alert, Keyboard, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Button, Card, Spinner, useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../utils/convex";

export default function AddFriendPage() {
    const backgroundColor = useThemeColor("background");
    const surfaceColor = useThemeColor("surface");
    const foregroundColor = useThemeColor("foreground");
    const mutedColor = useThemeColor("muted");
    const accentColor = useThemeColor("accent");
    const borderColor = useThemeColor("border");
    const dangerColor = useThemeColor("danger");

    const { user } = useUser();
    const [friendId, setFriendId] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendRequest = useMutation(api.friends.sendRequest);
    const friendsData = useQuery(api.friends.getByUserId, user?.id ? { userId: user.id } : "skip");
    const pendingRequests = useQuery(
        api.friends.getRequests,
        user?.id ? { userId: user.id } : "skip"
    );

    const handleSendRequest = async () => {
        const trimmedId = friendId.trim();
        setError(null);

        if (!trimmedId) {
            setError("Please enter a user ID");
            return;
        }

        // Check if trying to add self
        if (trimmedId === user?.id) {
            setError("You cannot add yourself as a friend");
            return;
        }

        // Check if already friends
        const isAlreadyFriend = friendsData?.some((f: any) => {
            const otherId = f.requesterId === user?.id ? f.recipientId : f.requesterId;
            return otherId === trimmedId && f.status === "accepted";
        });
        if (isAlreadyFriend) {
            setError("You are already friends with this user");
            return;
        }

        // Check if request already pending
        const isPending = pendingRequests?.some((r: any) => r.requesterId === trimmedId);
        if (isPending) {
            setError("A friend request is already pending with this user");
            return;
        }

        Keyboard.dismiss();
        setIsSending(true);

        try {
            await sendRequest({ recipientId: trimmedId });
            Alert.alert("Success", "Friend request sent!", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (err: any) {
            setError(err.message || "Failed to send friend request");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["bottom"]}>
            <Stack.Screen
                options={{
                    title: "Add Friend",
                    headerShown: true,
                    headerStyle: { backgroundColor: surfaceColor },
                    headerTintColor: foregroundColor,
                }}
            />

            <View style={styles.content}>
                <Card style={styles.card}>
                    <Card.Body>
                        <View style={styles.iconContainer}>
                            <Ionicons name="person-add-outline" size={48} color={accentColor} />
                        </View>

                        <Text style={[styles.title, { color: foregroundColor }]}>Add a Friend</Text>
                        <Text style={[styles.subtitle, { color: mutedColor }]}>
                            Enter your friend's user ID to send them a friend request.
                        </Text>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: surfaceColor,
                                        color: foregroundColor,
                                        borderColor: error ? dangerColor : borderColor,
                                    },
                                ]}
                                placeholder="Enter user ID..."
                                placeholderTextColor={mutedColor}
                                value={friendId}
                                onChangeText={(text) => {
                                    setFriendId(text);
                                    setError(null);
                                }}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!isSending}
                            />
                        </View>

                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={16} color={dangerColor} />
                                <Text style={[styles.errorText, { color: dangerColor }]}>
                                    {error}
                                </Text>
                            </View>
                        )}

                        <View style={styles.buttonContainer}>
                            <Button
                                variant="secondary"
                                onPress={() => router.back()}
                                isDisabled={isSending}
                            >
                                <Button.Label>Cancel</Button.Label>
                            </Button>
                            <Button
                                variant="primary"
                                onPress={handleSendRequest}
                                isDisabled={isSending || !friendId.trim()}
                            >
                                {isSending ? (
                                    <Spinner size="sm" color="white" />
                                ) : (
                                    <>
                                        <Ionicons name="send" size={16} color="#fff" />
                                        <Button.Label>Send Request</Button.Label>
                                    </>
                                )}
                            </Button>
                        </View>
                    </Card.Body>
                </Card>

                <Card style={styles.helpCard} variant="secondary">
                    <Card.Body>
                        <Text style={[styles.helpTitle, { color: foregroundColor }]}>
                            How to find a user ID?
                        </Text>
                        <Text style={[styles.helpText, { color: mutedColor }]}>
                            Ask your friend to share their user ID from their profile page. You can
                            also find your own ID in your profile settings.
                        </Text>
                    </Card.Body>
                </Card>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
    },
    iconContainer: {
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: "center",
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: "row",
        gap: 12,
    },
    helpCard: {
        marginTop: 8,
    },
    helpTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    helpText: {
        fontSize: 14,
        lineHeight: 20,
    },
});
