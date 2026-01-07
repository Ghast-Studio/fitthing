import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Avatar, Button, Card, Chip, Spinner, useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../utils/convex";
import { FlatList } from "react-native-gesture-handler";

// Types
interface Friend {
    odataType: "friend";
    odataId: string;
    odataFriendship: string;
    odataFriendSince: number;
    odataActiveWorkout?: string;
}

interface PendingRequest {
    odataType: "pending";
    odataId: string;
    odataRequestId: string;
    odataRequestedAt: number;
}

type ListItem = Friend | PendingRequest | { odataType: "header"; title: string };

// User Profile Display Component
function UserProfileDisplay({
    userId,
    showActiveWorkout,
    activeWorkoutId,
    onPress,
}: {
    userId: string;
    showActiveWorkout?: boolean;
    activeWorkoutId?: string;
    onPress?: () => void;
}) {
    const { user: currentUser } = useUser();
    const isOwnProfile = currentUser?.id === userId;

    const accentColor = useThemeColor("accent");
    const foregroundColor = useThemeColor("foreground");
    const mutedColor = useThemeColor("muted");

    const displayName = isOwnProfile
        ? currentUser?.fullName || currentUser?.firstName || "You"
        : userId.slice(0, 8) + "...";

    const avatarUrl = isOwnProfile ? currentUser?.imageUrl : undefined;
    const fallback = isOwnProfile
        ? currentUser?.firstName?.[0] || "U"
        : userId[0]?.toUpperCase() || "U";

    return (
        <Pressable onPress={onPress} style={styles.userProfile}>
            <Avatar size="md" alt={displayName}>
                {avatarUrl ? (
                    <Avatar.Image source={{ uri: avatarUrl }} />
                ) : (
                    <Avatar.Fallback>{fallback}</Avatar.Fallback>
                )}
            </Avatar>
            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: foregroundColor }]}>{displayName}</Text>
                {showActiveWorkout && activeWorkoutId && (
                    <Chip size="sm" color="success" variant="soft">
                        <Chip.Label>
                            <View style={styles.workoutBadge}>
                                <View style={[styles.liveDot, { backgroundColor: accentColor }]} />
                                <Text style={{ color: mutedColor, fontSize: 12 }}>Working out</Text>
                            </View>
                        </Chip.Label>
                    </Chip>
                )}
            </View>
        </Pressable>
    );
}

// Pending Requests Component
function PendingRequests({
    requests,
    onAccept,
    onDecline,
}: {
    requests: PendingRequest[];
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
}) {
    const foregroundColor = useThemeColor("foreground");

    if (requests.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: foregroundColor }]}>
                Pending Requests ({requests.length})
            </Text>
            {requests.map((request) => (
                <Card key={request.odataRequestId} style={styles.requestCard}>
                    <Card.Body>
                        <View style={styles.requestRow}>
                            <UserProfileDisplay userId={request.odataId} />
                            <View style={styles.requestActions}>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onPress={() => onAccept(request.odataRequestId)}
                                >
                                    <Button.Label>Accept</Button.Label>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onPress={() => onDecline(request.odataRequestId)}
                                >
                                    <Button.Label>Decline</Button.Label>
                                </Button>
                            </View>
                        </View>
                    </Card.Body>
                </Card>
            ))}
        </View>
    );
}

// Friends List Component
function FriendsList({ friends }: { friends: Friend[] }) {
    const foregroundColor = useThemeColor("foreground");
    const mutedColor = useThemeColor("muted");

    if (friends.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={mutedColor} />
                <Text style={[styles.emptyTitle, { color: foregroundColor }]}>No friends yet</Text>
                <Text style={[styles.emptySubtitle, { color: mutedColor }]}>
                    Add friends to see their workouts and stay motivated together!
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: foregroundColor }]}>
                Friends ({friends.length})
            </Text>
            {friends.map((friend) => (
                <Card key={friend.odataFriendship} style={styles.friendCard}>
                    <Card.Body>
                        <View style={styles.friendRow}>
                            <UserProfileDisplay
                                userId={friend.odataId}
                                showActiveWorkout
                                activeWorkoutId={friend.odataActiveWorkout}
                                onPress={() => router.push(`/profile/${friend.odataId}` as any)}
                            />
                            {friend.odataActiveWorkout && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onPress={() =>
                                        router.push(
                                            `/workout/spectate/${friend.odataActiveWorkout}` as any
                                        )
                                    }
                                >
                                    <Ionicons
                                        name="eye-outline"
                                        size={16}
                                        color={foregroundColor}
                                    />
                                    <Button.Label>Watch</Button.Label>
                                </Button>
                            )}
                        </View>
                    </Card.Body>
                </Card>
            ))}
        </View>
    );
}

