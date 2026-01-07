import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../../utils/convex";
import { VisibilitySelector } from "../../../components/VisibilitySelector";
import { useWorkoutSession, WorkoutSet } from "../../../utils/useWorkoutSession";
import { isValidConvexId } from "../../../utils/workoutUtils";

export default function StartWorkoutPage() {
  const backgroundColor = useThemeColor("background");
  const surfaceColor = useThemeColor("surface");
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");
  const warningColor = useThemeColor("warning");

  const { id } = useLocalSearchParams<{ id: string }>();
  const isQuickWorkout = !isValidConvexId(id);
  const [visibility, setVisibility] = useState<"private" | "friends" | "public">("private");

  const routine = useQuery(
    api.routines.getById,
    isQuickWorkout ? "skip" : { id: id as any }
  );
  const isLoading = routine === undefined && !isQuickWorkout;

  const { hasActiveWorkout, startWorkout, isStarting } = useWorkoutSession();

  // For routine workouts, use the routine's visibility
  useEffect(() => {
    if (routine && !isQuickWorkout) {
      setVisibility(routine.visibility as any);
    }
  }, [routine, isQuickWorkout]);

  // Redirect to active workout if there's already an active workout
  useEffect(() => {
    if (hasActiveWorkout) {
      router.replace("/workout/active" as any);
    }
  }, [hasActiveWorkout]);

  const handleStartWorkout = async () => {
    // For routine workouts, we need the routine
    if (!isQuickWorkout && !routine) return;

    const initialSets: WorkoutSet[] = [];

    if (routine) {
      routine.exercises.forEach((exercise: any) => {
        for (let i = 0; i < exercise.sets; i++) {
          initialSets.push({
            exerciseId: exercise.exerciseId,
            setNumber: i + 1,
            targetReps: exercise.reps,
            completedReps: 0,
            weight: 0,
            completed: false,
          });
        }
      });
    }

    const routineId = isQuickWorkout ? undefined : id;
    const workoutVisibility = isQuickWorkout ? visibility : undefined;
    const result = await startWorkout(routineId, initialSets, workoutVisibility);

    result.match(
      () => {
        router.replace("/workout/active");
      },
      () => {
        Alert.alert("Error", "Failed to start workout. Please try again.");
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: "Workout", headerShown: true }} />
        <View style={styles.loadingContainer}>
          <Spinner size="lg" color={accentColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isQuickWorkout && !routine) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: "Workout", headerShown: true }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={mutedColor} />
          <Text style={[styles.errorText, { color: mutedColor }]}>
            Routine not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Quick workout start screen
  if (isQuickWorkout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen
          options={{
            title: "Quick Workout",
            headerShown: true,
            headerStyle: { backgroundColor: surfaceColor },
            headerTintColor: foregroundColor,
          }}
        />
        <View style={styles.preWorkoutContainer}>
          <Ionicons name="flash" size={80} color={warningColor} />
          <Text style={[styles.routineTitle, { color: foregroundColor }]}>
            Quick Workout
          </Text>
          <Text style={[styles.routineDescription, { color: mutedColor }]}>
            Start an empty workout and add exercises as you go
          </Text>

          <View style={styles.visibilityContainer}>
            <VisibilitySelector value={visibility} onChange={setVisibility} />
          </View>

          <Button
            variant="primary"
            size="lg"
            onPress={handleStartWorkout}
            isDisabled={isStarting}
          >
            {isStarting ? (
              <Spinner size="sm" color="white" />
            ) : (
              <>
                <Ionicons name="play-circle" size={24} color="#fff" />
                <Button.Label>Start Quick Workout</Button.Label>
              </>
            )}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Routine workout start screen
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: routine?.name ?? "Workout",
          headerShown: true,
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: foregroundColor,
        }}
      />
      <View style={styles.preWorkoutContainer}>
        <Ionicons name="fitness" size={80} color={accentColor} />
        <Text style={[styles.routineTitle, { color: foregroundColor }]}>
          {routine?.name}
        </Text>
        {routine?.description && (
          <Text style={[styles.routineDescription, { color: mutedColor }]}>
            {routine.description}
          </Text>
        )}

        <View style={styles.workoutInfo}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: mutedColor }]}>Exercises</Text>
            <Text style={[styles.infoValue, { color: accentColor }]}>
              {routine?.exercises.length ?? 0}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: mutedColor }]}>Total Sets</Text>
            <Text style={[styles.infoValue, { color: accentColor }]}>
              {routine?.exercises.reduce((sum: number, ex: any) => sum + ex.sets, 0) ?? 0}
            </Text>
          </View>
        </View>

        <Button
          variant="primary"
          size="lg"
          onPress={handleStartWorkout}
          isDisabled={isStarting}
        >
          {isStarting ? (
            <Spinner size="sm" color="white" />
          ) : (
            <>
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Button.Label>Start Workout</Button.Label>
            </>
          )}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  preWorkoutContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  routineTitle: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  routineDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
  },
  visibilityContainer: {
    marginBottom: 24,
    width: "100%",
  },
  workoutInfo: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 40,
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 48,
    fontWeight: "700",
  },
});
