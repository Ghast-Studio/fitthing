import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Avatar, Button, Card, Divider, Spinner, useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "../../../utils/convex";

export default function ProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const backgroundColor = useThemeColor("background");
  const surfaceColor = useThemeColor("surface");
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");

  const { user: currentUser } = useUser();
  const isOwnProfile = currentUser?.id === id;

  const profile = useQuery(api.userProfiles.getByUserId, { userId: id ?? "" });

  // For own profile, use current user's Clerk data; for others, show userId
  const displayName = isOwnProfile
    ? currentUser?.fullName || currentUser?.firstName || "User"
    : id?.slice(0, 8) + "...";

  const avatarUrl = isOwnProfile ? currentUser?.imageUrl : undefined;

  const fallback = isOwnProfile
    ? currentUser?.firstName?.[0] || currentUser?.fullName?.[0] || "U"
    : id?.[0]?.toUpperCase() || "U";

  const isLoading = profile === undefined;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["bottom"]}>
        <Stack.Screen
          options={{
            title: "Profile",
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
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Profile",
          headerShown: true,
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: foregroundColor,
        }}
      />

      <View style={styles.content}>
        <Card>
          <Card.Body>
            <View style={styles.profileHeader}>
              <Avatar size="lg" alt={displayName}>
                {avatarUrl ? (
                  <Avatar.Image source={{ uri: avatarUrl }} />
                ) : (
                  <Avatar.Fallback>{fallback}</Avatar.Fallback>
                )}
              </Avatar>
              <View style={styles.profileInfo}>
                <Text style={[styles.displayName, { color: foregroundColor }]}>
                  {displayName}
                </Text>
                {profile?.level && (
                  <Text style={[styles.level, { color: mutedColor }]}>
                    {profile.level.charAt(0).toUpperCase() + profile.level.slice(1)}
                  </Text>
                )}
                {!isOwnProfile && (
                  <Text style={[styles.userId, { color: mutedColor }]}>{id}</Text>
                )}
              </View>
            </View>

            <Divider className="my-4" />

            {profile?.bio && (
              <Text style={[styles.bio, { color: mutedColor }]}>{profile.bio}</Text>
            )}

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: foregroundColor }]}>
                  {profile?.totalWorkouts || 0}
                </Text>
                <Text style={[styles.statLabel, { color: mutedColor }]}>Workouts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: foregroundColor }]}>
                  {profile?.totalWorkoutTime
                    ? Math.floor(profile.totalWorkoutTime / 60000)
                    : 0}
                </Text>
                <Text style={[styles.statLabel, { color: mutedColor }]}>Minutes</Text>
              </View>
            </View>

            {isOwnProfile && (
              <>
                <Divider className="my-4" />
                <Button
                  variant="secondary"
                  onPress={() => router.push("/profile/edit" as any)}
                >
                  <Ionicons name="pencil" size={16} color={foregroundColor} />
                  <Button.Label>Edit Profile</Button.Label>
                </Button>
              </>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  level: {
    fontSize: 14,
  },
  userId: {
    fontSize: 12,
    marginTop: 4,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
});
