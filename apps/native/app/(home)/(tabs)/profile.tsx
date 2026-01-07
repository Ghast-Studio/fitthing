import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, Surface, useThemeColor } from "heroui-native";

import { Container } from "@/components/container";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ProfileScreen() {
    const { user } = useUser();
    const accentColor = useThemeColor("accent");

    return (
        <Container>
            <ScrollView className="flex-1" contentContainerClassName="p-5">
                {/* Header */}
                <View className="items-center mb-8 pt-4">
                    <Avatar size="lg" alt="User Avatar">
                        <Avatar.Image
                            source={{
                                uri: user?.imageUrl,
                            }}
                        />
                        <Avatar.Fallback>{user?.firstName?.charAt(0).toUpperCase() || "U"}</Avatar.Fallback>
                    </Avatar>
                    <Text className="text-foreground text-2xl font-bold">
                        {user?.fullName || user?.firstName || "User"}
                    </Text>
                    <Text className="text-muted text-sm mt-1">
                        {user?.primaryEmailAddress?.emailAddress}
                    </Text>
                </View>

                {/* Settings Section */}
                <View className="mb-6">
                    <Text className="text-foreground text-lg font-semibold mb-3">
                        Einstellungen
                    </Text>

                    <Surface className="rounded-xl overflow-hidden">
                        <Pressable
                            onPress={() => router.push("/(home)/profile/edit")}
                            className="flex-row items-center justify-between p-4 border-b border-muted/20"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="pencil" size={20} color={accentColor} />
                                <Text className="text-foreground ml-3">Profil bearbeiten</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={accentColor} />
                        </Pressable>

                        <View className="flex-row items-center justify-between p-4">
                            <View className="flex-row items-center">
                                <Ionicons name="moon" size={20} color={accentColor} />
                                <Text className="text-foreground ml-3">Dunkelmodus</Text>
                            </View>
                            <ThemeToggle />
                        </View>
                    </Surface>
                </View>

                {/* Social Section */}
                <View className="mb-6">
                    <Text className="text-foreground text-lg font-semibold mb-3">Soziales</Text>

                    <Surface className="rounded-xl overflow-hidden">
                        <Pressable
                            onPress={() => router.push("/(home)/friend/friends")}
                            className="flex-row items-center justify-between p-4"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="people" size={20} color={accentColor} />
                                <Text className="text-foreground ml-3">Freunde</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={accentColor} />
                        </Pressable>
                    </Surface>
                </View>

                {/* Sign Out */}
                <View className="mt-4">
                    <SignOutButton />
                </View>
            </ScrollView>
        </Container>
    );
}
