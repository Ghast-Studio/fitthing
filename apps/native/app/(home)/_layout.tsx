import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { useConvexAuth } from "convex/react";
import { useThemeColor } from "heroui-native";

export default function HomeLayout() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const backgroundColor = useThemeColor("background");
    const foregroundColor = useThemeColor("foreground");

    if (isLoading) {
        return (
            <View
                style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor }}
            >
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
                headerTintColor: foregroundColor,
                headerTitleStyle: { color: foregroundColor, fontWeight: "600" },
                contentStyle: { backgroundColor },
            }}
        >
            {/* Main Tabs */}
            <Stack.Screen
                name="(tabs)"
                options={{
                    headerShown: false,
                }}
            />

            {/* Onboarding */}
            <Stack.Screen
                name="onboarding"
                options={{
                    title: "Willkommen!",
                    headerShown: false,
                    presentation: "fullScreenModal",
                }}
            />

            {/* Exercise Details */}
            <Stack.Screen
                name="exercise/[id]"
                options={{
                    presentation: "modal",
                    title: "Übung",
                    headerShown: true,
                }}
            />

            {/* Friends */}
            <Stack.Screen
                name="friend/friends"
                options={{
                    title: "Freunde",
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="friend/add-friend"
                options={{
                    presentation: "modal",
                    title: "Freund hinzufügen",
                    headerShown: true,
                }}
            />

            {/* Routines */}
            <Stack.Screen
                name="routine/create"
                options={{
                    title: "Routine erstellen",
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="routine/select-exercise"
                options={{
                    presentation: "modal",
                    title: "Übung auswählen",
                    headerShown: true,
                }}
            />

            {/* Profile */}
            <Stack.Screen
                name="profile/[id]"
                options={{
                    title: "Profil",
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="profile/edit"
                options={{
                    title: "Profil bearbeiten",
                    headerShown: true,
                }}
            />

            {/* Workouts */}
            <Stack.Screen
                name="workout/active"
                options={{
                    title: "Aktives Training",
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="workout/[id]"
                options={{
                    title: "Training",
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="workout/spectate/[id]"
                options={{
                    title: "Training beobachten",
                    headerShown: true,
                }}
            />
        </Stack>
    );
}
