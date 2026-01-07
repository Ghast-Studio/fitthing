import { useState, useEffect } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor, RadioGroup, Surface, Divider, cn } from "heroui-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    interpolateColor,
} from "react-native-reanimated";

import { useOnboardingStore } from "@/store/store";

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type Goal = {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
};

export type RecordingPlanOption = {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    description?: string;
};

export type RestTimeOption = {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    duration: string;
    benefits: string[];
    label?: string;
};

export type WeeklyGoalOption = {
    id: string;
    days: string;
    label: string;
};

export const goals: Goal[] = [
    { id: "remember_less", icon: "bulb-outline", title: "Weniger merken" },
    { id: "organization", icon: "folder-open-outline", title: "Organisation verbessern" },
    { id: "rest_timing", icon: "time-outline", title: "Pausenzeit optimieren" },
    { id: "strength", icon: "trending-up", title: "Kraft steigern" },
    { id: "physique", icon: "body-outline", title: "Körper verbessern" },
    { id: "save_time", icon: "flash", title: "Zeit sparen" },
    { id: "motivation", icon: "flame", title: "Motivation steigern" },
];

export const recordingPlans: RecordingPlanOption[] = [
    {
        id: "minimal",
        icon: "flash",
        title: "Minimal",
        subtitle: "Nur wichtige Sätze werden erfasst.",
        description:
            "Konzentriere dich aufs Training, nicht aufs Tippen. Zeichne nur die intensivsten Sätze und persönlichen Bestleistungen auf. Ideal für schnelle Workouts ohne Unterbrechungen.",
    },
    {
        id: "balanced",
        icon: "options-outline",
        title: "Ausgewogen",
        subtitle: "Das Wesentliche erfassen, nicht mehr.",
        description:
            "Der goldene Mittelweg zwischen Detail und Effizienz. Tracke deine Arbeitssätze sowie besonders gute oder schwache Sätze. Genug Daten für Fortschritt, ohne überwältigend zu sein.",
    },
    {
        id: "detailed",
        icon: "search",
        title: "Detailliert",
        subtitle: "Vollständige Dokumentation aller Sätze.",
        description:
            "Maximale Transparenz über dein Training. Jeder Satz wird festgehalten, inklusive Aufwärmen und Hilfsübungen. Perfekt für datengetriebene Athleten, die jeden Aspekt analysieren möchten.",
    },
    {
        id: "custom",
        icon: "settings",
        title: "Benutzerdefiniert",
        subtitle: "Erstelle deinen individuellen Mix.",
        description:
            "Dein Training, deine Regeln. Kombiniere verschiedene Ansätze je nach Übung oder Zielsetzung. Maximale Flexibilität für fortgeschrittene Nutzer.",
    },
];

export const restTimes: RestTimeOption[] = [
    {
        id: "1min",
        icon: "water",
        color: "#F97316",
        duration: "1 Minute",
        benefits: ["Höhere Satzdichte", "Perfekt für Ausdauer"],
        label: "Kraftausdauer",
    },
    {
        id: "2min",
        icon: "triangle",
        color: "#10B981",
        duration: "2 Minuten",
        benefits: ["Optimal für Hypertrophie"],
        label: "Muskelaufbau",
    },
    {
        id: "5min",
        icon: "ellipsis-horizontal",
        color: "#EF4444",
        duration: "5 Minuten",
        benefits: ["Vollständige Erholung", "Maximale Power"],
        label: "Maximalkraft",
    },
];

export const weeklyGoals: WeeklyGoalOption[] = [
    { id: "1", days: "1 Tag", label: "First Steps" },
    { id: "2", days: "2 Tage", label: "Double Pump" },
    { id: "3", days: "3 Tage", label: "Triple Threat" },
    { id: "4", days: "4 Tage", label: "Lean Machine" },
    { id: "5", days: "5 Tage", label: "Iron Addict" },
    { id: "6", days: "6 Tage", label: "Gym Rat" },
    { id: "7", days: "Jeden Tag", label: "Legend" },
];

