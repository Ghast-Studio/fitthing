import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemeColor } from "heroui-native";

import { AppleSignIn, Container, GoogleSignIn } from "@/components";
import { SignOutButton } from "@/components/sign-out-button";
import { router } from "expo-router";

const features = [
  {
    icon: "trending-up" as const,
    title: "Gezielter Fortschritt",
    description:
      "Setze Ziele basierend auf deinen bisherigen Leistungen. Steigere Kraft und Muskelaufbau, indem du Gewicht, Häufigkeit oder Wiederholungen kontinuierlich erhöhst.",
  },
  {
    icon: "flash" as const,
    title: "Schnelles Erfassen",
    description:
      "Protokolliere in Lichtgeschwindigkeit und bleib voll auf dein Training fokussiert.",
  },
  {
    icon: "file-tray" as const,
    title: "Einfache Organisation",
    description: "Verwalte Muskelgruppen und Trainingsprogramme mit Notizen.",
  },
];

export default function WelcomeScreen() {
  const accentColor = useThemeColor("accent");

  return (
    <Container className="flex-1 bg-background pt-5" disableSafeArea>
      <View className="flex-1 px-5 justify-between py-10">
        <View>
          {/* Title Section */}
          <View className="items-center mb-12">
            <Text className="text-foreground text-3xl font-bold text-center">
              Willkommen bei
            </Text>
            <Text className="text-accent text-3xl font-bold text-center">
              Setgraph
            </Text>
          </View>

          {/* Features Section */}
          <View className="mb-12">
            {features.map((feature, index) => (
              <View
                key={feature.icon}
                className={`flex-row items-start ${index < features.length - 1 ? "mb-8" : ""}`}
              >
                <View className="mr-4 mt-0.5">
                  <Ionicons name={feature.icon} size={24} color={accentColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-base font-semibold mb-1">
                    {feature.title}
                  </Text>
                  <Text className="text-muted text-sm leading-5">
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* OAuth Buttons and Terms - Bottom Section */}
        <View>
          {/* OAuth Buttons */}
          <View className="gap-3 mb-6">
            <AppleSignIn />
            <GoogleSignIn />
          </View>

          {/* Terms */}
          <Text className="text-muted text-xs text-center leading-4.5">
            Durch die Nutzung von Setgraph stimmst du unseren{"\n"}
            Nutzungsbedingungen zu und bestätigst, dass du unsere{" "}
            <Text className="text-accent">Privacy Policy</Text> gelesen hast.
          </Text>
        </View>
      </View>
    </Container>
  );
}
