import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import { Surface, useThemeColor } from "heroui-native";
import { Text, TextInput } from "react-native";

import { api } from "@ex/backend/convex/_generated/api";

export default function OnboardingPage() {
  const { user } = useUser();
  const backgroundColor = useThemeColor("background");
  const foregroundColor = useThemeColor("foreground");
  const primaryColor = useThemeColor("accent");
  const mutedForeground = useThemeColor("muted");

  const createOnboarding = useMutation(api.userProfiles.createOnboarding);

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    level: null as "beginner" | "intermediate" | "expert" | null,
    units: "metric" as "metric" | "imperial",
    preferredWorkoutTime: null as
      | "morning"
      | "afternoon"
      | "evening"
      | "anytime"
      | null,
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await createOnboarding({
        bio: formData.bio.trim() || undefined,
        level: formData.level,
        units: formData.units,
        preferredWorkoutTime: formData.preferredWorkoutTime,
      });
      router.replace("/" as any);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to complete onboarding");
      setIsSaving(false);
    }
  };

  const SelectButton = ({
    title,
    selected,
    onPress,
  }: {
    title: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: selected ? primaryColor : "transparent",
        borderWidth: 1,
        borderColor: selected ? primaryColor : mutedForeground,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          color: selected ? "#fff" : foregroundColor,
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <Stack.Screen
        options={{
          title: "Welcome!",
          headerShown: false,
        }}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: foregroundColor,
              fontSize: 28,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Welcome, {user?.firstName || "there"}!
          </Text>
          <Text style={{ color: mutedForeground, fontSize: 16 }}>
            Let's setup your profile to get started
          </Text>
        </View>

        {/* Progress indicator */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: s <= step ? primaryColor : mutedForeground,
              }}
            />
          ))}
        </View>

        <Surface style={{ borderRadius: 16, padding: 24 }}>
          {step === 1 && (
            <View>
              <Text
                style={{
                  color: foregroundColor,
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                Fitness Level
              </Text>
              <Text
                style={{
                  color: mutedForeground,
                  marginBottom: 20,
                }}
              >
                Select your current fitness level
              </Text>
              <SelectButton
                title="Beginner"
                selected={formData.level === "beginner"}
                onPress={() => setFormData({ ...formData, level: "beginner" })}
              />
              <SelectButton
                title="Intermediate"
                selected={formData.level === "intermediate"}
                onPress={() =>
                  setFormData({ ...formData, level: "intermediate" })
                }
              />
              <SelectButton
                title="Expert"
                selected={formData.level === "expert"}
                onPress={() => setFormData({ ...formData, level: "expert" })}
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text
                style={{
                  color: foregroundColor,
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                Preferences
              </Text>
              <Text
                style={{
                  color: mutedForeground,
                  marginBottom: 20,
                }}
              >
                Choose your measurement units
              </Text>
              <SelectButton
                title="Metric (kg)"
                selected={formData.units === "metric"}
                onPress={() => setFormData({ ...formData, units: "metric" })}
              />
              <SelectButton
                title="Imperial (lbs)"
                selected={formData.units === "imperial"}
                onPress={() => setFormData({ ...formData, units: "imperial" })}
              />

              <Text
                style={{
                  color: foregroundColor,
                  fontSize: 16,
                  fontWeight: "600",
                  marginTop: 20,
                  marginBottom: 12,
                }}
              >
                Preferred Workout Time
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {(["morning", "afternoon", "evening", "anytime"] as const).map(
                  (time) => (
                    <Pressable
                      key={time}
                      onPress={() =>
                        setFormData({ ...formData, preferredWorkoutTime: time })
                      }
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 20,
                        backgroundColor:
                          formData.preferredWorkoutTime === time
                            ? primaryColor
                            : "transparent",
                        borderWidth: 1,
                        borderColor:
                          formData.preferredWorkoutTime === time
                            ? primaryColor
                            : mutedForeground,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            formData.preferredWorkoutTime === time
                              ? "#fff"
                              : foregroundColor,
                          textTransform: "capitalize",
                        }}
                      >
                        {time}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text
                style={{
                  color: foregroundColor,
                  fontSize: 20,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                About You
              </Text>
              <Text
                style={{
                  color: mutedForeground,
                  marginBottom: 20,
                }}
              >
                Tell us a bit about yourself (optional)
              </Text>
              <TextInput
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Share your fitness goals..."
                placeholderTextColor={mutedForeground}
                multiline
                numberOfLines={4}
                style={{
                  color: foregroundColor,
                  borderWidth: 1,
                  borderColor: mutedForeground,
                  borderRadius: 12,
                  padding: 16,
                  minHeight: 120,
                  textAlignVertical: "top",
                }}
              />
            </View>
          )}
        </Surface>

        {/* Navigation Buttons */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginTop: 24,
            paddingBottom: 40,
          }}
        >
          {step > 1 && (
            <Pressable
              onPress={handleBack}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: mutedForeground,
              }}
            >
              <Text
                style={{
                  color: foregroundColor,
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Back
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleNext}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              backgroundColor: primaryColor,
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                color: "#fff",
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              {isSaving ? "Saving..." : step === 3 ? "Complete" : "Next"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
