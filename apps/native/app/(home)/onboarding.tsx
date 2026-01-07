import { useState, useEffect, useCallback } from "react";
import { Alert, Pressable, ScrollView, View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { 
  Button, 
  useThemeColor, 
  RadioGroup, 
  Checkbox, 
  Surface, 
  Divider,
  cn 
} from "heroui-native";
import { withUniwind } from "uniwind";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
  FadeInRight,
  FadeOutLeft,
  interpolateColor,
  useDerivedValue,
  runOnJS,
  useAnimatedReaction,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@ex/backend/convex/_generated/api";
import { Container } from "@/components";
import { useOnboardingStore } from "@/store/store";
import type { RecordingPlan as RecordingPlanType, WeeklyGoal as WeeklyGoalType, RestTime as RestTimeType } from "@/store/store";
import { useUser } from "@clerk/clerk-expo";

const StyledIonicons = withUniwind(Ionicons);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Goal = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
};

type RecordingPlanOption = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  description?: string;
};

type RestTimeOption = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  duration: string;
  benefits: string[];
  label?: string;
};

type WeeklyGoalOption = {
  id: string;
  days: string;
  label: string;
};

const goals: Goal[] = [
  { id: "remember_less", icon: "bulb-outline", title: "Weniger merken" },
  { id: "organization", icon: "folder-open-outline", title: "Organisation verbessern" },
  { id: "rest_timing", icon: "time-outline", title: "Pausenzeit optimieren" },
  { id: "strength", icon: "trending-up", title: "Kraft steigern" },
  { id: "physique", icon: "body-outline", title: "Körper verbessern" },
  { id: "save_time", icon: "flash", title: "Zeit sparen" },
  { id: "motivation", icon: "flame", title: "Motivation steigern" },
];

const recordingPlans: RecordingPlanOption[] = [
  {
    id: "minimal",
    icon: "flash",
    title: "Minimal",
    subtitle: "Protokolliere nur deine High-Effort oder PR-Sätze.",
    description:
        "Fokussiere dich auf das Wesentliche, indem du nur die Sätze aufzeichnest, die wirklich zählen. Dieser Ansatz spart Zeit und hält dich im Flow, während du dennoch wertvolle Daten für die Verfolgung deines Fortschritts sammelst.",
  },
  {
    id: "balanced",
    icon: "options-outline",
    title: "Ausgewogen",
    subtitle: "Protokolliere das Wichtigste ohne Überfluss.",
    description:
      "Finde die perfekte Balance zwischen Detailgenauigkeit und Geschwindigkeit. Protokolliere deine Arbeitssätze und alle Sätze, die von deinem üblichen Leistungsniveau abweichen. Dies gibt dir wertvolle Einblicke, ohne dich mit zu vielen Details zu überladen.",
  },
  {
    id: "detailed",
    icon: "search",
    title: "Detailliert",
    subtitle: "Protokolliere die meisten deiner Sätze.",
    description:
      "Erfasse jeden Aspekt deines Trainings für einen umfassenden Überblick. Dieser Ansatz bietet den meisten Kontext bei Anpassungen deiner Ziele. Du kannst auch zusätzliche Details wie Aufwärm- und leichtere Sätze für tiefere Leistungsanalysen hinzufügen.",
  },
  {
    id: "custom",
    icon: "settings",
    title: "Benutzerdefiniert",
    subtitle: "Nutze einen gemischten Ansatz für deine Bedürfnisse.",
    description:
      "Passe deinen Aufzeichnungsplan an deine spezifischen Trainingsgewohnheiten und Ziele an. Wähle aus verschiedenen Protokollierungsoptionen, um einen Plan zu erstellen, der perfekt zu dir passt und dir hilft, das Beste aus deinem Training herauszuholen.",
  },
];

