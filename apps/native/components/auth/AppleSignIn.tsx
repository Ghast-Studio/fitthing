import * as React from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Button, useThemeColor } from "heroui-native";
import { fromThrowable } from "@/utils/result";
import { useSSO } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";

// Required for OAuth flow
WebBrowser.maybeCompleteAuthSession();

export default function AppleSignIn() {
    const { startSSOFlow } = useSSO();
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const primaryForeground = useThemeColor("accent-foreground");

    const onPress = async () => {
        setIsLoading(true);
        try {
            const result = await fromThrowable(
                () => startSSOFlow({ strategy: "oauth_apple" }),
                (error) => ({
                    type: "oauth_error" as const,
                    message: "Failed to start OAuth flow",
                    originalError: error,
                })
            );

            if (result.isErr()) {
                console.error("OAuth error:", JSON.stringify(result.error, null, 2));
                return;
            }

            const { createdSessionId, signIn, signUp, setActive } = result.value;

            if (createdSessionId) {
                // Session was created successfully
                if (!setActive) {
                    console.error("setActive is not available");
                    return;
                }

                try {
                    const setActiveResult = await fromThrowable(
                        () => setActive({ session: createdSessionId }),
                        (error) => ({
                            type: "session_error" as const,
                            message: "Failed to set active session",
                            originalError: error,
                        })
                    );

                    setActiveResult.match(
                        () => {
                            router.replace("/(home)");
                        },
                        (err) => {
                            console.error(
                                "Set active session error:",
                                JSON.stringify(err, null, 2)
                            );
                        }
                    );
                } catch (error) {
                    console.error("Unexpected error setting active session:", error);
                }
            } else {
                // Use signIn or signUp for next steps such as MFA
                console.log("Additional steps required:", { signIn, signUp });
            }
        } catch (error) {
            console.error("Unexpected error in OAuth flow:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="primary"
            onPress={onPress}
            isDisabled={isLoading}
            style={{ backgroundColor: "#000000", width: "100%" }}
        >
            <Ionicons
                name="logo-apple"
                size={20}
                color={primaryForeground}
                style={{ marginRight: 8 }}
            />
            <Button.Label>{isLoading ? "Signing in..." : "Sign in with Apple"}</Button.Label>
        </Button>
    );
}
