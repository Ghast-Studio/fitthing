## Plan: Exercise-Projekt Features in Hauptprojekt übertragen

Übertragung aller Features aus dem `vendor/exercise`-Projekt in das Hauptprojekt `d:\src\ex`, außer Theme-System und UI-Komponentenbibliothek – diese werden durch HeroUI ersetzt.

### Steps

1. **Dependencies hinzufügen** in [package.json](d:\src\ex\apps\native\package.json): `zustand`, `neverthrow`, `@react-native-async-storage/async-storage`, `@shopify/flash-list`, `@tanstack/react-query`, `use-debounce`, `expo-web-browser`

2. **Convex-Schema übertragen** von [schema.ts](d:\src\ex\vendor\exercise\packages\backend\convex\schema.ts) nach [packages/backend/convex/schema.ts](d:\src\ex\packages\backend\convex\schema.ts) – Tabellen: `exercises`, `routines`, `workouts`, `userProfiles`, `friends`

3. **Convex-Funktionen kopieren** aus [vendor/exercise/packages/backend/convex/](d:\src\ex\vendor\exercise\packages\backend\convex): `exercises.ts`, `routines.ts`, `workouts.ts`, `userProfiles.ts`, `friends.ts` nach [packages/backend/convex/](d:\src\ex\packages\backend\convex)

4. **State-Management erstellen** – Neuen Ordner `apps/native/store/` mit `routineStore.ts` und `exerciseCacheStore.ts` basierend auf [store.ts](d:\src\ex\vendor\exercise\apps\native\store\store.ts), **ohne** `useThemeStore`

5. **Utility-Funktionen übertragen** – Neuen Ordner `apps/native/utils/` mit: `convex.ts`, `exerciseCache.ts`, `exerciseSearch.ts`, `result.ts`, `useExerciseDatabase.ts`, `useWorkoutSession.ts`, `workoutUtils.ts` aus [vendor/exercise/apps/native/utils/](d:\src\ex\vendor\exercise\apps\native\utils)

6. **Routing-Struktur anpassen** – `(home)/_layout.tsx` mit Auth-Guard erstellen, Feature-Routen hinzufügen: `exercises.tsx`, `onboarding.tsx`, `exercise/[id].tsx`, `routine/`, `workout/`, `friend/`, `profile/` nach Vorlage in [vendor/exercise/apps/native/app/(home)/](d:\src\ex\vendor\exercise\apps\native\app\(home))

7. **Business-Komponenten portieren** – `ExerciseCard.tsx`, `ExerciseFilters.tsx`, `VisibilitySelector.tsx`, Auth-Komponenten (`AppleSignIn`, `GoogleSignIn`) nach `apps/native/components/`, **UI-Imports auf HeroUI-Native umstellen**

8. **Environment-Variablen ergänzen** in [packages/env/src/native.ts](d:\src\ex\packages\env\src\native.ts): `EXPO_PUBLIC_CLERK_JWT_ISSUER_DOMAIN`, `EXPO_PUBLIC_CONVEX_URL` (bereits vorhanden prüfen)

### Further Considerations

1. **Navigation-Struktur**: Aktuelle Drawer-Navigation beibehalten oder auf Stack-Navigation umstellen wie im Exercise-Projekt? Empfehlung: Stack für Feature-Flows, Drawer für Hauptnavigation kombinieren
2. **Backend Package-Imports**: Exercise verwendet `@packages/backend`, Hauptprojekt `@repo/backend` – Alle Imports entsprechend anpassen
3. **AsyncStorage vs. SecureStore**: Aktuell wird `expo-secure-store` für Token-Cache verwendet – `AsyncStorage` zusätzlich für Übungscache hinzufügen oder vereinheitlichen?
