import { useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Spinner, Surface, useThemeColor } from "heroui-native";
import { Text } from "react-native";
import { useDebounce } from "use-debounce";

import type { ExerciseFiltersType, ExerciseType } from "@ex/backend/convex/schema";

import { applyLocalFilters, searchLocalExercises } from "@/utils/exerciseSearch";
import { useExerciseDatabase } from "@/utils/useExerciseDatabase";
import { FlatList } from "react-native-gesture-handler";

export default function ExercisesPage() {
  const backgroundColor = useThemeColor("background");
  const foregroundColor = useThemeColor("foreground");
  const primaryColor = useThemeColor("accent");
  const mutedForeground = useThemeColor("muted");
  const surfaceColor = useThemeColor("muted");

  const { exercises, isInitialized, isSyncing } = useExerciseDatabase();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [filters, setFilters] = useState<ExerciseFiltersType>({});

  // Apply filters and search
  const filteredExercises = useMemo(() => {
    let result = exercises;

    // Apply filters first
    result = applyLocalFilters(result, filters);

    // Then apply search
    if (debouncedSearch) {
      result = searchLocalExercises(result, debouncedSearch, 100);
    }

    return result;
  }, [exercises, debouncedSearch, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.primaryMuscles?.length) count++;
    if (filters.level) count++;
    if (filters.category) count++;
    if (filters.equipment) count++;
    return count;
  }, [filters]);

  if (!isInitialized || isSyncing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor,
        }}
      >
        <Spinner size="lg" />
        <Text style={{ color: mutedForeground, marginTop: 12 }}>
          Loading exercises...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      {/* Header */}
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={foregroundColor} />
          </Pressable>
          <Text
            style={{
              color: foregroundColor,
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            All Exercises
          </Text>
          <Text style={{ color: mutedForeground, fontSize: 14 }}>
            {filteredExercises.length} total
          </Text>
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: surfaceColor,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          <Ionicons name="search" size={18} color={mutedForeground} />
          <TextInput
            style={{
              flex: 1,
              color: foregroundColor,
              fontSize: 16,
            }}
            placeholder="Search exercises..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={mutedForeground}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.externalId}
        //estimatedItemSize={800}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push(`/(home)/exercise/${item.externalId}` as any)
            }
          >
            <Surface
              style={{
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: foregroundColor,
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                {item.name}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 8,
                }}
              >
                <View
                  style={{
                    backgroundColor: primaryColor + "20",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: primaryColor, fontSize: 12 }}>
                    {item.primaryMuscles[0]}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: surfaceColor,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: mutedForeground, fontSize: 12 }}>
                    {item.level}
                  </Text>
                </View>
                {item.equipment && (
                  <View
                    style={{
                      backgroundColor: surfaceColor,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: mutedForeground, fontSize: 12 }}>
                      {item.equipment}
                    </Text>
                  </View>
                )}
              </View>
            </Surface>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 48 }}>
            <Ionicons name="search" size={48} color={mutedForeground} />
            <Text
              style={{
                color: mutedForeground,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              No exercises found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
