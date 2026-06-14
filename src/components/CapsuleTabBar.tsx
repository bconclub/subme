import { useEffect } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
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

const SPRING = { damping: 18, stiffness: 170, mass: 0.7 };

export function CapsuleTabBar({ state, navigation }: CapsuleTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Fixed bar — the container never changes width. Active tab grows, the others
  // shrink to compensate, so the sum stays constant.
  const barW = Math.min(380, width - 24);
  const rowW = barW - 12; // minus padding
  const n = state.routes.length;
  const activeW = Math.min(150, rowW * 0.42);
  const restW = (rowW - activeW) / (n - 1);

  // One animated cursor that springs to the active index; every tab derives its
  // width / fill / label / icon from its distance to the cursor → fluid.
  const sel = useSharedValue(state.index);
  useEffect(() => {
    sel.value = withSpring(state.index, SPRING);
  }, [state.index, sel]);

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
          width: barW,
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
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (state.index !== i && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TabItem
              key={route.key}
              index={i}
              sel={sel}
              meta={meta}
              activeW={activeW}
              restW={restW}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  index,
  sel,
  meta,
  activeW,
  restW,
  onPress,
}: {
  index: number;
  sel: SharedValue<number>;
  meta: { label: string; on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap };
  activeW: number;
  restW: number;
  onPress: () => void;
}) {
  const container = useAnimatedStyle(() => {
    const a = Math.max(0, 1 - Math.abs(sel.value - index));
    return {
      width: restW + (activeW - restW) * a,
      backgroundColor: interpolateColor(a, [0, 1], ['rgba(198,242,78,0)', 'rgba(198,242,78,1)']),
    };
  });
  const labelStyle = useAnimatedStyle(() => {
    const a = Math.max(0, 1 - Math.abs(sel.value - index));
    return { opacity: interpolate(a, [0.45, 1], [0, 1], 'clamp') };
  });
  const onIcon = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.abs(sel.value - index)),
  }));
  const offIcon = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, 1 - Math.abs(sel.value - index)),
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          {
            height: 44,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
          container,
        ]}
      >
        <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ position: 'absolute' }, offIcon]}>
            <Ionicons name={meta.off} size={22} color={colors.faint} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute' }, onIcon]}>
            <Ionicons name={meta.on} size={22} color={colors.inkOnAccent} />
          </Animated.View>
        </View>
        <Animated.Text
          numberOfLines={1}
          style={[
            {
              marginLeft: 8,
              color: colors.inkOnAccent,
              fontFamily: 'PlusJakartaSans_700Bold',
              fontSize: 13,
            },
            labelStyle,
          ]}
        >
          {meta.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}
