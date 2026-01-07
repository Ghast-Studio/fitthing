import { useClerk } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Text, TouchableOpacity } from "react-native";

export const SignOutButton = () => {
    // Use `useClerk()` to access the `signOut()` function
    const { signOut } = useClerk();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut();
            // Redirect to your desired page
            router.replace("/(auth)");
        } catch (err) {
            // See https://clerk.com/docs/custom-flows/error-handling
            // for more info on error handling
            console.error(JSON.stringify(err, null, 2));
        }
    };

    return (
        <Button onPress={handleSignOut} variant="ghost">
            <Button.Label>
                <Ionicons name="log-out" size={24} color="white" />
            </Button.Label>
        </Button>
    );
};
