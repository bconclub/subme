import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export function EmptyState({
  icon,
  title,
  body,
  ctaLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  ctaLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-16 h-16 rounded-2xl bg-card items-center justify-center mb-4">
        <Ionicons name={icon} size={28} color={colors.muted} />
      </View>
      <Text className="text-ink text-lg font-semibold text-center">{title}</Text>
      <Text className="text-muted text-sm text-center mt-2 leading-5">{body}</Text>
      {ctaLabel && onPress ? (
        <TouchableOpacity
          onPress={onPress}
          className="mt-5 bg-accent rounded-full px-6 py-3"
        >
          <Text className="text-bg font-bold">{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