// Animated Radio Item Component for Recording Plans
export function AnimatedRecordingPlanItem({
    plan,
    isSelected,
}: {
    plan: RecordingPlanOption;
    isSelected: boolean;
}) {
    const accentColor = useThemeColor("accent");
    const mutedColor = useThemeColor("muted");
    const surfaceColor = useThemeColor("surface");
    const surfaceSecondaryColor = useThemeColor("surface-secondary");
    const [showDescription, setShowDescription] = useState(isSelected);

    // Animated values
    const animProgress = useSharedValue(isSelected ? 1 : 0);
    const contentHeight = useSharedValue(0);
    const measuredHeight = useSharedValue(0);

    // Measure and animate when selection changes
    useEffect(() => {
        animProgress.value = withTiming(isSelected ? 1 : 0, {
            duration: 350,
            easing: Easing.out(Easing.cubic),
        });

        if (isSelected) {
            setShowDescription(true);
            contentHeight.value = withTiming(measuredHeight.value, {
                duration: 250,
                easing: Easing.out(Easing.cubic),
            });
        } else {
            contentHeight.value = withTiming(0, {
                duration: 200,
                easing: Easing.in(Easing.cubic),
            });
            // Delay hiding until animation completes
            const timeout = setTimeout(() => setShowDescription(false), 200);
            return () => clearTimeout(timeout);
        }
    }, [isSelected]);

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            borderColor: interpolateColor(animProgress.value, [0, 1], [surfaceColor, accentColor]),
            backgroundColor: interpolateColor(
                animProgress.value,
                [0, 1],
                [surfaceColor, surfaceSecondaryColor]
            ),
        };
    });

    const animatedContentStyle = useAnimatedStyle(() => {
        return {
            height: contentHeight.value,
            opacity: animProgress.value,
            overflow: "hidden" as const,
        };
    });

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            opacity: 0.5 + animProgress.value * 0.5,
        };
    });

    return (
        <AnimatedView
            className="p-4 rounded-xl border-2 flex-row items-start"
            style={[animatedContainerStyle]}
        >
            <View className="flex-1">
                <View className="flex-row items-center mb-1">
                    <AnimatedView style={animatedIconStyle}>
                        <Ionicons
                            name={plan.icon}
                            size={20}
                            color={isSelected ? accentColor : mutedColor}
                            style={{ marginRight: 10 }}
                        />
                    </AnimatedView>
                    <RadioGroup.Label className="text-base font-semibold">
                        {plan.title}
                    </RadioGroup.Label>
                </View>
                <RadioGroup.Description className="text-sm ml-8">
                    {plan.subtitle}
                </RadioGroup.Description>
                {plan.description && (
                    <>
                        {/* Hidden measurer */}
                        <View
                            style={styles.measurer}
                            onLayout={(e) => {
                                measuredHeight.value = e.nativeEvent.layout.height;
                                if (isSelected && contentHeight.value === 0) {
                                    contentHeight.value = e.nativeEvent.layout.height;
                                }
                            }}
                        >
                            <Divider className="my-3" />
                            <Text className="text-muted text-sm leading-5">{plan.description}</Text>
                        </View>
                        {/* Animated visible content */}
                        {showDescription && (
                            <AnimatedView style={animatedContentStyle}>
                                <Divider className="my-3" />
                                <Text className="text-muted text-sm leading-5">
                                    {plan.description}
                                </Text>
                            </AnimatedView>
                        )}
                    </>
                )}
            </View>
        </AnimatedView>
    );
}

