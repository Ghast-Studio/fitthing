import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useConvexAuth } from "convex/react";
import { useThemeColor } from "heroui-native";

export default function HomeLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const backgroundColor = useThemeColor("background");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor },
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="exercises"
        options={{
          presentation: "modal",
          title: "Exercises",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="exercise/[id]"
        options={{
          presentation: "modal",
          title: "Exercise Details",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="friend/friends"
        options={{
          title: "Friends",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="friend/add-friend"
        options={{
          presentation: "modal",
          title: "Add Friend",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="routine/create"
        options={{
          title: "Create Routine",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="routine/select-exercise"
        options={{
          presentation: "modal",
          title: "Select Exercise",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="profile/[id]"
        options={{
          title: "Profile",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="profile/edit"
        options={{
          title: "Edit Profile",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          title: "Welcome!",
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="workout/active"
        options={{
          title: "Active Workout",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="workout/[id]"
        options={{
          title: "Workout Details",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="workout/spectate/[id]"
        options={{
          title: "Spectating Workout",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
