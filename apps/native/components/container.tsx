import { cn } from "heroui-native";
import { type PropsWithChildren } from "react";
import { ScrollView, View, type ViewProps } from "react-native";
import Animated, { type AnimatedProps } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = AnimatedProps<ViewProps> & {
  className?: string;
  disableSafeArea?: boolean;
  disableScrollView?: boolean;
};

export function Container({
  children,
  className,
  disableSafeArea = false,
  disableScrollView = false,
  ...props
}: PropsWithChildren<Props>) {
  const insets = useSafeAreaInsets();

  return (
    <AnimatedView
      className={cn("flex-1 bg-background", className)}
      style={{
        paddingBottom: disableSafeArea ? 0 : insets.bottom,
      }}
      {...props}
    >
      {!disableScrollView && (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View
            className="flex-1"
            style={{ paddingTop: disableSafeArea ? 0 : insets.top }}
          >
            {children}
          </View>
        </ScrollView>
      )}
      {disableScrollView && (
        <View
          className="flex-1"
          style={{ paddingTop: disableSafeArea ? 0 : insets.top }}
        >
          {children}
        </View>
      )}
    </AnimatedView>
  );
}