// Animated Radio Item Component for Rest Times
export function AnimatedRestTimeItem({
    rest,
    isSelected,
}: {
    rest: RestTimeOption;
    isSelected: boolean;
}) {
    const surfaceColor = useThemeColor("surface");
    const surfaceSecondaryColor = useThemeColor("surface-secondary");
    const animProgress = useSharedValue(isSelected ? 1 : 0);
    const labelHeight = useSharedValue(isSelected ? 20 : 0);

    useEffect(() => {
        animProgress.value = withTiming(isSelected ? 1 : 0, {
            duration: 200,
            easing: Easing.out(Easing.cubic),
        });
        labelHeight.value = withTiming(isSelected ? 20 : 0, {
            duration: 200,
            easing: Easing.out(Easing.cubic),
        });
    }, [isSelected]);

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            borderColor: interpolateColor(animProgress.value, [0, 1], [surfaceColor, rest.color]),
            backgroundColor: interpolateColor(
                animProgress.value,
                [0, 1],
                [surfaceColor, surfaceSecondaryColor]
            ),
        };
    });

    const animatedLabelStyle = useAnimatedStyle(() => {
        return {
            height: labelHeight.value,
            opacity: animProgress.value,
        };
    });

    return (
        <AnimatedView
            className="p-4 rounded-xl border-2 flex-row items-start"
            style={animatedContainerStyle}
        >
            <Ionicons
                name={rest.icon}
                size={20}
                color={rest.color}
                style={{ marginRight: 12, marginTop: 2 }}
            />
            <View className="flex-1">
                <RadioGroup.Label className="text-base font-semibold mb-1">
                    {rest.duration}
                </RadioGroup.Label>
                {rest.benefits.map((benefit, idx) => (
                    <RadioGroup.Description key={idx} className="text-sm">
                        {benefit}
                    </RadioGroup.Description>
                ))}
                {rest.label && (
                    <AnimatedView style={animatedLabelStyle}>
                        <Text className="text-accent text-sm font-medium mt-1">{rest.label}</Text>
                    </AnimatedView>
                )}
            </View>
        </AnimatedView>
    );
}

// Animated Goal Item Component
export function AnimatedGoalItem({ goal }: { goal: Goal }) {
    const { toggleGoal, selectedGoals } = useOnboardingStore();
    console.log(selectedGoals);
    
    const isSelected = selectedGoals.includes(goal.id);

    const accentColor = useThemeColor("accent");
    const mutedColor = useThemeColor("muted");
    const surfaceColor = useThemeColor("surface");
    const surfaceSecondaryColor = useThemeColor("surface-secondary");
    const animProgress = useSharedValue(isSelected ? 1 : 0);

    useEffect(() => {
        animProgress.value = withTiming(isSelected ? 1 : 0, {
            duration: 180,
            easing: Easing.out(Easing.cubic),
        });
    }, [isSelected]);

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            borderColor: interpolateColor(animProgress.value, [0, 1], [surfaceColor, accentColor]),
            backgroundColor: interpolateColor(
                animProgress.value,
                [0, 1],
                [surfaceColor, surfaceSecondaryColor]
            ),
        };
    });

    return (
        <AnimatedPressable
            onPress={() => toggleGoal(goal.id)}
            className="flex-row items-center p-4 rounded-xl border-2"
            style={animatedContainerStyle}
        >
            <Ionicons
                name={goal.icon}
                size={22}
                color={isSelected ? accentColor : mutedColor}
                style={{ marginRight: 12 }}
            />
            <Text className="text-foreground text-base font-medium">{goal.title}</Text>
        </AnimatedPressable>
    );
}

// Animated Weekly Goal List Item
export function AnimatedWeeklyGoalListItem({
    goal,
    isSelected,
    isLast,
}: {
    goal: WeeklyGoalOption;
    isSelected: boolean;
    isLast: boolean;
}) {
    const accentColor = useThemeColor("accent");
    const animProgress = useSharedValue(isSelected ? 1 : 0);

    useEffect(() => {
        animProgress.value = withTiming(isSelected ? 1 : 0, {
            duration: 200,
            easing: Easing.out(Easing.cubic),
        });
    }, [isSelected]);

    const animatedBorderStyle = useAnimatedStyle(() => {
        return {
            borderWidth: 2,
            borderRadius: 12,
            marginHorizontal: animProgress.value * 4,
            marginVertical: animProgress.value * 4,
            borderColor: interpolateColor(animProgress.value, [0, 1], ["transparent", accentColor]),
        };
    });

    return (
        <RadioGroup.Item value={goal.id} className="w-full">
            {() => (
                <AnimatedView style={[{ width: "100%" }, animatedBorderStyle]}>
                    <View
                        className={cn(
                            "flex-row items-center justify-between px-4 py-2.5 w-full",
                            !isSelected && !isLast && "border-b border-border"
                        )}
                    >
                        <Text className="text-foreground text-base font-medium">{goal.days}</Text>
                        <Text className={isSelected ? "text-accent font-medium" : "text-muted"}>
                            {goal.label}
                        </Text>
                    </View>
                </AnimatedView>
            )}
        </RadioGroup.Item>
    );
}

const styles = StyleSheet.create({
    measurer: {
        position: "absolute",
        opacity: 0,
        pointerEvents: "none",
    },
});
