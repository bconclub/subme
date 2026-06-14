import { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

interface TabRoute {
  key: string;
  name: string;
}
interface CapsuleTabBarProps {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => {
      defaultPrevented?: boolean;
    };
    navigate: (name: string) => void;
  };
}

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

const TAB_WIDTH = 54;
const TAB_HEIGHT = 46;
const ITEM_GAP = 10;
const BAR_PADDING = 10;
const SPRING = { damping: 16, stiffness: 160, mass: 0.6 };

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: ITEM_GAP,
          padding: BAR_PADDING,
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
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (state.index !== i && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TabItem key={route.key} active={state.index === i} meta={meta} onPress={onPress} />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  active,
  meta,
  onPress,
}: {
  active: boolean;
  meta: { label: string; on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap };
  onPress: () => void;
}) {
  const p = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(active ? 1 : 0, SPRING);
  }, [active, p]);

  const pill = useAnimatedStyle(() => ({
    transform: [{ scale: 0.94 + 0.06 * p.value }],
    backgroundColor: interpolateColor(p.value, [0, 1], ['rgba(198,242,78,0)', 'rgba(198,242,78,1)']),
  }));
  const onIcon = useAnimatedStyle(() => ({ opacity: p.value }));
  const offIcon = useAnimatedStyle(() => ({ opacity: 1 - p.value }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={meta.label}
      style={{
        width: TAB_WIDTH,
        height: TAB_HEIGHT,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            width: TAB_WIDTH,
            height: TAB_HEIGHT,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
          pill,
        ]}
      >
        <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ position: 'absolute' }, offIcon]}>
            <Ionicons name={meta.off} size={22} color={colors.faint} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute' }, onIcon]}>
            <Ionicons name={meta.on} size={22} color={colors.inkOnAccent} />
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
