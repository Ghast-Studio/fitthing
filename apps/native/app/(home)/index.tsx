import { useEffect } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router, Stack } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";
import { Text } from "react-native";

import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

import { api } from "@ex/backend/convex/_generated/api";

import { useExerciseDatabase } from "@/utils/useExerciseDatabase";
import { useWorkoutSession } from "@/utils/useWorkoutSession";

export default function HomePage() {
  const { user } = useUser();
  const backgroundColor = useThemeColor("background");
  const foregroundColor = useThemeColor("foreground");
  const primaryColor = useThemeColor("accent");
  const mutedForeground = useThemeColor("muted");

  const needsOnboarding = useQuery(api.userProfiles.needsOnboarding, {});
  const routines = useQuery(api.routines.list, {});

  // Redirect to onboarding if needed
  useEffect(() => {
    if (needsOnboarding) {
      router.replace("/(home)/onboarding");
    }
  }, [needsOnboarding]);

  const isLoading = routines === undefined || needsOnboarding === undefined;

  const { forceSync, clearDatabase } = useExerciseDatabase();
  const { activeSession, startWorkout } = useWorkoutSession();

  // Find active workout routine name
  const activeWorkoutRoutine = routines?.find(
    (r) => r._id === activeSession?.routineId
  );

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor,
        }}
      >
        <Spinner size="lg" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <Stack.Screen
        options={{
          title: "Home",
          headerShown: false,
        }}
      />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
          borderBottomWidth: 1,
          borderBottomColor: mutedForeground,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ color: mutedForeground, fontSize: 14 }}>
              Welcome back
            </Text>
            <Text
              style={{
                color: foregroundColor,
                fontSize: 28,
                fontWeight: "800",
              }}
            >
              {user?.firstName || "User"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable onPress={() => router.push("/(home)/friend/friends")}>
              <Ionicons name="people" size={24} color={primaryColor} />
            </Pressable>
            <ThemeToggle />
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Active Workout Banner */}
        {activeSession && (
          <Pressable
            onPress={() => router.push("/(home)/workout/active")}
            style={{
              backgroundColor: primaryColor,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                  Active Workout
                </Text>
                <Text style={{ color: "#fff", opacity: 0.8, fontSize: 14 }}>
                  {activeWorkoutRoutine?.name || "Quick Workout"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {formatDuration(Date.now() - activeSession.startedAt)}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            </View>
          </Pressable>
        )}

        {/* Quick Actions */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: foregroundColor,
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 12,
            }}
          >
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => router.push("/(home)/exercises")}
              style={{
                flex: 1,
                backgroundColor,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: mutedForeground,
              }}
            >
              <Ionicons name="barbell" size={28} color={primaryColor} />
              <Text
                style={{
                  color: foregroundColor,
                  marginTop: 8,
                  fontWeight: "600",
                }}
              >
                Exercises
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(home)/routine/create")}
              style={{
                flex: 1,
                backgroundColor,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: mutedForeground,
              }}
            >
              <Ionicons name="add-circle" size={28} color={primaryColor} />
              <Text
                style={{
                  color: foregroundColor,
                  marginTop: 8,
                  fontWeight: "600",
                }}
              >
                New Routine
              </Text>
            </Pressable>
          </View>
        </View>

        {/* My Routines */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: foregroundColor,
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 12,
            }}
          >
            My Routines
          </Text>
          {routines && routines.length > 0 ? (
            routines.map((routine) => (
              <Surface
                key={routine._id}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: foregroundColor,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  {routine.name}
                </Text>
                <Text style={{ color: mutedForeground, marginTop: 4 }}>
                  {routine.exercises.length} exercises
                </Text>
                <Button onPress={() => router.push(`/(home)/workout/${routine._id}`)}>Start</Button>
              </Surface>
            ))
          ) : (
            <Surface
              style={{
                borderRadius: 12,
                padding: 24,
                alignItems: "center",
              }}
            >
              <Ionicons name="fitness" size={48} color={mutedForeground} />
              <Text
                style={{
                  color: mutedForeground,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                No routines yet. Create your first routine to get started!
              </Text>
            </Surface>
          )}
        </View>

        {/* Sign Out */}
        <View style={{ marginTop: 20, paddingBottom: 40 }}>
          <SignOutButton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
