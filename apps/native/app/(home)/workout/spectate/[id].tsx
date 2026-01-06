import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { Avatar, Card, Chip, Divider, Spinner, useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "../../../../utils/convex";

import type { WorkoutSet } from "../../../../utils/useWorkoutSession";
import { FlatList } from "react-native-gesture-handler";

export default function SpectateWorkoutPage() {
  const backgroundColor = useThemeColor("background");
  const surfaceColor = useThemeColor("surface");
  const foregroundColor = useThemeColor("foreground");
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");
  const successColor = useThemeColor("success");
  const dangerColor = useThemeColor("danger");

  const { user: currentUser } = useUser();
  const { id } = useLocalSearchParams<{ id: string }>();

  const workout = useQuery(api.workouts.getById, id ? { workoutId: id as any } : "skip");
  const routine = useQuery(
    api.routines.getById,
    workout?.routineId ? { id: workout.routineId } : "skip"
  );

  // Get unique exercise IDs from workout sets
  const exerciseIds = useMemo(() => {
    if (!workout?.state?.sets) return [];
    const uniqueIds = new Set<string>();
    workout.state.sets.forEach((set: WorkoutSet) => {
      uniqueIds.add(set.exerciseId);
    });
    return Array.from(uniqueIds);
  }, [workout?.state?.sets]);

  // Get exercise details
  const exercises = useQuery(
    api.exercises.getByIds,
    exerciseIds.length > 0 ? { ids: exerciseIds } : "skip"
  );

  // Create a map of exerciseId -> exercise name
  const exerciseMap = useMemo(() => {
    const map = new Map<string, string>();
    if (exercises?.exercises) {
      exercises.exercises.forEach((ex: any) => {
        map.set(ex.externalId, ex.name);
      });
    }
    return map;
  }, [exercises]);

  // Group sets by exercise
  const setsByExercise = useMemo(() => {
    if (!workout?.state?.sets) return new Map<string, WorkoutSet[]>();
    const map = new Map<string, WorkoutSet[]>();
    workout.state.sets.forEach((set: WorkoutSet) => {
      const existing = map.get(set.exerciseId) || [];
      map.set(set.exerciseId, [...existing, set]);
    });
    return map;
  }, [workout?.state?.sets]);

  // Convert setsByExercise to array for FlashList
  const exerciseList = useMemo(() => {
    return Array.from(setsByExercise.entries()).map(([exerciseId, sets]) => ({
      exerciseId,
      sets,
      exerciseName: exerciseMap.get(exerciseId) || exerciseId,
    }));
  }, [setsByExercise, exerciseMap]);

  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (!workout || workout.status !== "active") {
      setElapsedTime(0);
      return;
    }

    setElapsedTime(Date.now() - workout.startedAt);

    const interval = setInterval(() => {
      if (workout && workout.status === "active") {
        setElapsedTime(Date.now() - workout.startedAt);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [workout]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (!id) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["bottom"]}>
        <Stack.Screen
          options={{
            title: "Spectating Workout",
            headerShown: true,
            headerStyle: { backgroundColor: surfaceColor },
            headerTintColor: foregroundColor,
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={{ color: mutedColor }}>Workout ID is required</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (workout === undefined) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["bottom"]}>
        <Stack.Screen
          options={{
            title: "Spectating Workout",
            headerShown: true,
            headerStyle: { backgroundColor: surfaceColor },
            headerTintColor: foregroundColor,
          }}
        />
        <View style={styles.loadingContainer}>
          <Spinner size="lg" color={accentColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (workout === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["bottom"]}>
        <Stack.Screen
          options={{
            title: "Spectating Workout",
            headerShown: true,
            headerStyle: { backgroundColor: surfaceColor },
            headerTintColor: foregroundColor,
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={64} color={mutedColor} />
          <Text style={[styles.errorTitle, { color: foregroundColor }]}>
            Workout not found
          </Text>
          <Text style={[styles.errorSubtitle, { color: mutedColor }]}>
            This workout may be private or no longer available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (workout.status !== "active") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={["bottom"]}>
        <Stack.Screen
          options={{
            title: "Spectating Workout",
            headerShown: true,
            headerStyle: { backgroundColor: surfaceColor },
            headerTintColor: foregroundColor,
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="checkmark-circle" size={64} color={successColor} />
          <Text style={[styles.errorTitle, { color: foregroundColor }]}>
            Workout completed
          </Text>
          <Text style={[styles.errorSubtitle, { color: mutedColor }]}>
            This workout is no longer active
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnWorkout = workout.userId === currentUser?.id;

  const displayName = isOwnWorkout
    ? currentUser?.fullName || currentUser?.firstName || "You"
    : workout.userId.slice(0, 8) + "...";

  const avatarUrl = isOwnWorkout ? currentUser?.imageUrl : undefined;

  const fallback = isOwnWorkout
    ? currentUser?.firstName?.[0] || "U"
    : workout.userId[0]?.toUpperCase() || "U";

  const routineName = routine?.name || "Quick Workout";

  const renderHeader = () => (
    <Card style={styles.headerCard}>
      <Card.Body>
        <View style={styles.header}>
          <Avatar size="md" alt={displayName}>
            {avatarUrl ? (
              <Avatar.Image source={{ uri: avatarUrl }} />
            ) : (
              <Avatar.Fallback>{fallback}</Avatar.Fallback>
            )}
          </Avatar>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: foregroundColor }]}>
              {displayName}
            </Text>
            <Text style={[styles.headerRoutine, { color: mutedColor }]}>
              {routineName}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Chip size="sm" color="danger" variant="primary">
              <Chip.Label>LIVE</Chip.Label>
            </Chip>
            <Text style={[styles.headerTime, { color: mutedColor }]}>
              {formatDuration(elapsedTime)}
            </Text>
          </View>
        </View>
      </Card.Body>
    </Card>
  );

  const renderEmpty = () => (
    <Card>
      <Card.Body>
        <View style={styles.emptyState}>
          <Ionicons name="fitness-outline" size={48} color={mutedColor} />
          <Text style={[styles.emptyText, { color: mutedColor }]}>
            No exercises started yet
          </Text>
        </View>
      </Card.Body>
    </Card>
  );

  const renderItem = ({ item }: { item: (typeof exerciseList)[0] }) => {
    const completedSets = item.sets.filter((s) => s.completed).length;
    const totalSets = item.sets.length;

    return (
      <Card style={styles.exerciseCard}>
        <Card.Body>
          <View style={styles.exerciseHeader}>
            <Text style={[styles.exerciseName, { color: foregroundColor }]}>
              {item.exerciseName}
            </Text>
            <Text style={[styles.exerciseMeta, { color: mutedColor }]}>
              {completedSets} of {totalSets} sets completed
            </Text>
          </View>

          <Divider className="my-3" />

          <View style={styles.setsContainer}>
            {item.sets.map((set, index) => (
              <View
                key={index}
                style={[
                  styles.setRow,
                  {
                    backgroundColor: set.completed ? accentColor + "20" : surfaceColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.setText,
                    { color: foregroundColor, fontWeight: set.completed ? "600" : "400" },
                  ]}
                >
                  Set {set.setNumber}
                </Text>
                <View style={styles.setInfo}>
                  <Text style={[styles.setInfoText, { color: mutedColor }]}>
                    {set.completedReps} / {set.targetReps} reps
                  </Text>
                  {set.weight > 0 && (
                    <Text style={[styles.setInfoText, { color: mutedColor }]}>
                      {set.weight} kg
                    </Text>
                  )}
                </View>
                {set.completed && (
                  <Ionicons name="checkmark-circle" size={20} color={successColor} />
                )}
              </View>
            ))}
          </View>
        </Card.Body>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: "Spectating Workout",
          headerShown: true,
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: foregroundColor,
        }}
      />

      <FlatList
        data={exerciseList}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        //estimatedItemSize={200}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  listContent: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerRoutine: {
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTime: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  exerciseCard: {
    marginBottom: 12,
  },
  exerciseHeader: {
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
  },
  exerciseMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  setsContainer: {
    gap: 8,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 8,
  },
  setText: {
    fontSize: 14,
  },
  setInfo: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  setInfoText: {
    fontSize: 14,
  },
});