const restTimes: RestTimeOption[] = [
  {
    id: "1min",
    icon: "water",
    iconColor: "#6B7280",
    duration: "1 Minute",
    benefits: ["Mehr Sätze, weniger Gelenkbelastung", "Zeiteffizient"],
    label: "Kraftausdauer",
  },
  {
    id: "2min",
    icon: "triangle",
    iconColor: "#F59E0B",
    duration: "2 Minuten",
    benefits: ["Straffer werden/Größer werden"],
    label: "Muskelaufbau",
  },
  {
    id: "5min",
    icon: "ellipsis-horizontal",
    iconColor: "#6B7280",
    duration: "5 Minuten",
    benefits: ["Muskelkraft maximieren", "Kraft steigern"],
    label: "Maximalkraft",
  },
];

const weeklyGoals: WeeklyGoalOption[] = [
  { id: "1", days: "1 Tag", label: "First Steps" },
  { id: "2", days: "2 Tage", label: "Double Pump" },
  { id: "3", days: "3 Tage", label: "Triple Threat" },
  { id: "4", days: "4 Tage", label: "Lean Machine" },
  { id: "5", days: "5 Tage", label: "Iron Addict" },
  { id: "6", days: "6 Tage", label: "Gym Rat" },
  { id: "7", days: "Jeden Tag", label: "Legend" },
];

const TOTAL_STEPS = 5;

// Animated Radio Item Component for Recording Plans
function AnimatedRecordingPlanItem({ 
  plan, 
  isSelected, 
  accentColor, 
  mutedColor,
  surfaceColor,
  surfaceSecondaryColor,
}: { 
  plan: RecordingPlanOption; 
  isSelected: boolean;
  accentColor: string;
  mutedColor: string;
  surfaceColor: string;
  surfaceSecondaryColor: string;
}) {
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
      borderColor: interpolateColor(
        animProgress.value,
        [0, 1],
        [surfaceColor, accentColor]
      ),
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
      overflow: 'hidden' as const,
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.5 + (animProgress.value * 0.5),
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
              <Text className="text-muted text-sm leading-5">
                {plan.description}
              </Text>
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
function AnimatedRestTimeItem({ 
  rest, 
  isSelected, 
  accentColor,
  mutedColor,
  surfaceColor,
  surfaceSecondaryColor,
}: { 
  rest: RestTimeOption; 
  isSelected: boolean;
  accentColor: string;
  mutedColor: string;
  surfaceColor: string;
  surfaceSecondaryColor: string;
}) {
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
      borderColor: interpolateColor(
        animProgress.value,
        [0, 1],
        [surfaceColor, accentColor]
      ),
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
        color={rest.iconColor}
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
            <Text className="text-accent text-sm font-medium mt-1">
              {rest.label}
            </Text>
          </AnimatedView>
        )}
      </View>
    </AnimatedView>
  );
}

// Animated Goal Item Component
function AnimatedGoalItem({
  goal,
  isSelected,
  onToggle,
  accentColor,
  mutedColor,
  surfaceColor,
  surfaceSecondaryColor,
}: {
  goal: Goal;
  isSelected: boolean;
  onToggle: () => void;
  accentColor: string;
  mutedColor: string;
  surfaceColor: string;
  surfaceSecondaryColor: string;
}) {
  const animProgress = useSharedValue(isSelected ? 1 : 0);
  
  useEffect(() => {
    animProgress.value = withTiming(isSelected ? 1 : 0, { 
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [isSelected]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        animProgress.value,
        [0, 1],
        [surfaceColor, accentColor]
      ),
      backgroundColor: interpolateColor(
        animProgress.value,
        [0, 1],
        [surfaceColor, surfaceSecondaryColor]
      ),
    };
  });

  return (
    <AnimatedPressable
      onPress={onToggle}
      className="flex-row items-center p-4 rounded-xl border-2"
      style={animatedContainerStyle}
    >
      <Checkbox
        isSelected={isSelected}
        onSelectedChange={onToggle}
        className="mr-3"
      />
      <Ionicons
        name={goal.icon}
        size={22}
        color={isSelected ? accentColor : mutedColor}
        style={{ marginRight: 12 }}
      />
      <Text className="text-foreground text-base font-medium">
        {goal.title}
      </Text>
    </AnimatedPressable>
  );
}

