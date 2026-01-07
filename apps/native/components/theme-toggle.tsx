import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Platform, Pressable } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { useAppTheme } from "@/contexts/app-theme-context";
import { Button } from "heroui-native";

const StyledIonicons = withUniwind(Ionicons);

export function ThemeToggle() {
    const { toggleTheme, isLight } = useAppTheme();

    return (
        <Button
            onPress={() => {
                if (Platform.OS === "ios") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                toggleTheme();
            }}
            className="px-2.5"
            variant="ghost"
        >
            {isLight ? (
                <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
                    <StyledIonicons name="moon" size={20} className="text-foreground" />
                </Animated.View>
            ) : (
                <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
                    <StyledIonicons name="sunny" size={20} className="text-foreground" />
                </Animated.View>
            )}
        </Button>
    );
}
