import { useState, useEffect } from "react";
import { Alert, ScrollView, View, Text } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { Button, useThemeColor, RadioGroup, Surface } from "heroui-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    FadeIn,
    FadeOut,
    FadeInRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@ex/backend/convex/_generated/api";
import { Container } from "@/components";
import { useOnboardingStore } from "@/store/store";
import type {
    RecordingPlan as RecordingPlanType,
    WeeklyGoal as WeeklyGoalType,
    RestTime as RestTimeType,
} from "@/store/store";
import {
    AnimatedGoalItem,
    AnimatedRecordingPlanItem,
    AnimatedRestTimeItem,
    AnimatedWeeklyGoalListItem,
    goals,
    recordingPlans,
    restTimes,
    weeklyGoals,
} from "@/components/onboarding/OnboardingComponents";

const AnimatedView = Animated.createAnimatedComponent(View);

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
    const insets = useSafeAreaInsets();
    const accentColor = useThemeColor("accent");
    const mutedColor = useThemeColor("muted");
    const surfaceColor = useThemeColor("surface");
    const surfaceSecondaryColor = useThemeColor("surface-secondary");

    const createOnboarding = useMutation(api.userProfiles.createOnboarding);

    // Use Zustand store
    const {
        step,
        selectedGoals,
        recordingPlan,
        weeklyGoal,
        restTime,
        createPlan,
        nextStep,
        toggleGoal,
        setRecordingPlan,
        setWeeklyGoal,
        setRestTime,
        setCreatePlan,
        canProceed,
        reset,
    } = useOnboardingStore();

    const [isSaving, setIsSaving] = useState(false);

    // Animated progress value (0 to 1)
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming((step - 1) / (TOTAL_STEPS - 1), {
            duration: 400,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
    }, [step]);

    const progressAnimatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progress.value * 100}%`,
        };
    });

    const handleNext = () => {
        if (step < TOTAL_STEPS) {
            nextStep();
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = async () => {
        setIsSaving(true);
        try {
            await createOnboarding({
                goals: selectedGoals,
                recordingPlan: recordingPlan,
                restTime: restTime,
                level: "intermediate",
                units: "metric",
                preferredWorkoutTime: "anytime",
            });
            reset(); // Reset store after completion
            router.replace("/(home)/(tabs)" as any);
        } catch (error: any) {
            Alert.alert("Fehler", error.message || "Onboarding konnte nicht abgeschlossen werden");
            setIsSaving(false);
        }
    };

    return (
        <Container className="flex-1 bg-background" disableSafeArea disableScrollView>
            <View className="flex-1">
                <ScrollView
                    className="flex-1 pt-5"
                    contentContainerClassName="px-5 pt-12 pb-6"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Step 1: Goals */}
                    {step === 1 && (
                        <AnimatedView
                            key="step-1"
                            entering={FadeInRight.duration(300).easing(Easing.out(Easing.cubic))}
                        >
                            <Text className="text-foreground text-3xl font-bold text-center mb-3">
                                Warum nutzt du <Text className="text-accent">FitThing</Text>?
                            </Text>
                            <Text className="text-muted text-center mb-8 leading-5">
                                Wähle deine Trainingsziele aus. Die App wird darauf abgestimmt und
                                liefert dir relevante Features.
                            </Text>

                            <View className="gap-2">
                                {goals.map((goal) => {
                                    return <AnimatedGoalItem key={goal.id} goal={goal} />;
                                })}
                            </View>
                        </AnimatedView>
                    )}

                    {/* Step 2: Recording Plan */}
                    {step === 2 && (
                        <AnimatedView
                            key="step-2"
                            entering={FadeInRight.duration(300).easing(Easing.out(Easing.cubic))}
                        >
                            <View className="items-center mb-6">
                                <View
                                    className="w-16 h-16 rounded-full items-center justify-center mb-4"
                                    style={{ backgroundColor: `${accentColor}20` }}
                                >
                                    <Ionicons name="clipboard" size={32} color={accentColor} />
                                </View>
                                <Text className="text-foreground text-3xl font-bold text-center mb-3">
                                    Wähle deinen{"\n"}Aufzeichnungsstil
                                </Text>
                                <Text className="text-muted text-center leading-5">
                                    Entscheide, wie detailliert du trainieren möchtest. Setgraph
                                    bietet dir die passende Flexibilität.
                                </Text>
                            </View>

                            <RadioGroup
                                value={recordingPlan ?? ""}
                                onValueChange={(value) =>
                                    setRecordingPlan(value as RecordingPlanType)
                                }
                                className="gap-2"
                            >
                                {recordingPlans.map((plan) => (
                                    <RadioGroup.Item key={plan.id} value={plan.id}>
                                        {({ isSelected }) => (
                                            <AnimatedRecordingPlanItem
                                                plan={plan}
                                                isSelected={isSelected}
                                            />
                                        )}
                                    </RadioGroup.Item>
                                ))}
                            </RadioGroup>
                        </AnimatedView>
                    )}

                    {/* Step 3: Weekly Goal */}
                    {step === 3 && (
                        <AnimatedView
                            key="step-3"
                            entering={FadeInRight.duration(300).easing(Easing.out(Easing.cubic))}
                        >
                            <View className="items-center mb-4">
                                <View
                                    className="w-14 h-14 rounded-full items-center justify-center mb-3"
                                    style={{ backgroundColor: `${accentColor}20` }}
                                >
                                    <Ionicons name="calendar" size={28} color={accentColor} />
                                </View>
                                <Text className="text-foreground text-2xl font-bold text-center mb-2">
                                    Dein wöchentliches{"\n"}Trainingsziel
                                </Text>
                                <Text className="text-muted text-center text-sm leading-5">
                                    Regelmäßigkeit ist der Schlüssel zum Erfolg. Bei längerer Pause
                                    erhältst du eine freundliche Erinnerung.
                                </Text>
                            </View>

                            <Text className="text-muted text-center text-sm mb-3">
                                An wie vielen Tagen trainierst du pro Woche?
                            </Text>

                            <Surface variant="secondary" className="rounded-xl overflow-hidden">
                                <RadioGroup
                                    value={weeklyGoal}
                                    onValueChange={(value) =>
                                        setWeeklyGoal(value as WeeklyGoalType)
                                    }
                                >
                                    {weeklyGoals.map((goal, index) => {
                                        const isSelected = weeklyGoal === goal.id;
                                        const isLast = index === weeklyGoals.length - 1;
                                        return (
                                            <AnimatedWeeklyGoalListItem
                                                key={goal.id}
                                                goal={goal}
                                                isSelected={isSelected}
                                                isLast={isLast}
                                            />
                                        );
                                    })}
                                </RadioGroup>
                            </Surface>
                        </AnimatedView>
                    )}

                    {/* Step 4: Rest Time */}
                    {step === 4 && (
                        <AnimatedView
                            key="step-4"
                            entering={FadeInRight.duration(300).easing(Easing.out(Easing.cubic))}
                        >
                            <View className="items-center mb-6">
                                <View
                                    className="w-16 h-16 rounded-full items-center justify-center mb-4"
                                    style={{ backgroundColor: `${accentColor}20` }}
                                >
                                    <Ionicons name="refresh" size={32} color={accentColor} />
                                </View>
                                <Text className="text-foreground text-3xl font-bold text-center mb-3">
                                    Standard-Pausenzeit
                                </Text>
                                <Text className="text-muted text-center leading-5 mb-2">
                                    Der integrierte Timer zeigt dir, wann du für den nächsten Satz
                                    bereit bist.
                                </Text>
                                <Text className="text-muted text-center text-sm">
                                    Automatischer Reset nach jedem Satz.
                                </Text>
                            </View>

                            <RadioGroup
                                value={restTime}
                                onValueChange={(value) => setRestTime(value as RestTimeType)}
                                className="gap-2 mb-4"
                            >
                                {restTimes.map((rest) => (
                                    <RadioGroup.Item key={rest.id} value={rest.id}>
                                        {({ isSelected }) => (
                                            <AnimatedRestTimeItem
                                                rest={rest}
                                                isSelected={isSelected}
                                            />
                                        )}
                                    </RadioGroup.Item>
                                ))}
                            </RadioGroup>

                            <Text className="text-muted text-xs text-center leading-4 px-2">
                                Du kannst jederzeit individuelle Pausen in den Einstellungen
                                konfigurieren. Die perfekte Ruhezeit ist individuell.{" "}
                                <Text className="text-accent">Mehr erfahren</Text>
                            </Text>

                            <Surface
                                variant="tertiary"
                                className="flex-row items-start mt-6 p-3 rounded-xl"
                            >
                                <Ionicons
                                    name="notifications-outline"
                                    size={18}
                                    color={mutedColor}
                                    style={{ marginRight: 8, marginTop: 2 }}
                                />
                                <Text className="text-muted text-sm flex-1 leading-5">
                                    Aktiviere Push-Benachrichtigungen, um rechtzeitig an deinen
                                    nächsten Satz erinnert zu werden.
                                </Text>
                            </Surface>
                        </AnimatedView>
                    )}

                    {/* Step 5: Custom Training Plan */}
                    {step === 5 && (
                        <AnimatedView
                            key="step-5"
                            entering={FadeInRight.duration(300).easing(Easing.out(Easing.cubic))}
                        >
                            <View className="items-center mb-8">
                                {/* Stylized icon with sparkles */}
                                <View className="w-28 h-28 items-center justify-center mb-6">
                                    <Ionicons
                                        name="sparkles"
                                        size={14}
                                        color="#9CA3AF"
                                        style={{ position: "absolute", top: 5, left: 10 }}
                                    />
                                    <Ionicons
                                        name="sparkles"
                                        size={10}
                                        color="#9CA3AF"
                                        style={{ position: "absolute", top: 15, right: 5 }}
                                    />
                                    <Ionicons
                                        name="sparkles"
                                        size={12}
                                        color="#9CA3AF"
                                        style={{ position: "absolute", bottom: 20, left: 5 }}
                                    />
                                    <Ionicons
                                        name="sparkles"
                                        size={8}
                                        color="#9CA3AF"
                                        style={{ position: "absolute", top: 30, right: 15 }}
                                    />
                                    <View
                                        className="w-20 h-20 rounded-2xl items-center justify-center"
                                        style={{
                                            backgroundColor: "#818CF8",
                                            shadowColor: "#818CF8",
                                            shadowOffset: { width: 0, height: 8 },
                                            shadowOpacity: 0.4,
                                            shadowRadius: 16,
                                            elevation: 8,
                                        }}
                                    >
                                        <Ionicons name="barbell" size={40} color="#fff" />
                                    </View>
                                </View>

                                <Text className="text-foreground text-2xl font-bold text-center mb-3">
                                    Personalisierter{"\n"}Trainingsplan
                                </Text>
                                <Text className="text-muted text-center leading-5">
                                    Beginne mit einem maßgeschneiderten Programm, das auf deine
                                    Bedürfnisse zugeschnitten ist.
                                </Text>
                            </View>

                            <View className="gap-5 mb-8">
                                <Surface
                                    variant="tertiary"
                                    className="flex-row items-start p-4 rounded-xl"
                                >
                                    <View
                                        className="w-10 h-10 rounded-lg items-center justify-center mr-4"
                                        style={{ backgroundColor: "#3B82F620" }}
                                    >
                                        <Ionicons name="body" size={22} color="#60A5FA" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-foreground text-base font-semibold mb-1">
                                            Gezielt Muskeln aufbauen
                                        </Text>
                                        <Text className="text-muted text-sm leading-5">
                                            Fokussiere dich auf die Muskelgruppen, die dir wichtig
                                            sind. Baue Masse auf oder definiere gezielt.
                                        </Text>
                                    </View>
                                </Surface>

                                <Surface
                                    variant="tertiary"
                                    className="flex-row items-start p-4 rounded-xl"
                                >
                                    <View
                                        className="w-10 h-10 rounded-lg items-center justify-center mr-4"
                                        style={{ backgroundColor: "#F59E0B20" }}
                                    >
                                        <Ionicons name="trophy" size={22} color="#F59E0B" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-foreground text-base font-semibold mb-1">
                                            Sportliche Performance
                                        </Text>
                                        <Text className="text-muted text-sm leading-5">
                                            Trainiere gezielt für deinen Sport und erreiche neue
                                            Bestleistungen mit strukturiertem Krafttraining.
                                        </Text>
                                    </View>
                                </Surface>

                                <Surface
                                    variant="tertiary"
                                    className="flex-row items-start p-4 rounded-xl"
                                >
                                    <View
                                        className="w-10 h-10 rounded-lg items-center justify-center mr-4"
                                        style={{ backgroundColor: "#22D3EE20" }}
                                    >
                                        <Ionicons name="color-wand" size={22} color="#22D3EE" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-foreground text-base font-semibold mb-1">
                                            100% individuell
                                        </Text>
                                        <Text className="text-muted text-sm leading-5">
                                            Dein Plan passt sich deinem Alltag, verfügbarem
                                            Equipment und persönlichen Präferenzen an.
                                        </Text>
                                    </View>
                                </Surface>
                            </View>
                        </AnimatedView>
                    )}
                </ScrollView>

                {/* Bottom Section */}
                <Surface
                    variant="secondary"
                    className="px-5 pt-4"
                    style={{ paddingBottom: Math.max(insets.bottom, 24) }}
                >
                    {/* Step 3 notification text - animated based on selection */}
                    {step === 3 &&
                        (() => {
                            const inactivityDays =
                                parseInt(weeklyGoal) <= 2 ? 5 : parseInt(weeklyGoal) <= 4 ? 3 : 2;
                            return (
                                <AnimatedView
                                    key={`notification-${inactivityDays}`}
                                    entering={FadeIn.duration(200)}
                                    exiting={FadeOut.duration(150)}
                                    className="flex-row items-center justify-center mb-3"
                                >
                                    <Ionicons
                                        name="calendar-outline"
                                        size={16}
                                        color={mutedColor}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text className="text-muted text-sm">
                                        Nach {inactivityDays} Tagen Inaktivität eine Erinnerung
                                        erhalten
                                    </Text>
                                </AnimatedView>
                            );
                        })()}

                    {step === 5 ? (
                        <>
                            <Button
                                variant="secondary"
                                onPress={() => {
                                    setCreatePlan(true);
                                    handleComplete();
                                }}
                                className="mb-3"
                            >
                                <Button.Label>Erstelle deinen Plan</Button.Label>
                            </Button>
                            <Button variant="ghost" onPress={handleSkip}>
                                <Button.Label>Nicht jetzt</Button.Label>
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="primary"
                            onPress={handleNext}
                            isDisabled={!canProceed() || isSaving}
                        >
                            <Button.Label>
                                {isSaving ? "Wird gespeichert..." : "Weiter"}
                            </Button.Label>
                        </Button>
                    )}

                    {/* Progress Bar */}
                    <View
                        className="mt-4 h-1 rounded-full overflow-hidden"
                        style={{ backgroundColor: `${mutedColor}30` }}
                    >
                        <AnimatedView
                            className="h-full rounded-full"
                            style={[{ backgroundColor: accentColor }, progressAnimatedStyle]}
                        />
                    </View>
                </Surface>
            </View>
        </Container>
    );
}