// Animated Weekly Goal List Item
function AnimatedWeeklyGoalListItem({
  goal,
  isSelected,
  isLast,
  accentColor,
  borderColor,
}: {
  goal: WeeklyGoalOption;
  isSelected: boolean;
  isLast: boolean;
  accentColor: string;
  borderColor: string;
}) {
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
      borderColor: interpolateColor(
        animProgress.value,
        [0, 1],
        ['transparent', accentColor]
      ),
    };
  });

  return (
    <RadioGroup.Item value={goal.id} className="w-full">
      {() => (
        <AnimatedView style={[{ width: '100%' }, animatedBorderStyle]}>
          <View
            className={cn(
              "flex-row items-center justify-between px-4 py-2.5 w-full",
              !isSelected && !isLast && "border-b border-border"
            )}
          >
            <Text className="text-foreground text-base font-medium">
              {goal.days}
            </Text>
            <Text className={isSelected ? "text-accent font-medium" : "text-muted"}>
              {goal.label}
            </Text>
          </View>
        </AnimatedView>
      )}
    </RadioGroup.Item>
  );
}

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
          className="flex-1" 
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
                Was führt dich zu Setgraph?
              </Text>
              <Text className="text-muted text-center mb-8 leading-5">
                Deine Ziele weisen den Weg. Erwarte Funktionen und Updates, die zu deinen Ambitionen passen.
              </Text>

              <View className="gap-2">
                {goals.map((goal) => {
                  const isSelected = selectedGoals.includes(goal.id);
                  return (
                    <AnimatedGoalItem
                      key={goal.id}
                      goal={goal}
                      isSelected={isSelected}
                      onToggle={() => toggleGoal(goal.id)}
                      accentColor={accentColor}
                      mutedColor={mutedColor}
                      surfaceColor={surfaceColor}
                      surfaceSecondaryColor={surfaceSecondaryColor}
                    />
                  );
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
                  Aufzeichnungsplan{"\n"}festlegen
                </Text>
                <Text className="text-muted text-center leading-5">
                  Überlege, wie du deine Workouts verfolgen möchtest. Egal wie, Setgraph passt sich deinen Bedürfnissen an.
                </Text>
              </View>

              <RadioGroup
                value={recordingPlan ?? ""}
                onValueChange={(value) => setRecordingPlan(value as RecordingPlanType)}
                className="gap-2"
              >
                {recordingPlans.map((plan) => (
                  <RadioGroup.Item key={plan.id} value={plan.id}>
                    {({ isSelected }) => (
                      <AnimatedRecordingPlanItem
                        plan={plan}
                        isSelected={isSelected}
                        accentColor={accentColor}
                        mutedColor={mutedColor}
                        surfaceColor={surfaceColor}
                        surfaceSecondaryColor={surfaceSecondaryColor}
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
                  Wöchentliches Ziel{"\n"}festlegen
                </Text>
                <Text className="text-muted text-center text-sm leading-5">
                  Aktiv bleiben ist der einzige Weg, um Fortschritte zu machen. Wir erinnern dich, falls du dein Ziel verpasst.
                </Text>
              </View>

              <Text className="text-muted text-center text-sm mb-3">
                Wie viele Tage pro Woche wirst du aktiv sein?
              </Text>

              <Surface variant="secondary" className="rounded-xl overflow-hidden">
                <RadioGroup
                  value={weeklyGoal}
                  onValueChange={(value) => setWeeklyGoal(value as WeeklyGoalType)}
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
                        accentColor={accentColor}
                        borderColor={surfaceColor}
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
                  Ruhezeit festlegen
                </Text>
                <Text className="text-muted text-center leading-5 mb-2">
                  Mit einem Pausentimer informiert dich Setgraph, wenn du bereit bist, den nächsten Satz zu starten.
                </Text>
                <Text className="text-muted text-center text-sm">
                  Der Timer wird nach jedem Satz zurückgesetzt.
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
                        accentColor={accentColor}
                        mutedColor={mutedColor}
                        surfaceColor={surfaceColor}
                        surfaceSecondaryColor={surfaceSecondaryColor}
                      />
                    )}
                  </RadioGroup.Item>
                ))}
              </RadioGroup>

              <Text className="text-muted text-xs text-center leading-4 px-2">
                Für mehr Kontrolle kannst du in den Einstellungen eine eigene Pausenzeit wählen. Deine optimale Pause hängt von vielen Faktoren ab.{" "}
                <Text className="text-accent">Tippe hier</Text> um mehr zu erfahren.
              </Text>

              <Surface 
                variant="tertiary"
                className="flex-row items-start mt-6 p-3 rounded-xl"
              >
                <Ionicons name="notifications-outline" size={18} color={mutedColor} style={{ marginRight: 8, marginTop: 2 }} />
                <Text className="text-muted text-sm flex-1 leading-5">
                  Lass dich benachrichtigen, wenn dein nächstes Set fällig ist, indem du Benachrichtigungen aktivierst.
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
                  Benutzerdefinierter{"\n"}Trainingsplan
                </Text>
                <Text className="text-muted text-center leading-5">
                  Starte mit einem Krafttraining, das speziell für dich entwickelt wurde.
                </Text>
              </View>

              <View className="gap-5 mb-8">
                <Surface variant="tertiary" className="flex-row items-start p-4 rounded-xl">
                  <View 
                    className="w-10 h-10 rounded-lg items-center justify-center mr-4"
                    style={{ backgroundColor: "#3B82F620" }}
                  >
                    <Ionicons name="body" size={22} color="#60A5FA" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-base font-semibold mb-1">
                      Forme deinen Traumkörper
                    </Text>
                    <Text className="text-muted text-sm leading-5">
                      Wähle die Körperbereiche aus, die dir am wichtigsten sind, um Muskeln aufzubauen oder die Definition zu verbessern.
                    </Text>
                  </View>
                </Surface>

                <Surface variant="tertiary" className="flex-row items-start p-4 rounded-xl">
                  <View 
                    className="w-10 h-10 rounded-lg items-center justify-center mr-4"
                    style={{ backgroundColor: "#F59E0B20" }}
                  >
                    <Ionicons name="trophy" size={22} color="#F59E0B" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-base font-semibold mb-1">
                      Dominiere deinen Sport
                    </Text>
                    <Text className="text-muted text-sm leading-5">
                      Verbessere deine athletische Leistung mit einem Trainingsplan, der dir mehr Erfolge bringt.
                    </Text>
                  </View>
                </Surface>

                <Surface variant="tertiary" className="flex-row items-start p-4 rounded-xl">
                  <View 
                    className="w-10 h-10 rounded-lg items-center justify-center mr-4"
                    style={{ backgroundColor: "#22D3EE20" }}
                  >
                    <Ionicons name="color-wand" size={22} color="#22D3EE" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-base font-semibold mb-1">
                      Auf deine Vorlieben zugeschnitten
                    </Text>
                    <Text className="text-muted text-sm leading-5">
                      Erhalte einen personalisierten Plan, der sich an deinen Zeitplan, deine Ausstattung und deine Ziele anpasst.
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
          {step === 3 && (() => {
            const inactivityDays = parseInt(weeklyGoal) <= 2 ? 5 : parseInt(weeklyGoal) <= 4 ? 3 : 2;
            return (
              <AnimatedView 
                key={`notification-${inactivityDays}`}
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                className="flex-row items-center justify-center mb-3"
              >
                <Ionicons name="calendar-outline" size={16} color={mutedColor} style={{ marginRight: 6 }} />
                <Text className="text-muted text-sm">
                  Nach {inactivityDays} Tagen Inaktivität eine Erinnerung erhalten
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
          <View className="mt-4 h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${mutedColor}30` }}>
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

const styles = StyleSheet.create({
  measurer: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
});
