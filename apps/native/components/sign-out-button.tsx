import { useClerk } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, useThemeColor, useToast } from "heroui-native";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

export const SignOutButton = () => {
    // Use `useClerk()` to access the `signOut()` function
    const { signOut } = useClerk();
    const router = useRouter();
    const { toast } = useToast();

    const handleSignOut = async () => {
        try {
            await signOut();
            // Redirect to your desired page
            router.replace("/(auth)");
        } catch (err) {
            // See https://clerk.com/docs/custom-flows/error-handling
            // for more info on error handling
            console.error(JSON.stringify(err, null, 2));
            toast.show({
                variant: "danger",
                label: "Fehler beim Abmelden",
                description: "Beim Abmelden ist ein Fehler aufgetreten. Bitte versuche es erneut.",
                icon: (
                    <StyledIonicons name="alert-circle" size={16} className="text-danger mt-0.75" />
                ),
            });
        }
    };

    return (
        <Button onPress={handleSignOut} variant="danger" size="md">
            <StyledIonicons name="log-out-outline" size={14} className="text-danger-foreground" />
            <Button.Label>Abmelden</Button.Label>
        </Button>
    );
};