export default function FriendsPage() {
    const backgroundColor = useThemeColor("background");
    const surfaceColor = useThemeColor("surface");
    const foregroundColor = useThemeColor("foreground");
    const accentColor = useThemeColor("accent");

    const { user } = useUser();
    const [refreshing, setRefreshing] = useState(false);

    // Queries - use getByUserId with current user's id
    const friendsData = useQuery(api.friends.getByUserId, user?.id ? { userId: user.id } : "skip");
    const pendingRequests = useQuery(
        api.friends.getRequests,
        user?.id ? { userId: user.id } : "skip"
    );

    // Mutations
    const acceptRequest = useMutation(api.friends.acceptRequest);
    const removeRequest = useMutation(api.friends.remove);

    const handleAccept = async (friendId: string) => {
        try {
            await acceptRequest({ friendId: friendId as any });
        } catch (error) {
            console.error("Failed to accept request:", error);
        }
    };

    const handleDecline = async (friendId: string) => {
        try {
            await removeRequest({ friendId: friendId as any });
        } catch (error) {
            console.error("Failed to decline request:", error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Convex queries auto-refresh, so we just wait a bit
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const isLoading = friendsData === undefined || pendingRequests === undefined;

    // Transform data for display - filter accepted friendships
    const friends: Friend[] = useMemo(() => {
        if (!friendsData || !user?.id) return [];
        return friendsData
            .filter((f: any) => f.status === "accepted")
            .map((f: any) => ({
                odataType: "friend" as const,
                odataId: f.requesterId === user.id ? f.recipientId : f.requesterId,
                odataFriendship: f._id,
                odataFriendSince: f.updatedAt || f.createdAt,
                odataActiveWorkout: undefined, // Would need active workout query
            }));
    }, [friendsData, user?.id]);

    const pending: PendingRequest[] = useMemo(() => {
        if (!pendingRequests) return [];
        return pendingRequests.map((r: any) => ({
            odataType: "pending" as const,
            odataId: r.requesterId,
            odataRequestId: r._id,
            odataRequestedAt: r._creationTime,
        }));
    }, [pendingRequests]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["bottom"]}>
            <Stack.Screen
                options={{
                    title: "Friends",
                    headerShown: true,
                    headerStyle: { backgroundColor: surfaceColor },
                    headerTintColor: foregroundColor,
                }}
            />

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <Spinner size="lg" />
                </View>
            ) : (
                <View style={styles.content}>
                    <FlatList
                        data={[{ type: "content" }]}
                        renderItem={() => (
                            <View style={styles.listContent}>
                                <PendingRequests
                                    requests={pending}
                                    onAccept={handleAccept}
                                    onDecline={handleDecline}
                                />
                                <FriendsList friends={friends} />
                            </View>
                        )}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    />
                </View>
            )}

            {/* FAB to add friends */}
            <Pressable
                style={[styles.fab, { backgroundColor: accentColor }]}
                onPress={() => router.push("/friend/add-friend" as any)}
            >
                <Ionicons name="person-add" size={24} color="#fff" />
            </Pressable>
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
    listContent: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
    },
    userProfile: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    userProfileLoading: {
        height: 48,
        justifyContent: "center",
    },
    userInfo: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: "500",
    },
    workoutBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    requestCard: {
        marginBottom: 8,
    },
    requestRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    requestActions: {
        flexDirection: "row",
        gap: 8,
    },
    friendCard: {
        marginBottom: 8,
    },
    friendRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 48,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: "center",
        paddingHorizontal: 32,
    },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
});
