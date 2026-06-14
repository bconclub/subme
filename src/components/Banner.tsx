import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { gradients } from '@/theme/colors';

/**
 * Gradient promo banner (e.g. upgrade nudge). Bright gradient skin so it
 * stands apart from the frosted neutral glass around it.
 */
export function Banner({
  icon = 'sparkles',
  title,
  body,
  ctaLabel,
  onPress,
  onDismiss,
  colorsPair = gradients.upgrade,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  ctaLabel?: string;
  onPress?: () => void;
  onDismiss?: () => void;
  colorsPair?: readonly [string, string];
}) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress}>
      <LinearGradient
        colors={colorsPair}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 22, padding: 16 }}
      >
        <View className="flex-row items-center">
          <View
            style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
            className="w-10 h-10 rounded-2xl items-center justify-center"
          >
            <Ionicons name={icon} size={20} color="#fff" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-white font-bold text-[15px]">{title}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }} className="text-xs mt-0.5 leading-4">
              {body}
            </Text>
          </View>
          {onDismiss ? (
            <TouchableOpacity onPress={onDismiss} hitSlop={8} className="ml-2">
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          ) : null}
        </View>
        {ctaLabel ? (
          <View
            style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
            className="self-start rounded-full px-4 py-1.5 mt-3"
          >
            <Text className="text-[#1A1330] font-bold text-xs">{ctaLabel}</Text>
          </View>
        ) : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}
