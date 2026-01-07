import { View } from "react-native";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Surface, useThemeColor } from "heroui-native";

type VisibilitySelectorProps = {
    value: "private" | "friends" | "public";
    onChange: (value: "private" | "friends" | "public") => void;
};

const visibilityOptions = [
    { value: "private" as const, label: "Private", icon: "lock-closed" as const },
    { value: "friends" as const, label: "Friends Only", icon: "people" as const },
    { value: "public" as const, label: "Public", icon: "globe" as const },
];

export function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
    const mutedForeground = useThemeColor("muted");
    const primaryForeground = useThemeColor("accent-foreground");
    const primaryColor = useThemeColor("accent");

    return (
        <Surface className="w-full mb-6 p-4 rounded-xl">
            <Text
                style={{
                    color: mutedForeground,
                    fontSize: 13,
                    fontWeight: "600",
                    marginBottom: 12,
                }}
            >
                Visibility
            </Text>
            <View style={{ gap: 8 }}>
                {visibilityOptions.map((option) => (
                    <Button
                        key={option.value}
                        variant={value === option.value ? "primary" : "secondary"}
                        size="md"
                        onPress={() => onChange(option.value)}
                    >
                        <Ionicons
                            name={option.icon}
                            size={16}
                            color={value === option.value ? primaryForeground : primaryColor}
                            style={{ marginRight: 8 }}
                        />
                        <Button.Label>{option.label}</Button.Label>
                    </Button>
                ))}
            </View>
        </Surface>
    );
}
