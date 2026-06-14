import { Platform, Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

const SPRING = LinearTransition.springify().damping(20).stiffness(180).mass(0.7);

interface TabRoute {
  key: string;
  name: string;
}
interface CapsuleTabBarProps {
  state: { index: number; routes: TabRoute[] };
  // Loosely typed: React Navigation's emit/navigate have richer generic
  // signatures than we need here.
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => {
      defaultPrevented?: boolean;
    };
    navigate: (name: string) => void;
  };
}

/**
 * Floating capsule tab bar (Subme design system). A centered dark-glass pill
 * hovering above content; the active tab expands into a lime pill (icon + label)
 * with a soft glow, inactive tabs are faint icons only.
 */

const META: Record<
  string,
  { label: string; on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }
> = {
  inbox: { label: 'Synced', on: 'sparkles', off: 'sparkles-outline' },
  dashboard: { label: 'Dashboard', on: 'grid', off: 'grid-outline' },
  subscriptions: { label: 'Subs', on: 'albums', off: 'albums-outline' },
  calendar: { label: 'Calendar', on: 'calendar', off: 'calendar-outline' },
  settings: { label: 'Settings', on: 'settings', off: 'settings-outline' },
};

export function CapsuleTabBar({ state, navigation }: CapsuleTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      <Animated.View
        layout={SPRING}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          padding: 6,
          borderRadius: 999,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.glassBorder,
          backgroundColor: Platform.OS === 'web' ? 'rgba(16,16,21,0.9)' : 'rgba(16,16,21,0.6)',
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 16 },
          elevation: 12,
        }}
      >
        <BlurView
          intensity={40}
          tint="dark"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {state.routes.map((route, i) => {
          const meta = META[route.name];
          if (!meta) return null;
          const focused = state.index === i;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Animated.View
              key={route.key}
              layout={SPRING}
              style={{
                height: 44,
                borderRadius: 999,
                backgroundColor: focused ? colors.accent : 'transparent',
                ...(focused
                  ? {
                      shadowColor: colors.accent,
                      shadowOpacity: 0.5,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 0 },
                    }
                  : null),
              }}
            >
              <Pressable
                onPress={onPress}
                android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: true }}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: focused ? 8 : 0,
                  paddingHorizontal: focused ? 16 : 13,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Ionicons
                  name={focused ? meta.on : meta.off}
                  size={22}
                  color={focused ? colors.inkOnAccent : colors.faint}
                />
                {focused ? (
                  <Animated.Text
                    entering={FadeIn.duration(160)}
                    exiting={FadeOut.duration(90)}
                    style={{
                      color: colors.inkOnAccent,
                      fontFamily: 'PlusJakartaSans_700Bold',
                      fontSize: 13,
                    }}
                  >
                    {meta.label}
                  </Animated.Text>
                ) : null}
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );
}
