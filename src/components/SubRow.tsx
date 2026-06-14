import { Text, TouchableOpacity, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Subscription } from '@/lib/types';
import { CYCLE_LABELS } from '@/lib/types';
import { daysUntil } from '@/lib/dates';
import { formatINR } from '@/lib/format';
import { getCatalogService } from '@/lib/catalog';
import { colors } from '@/theme/colors';
import { DaysChip } from './DaysChip';
import { ServiceLogo } from './ServiceLogo';

function Action({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ backgroundColor: color }}
      className="w-[72px] items-center justify-center"
    >
      <Ionicons name={icon} size={20} color="#fff" />
      <Text className="text-white text-[11px] font-semibold mt-1">{label}</Text>
    </TouchableOpacity>
  );
}

export function SubRow({
  sub,
  onPause,
  onResume,
  onCancel,
  onDelete,
}: {
  sub: Subscription;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const logoColor =
    (sub.catalog_service_id && getCatalogService(sub.catalog_service_id)?.logo_color) ||
    colors.accentDim;

  const renderRightActions = () => (
    <View className="flex-row h-full">
      {sub.status === 'active' ? (
        <Action label="Pause" icon="pause" color="#B45309" onPress={() => onPause(sub.id)} />
      ) : (
        <Action label="Resume" icon="play" color="#047857" onPress={() => onResume(sub.id)} />
      )}
      {sub.status !== 'cancelled' ? (
        <Action label="Cancel" icon="close-circle" color="#9F1239" onPress={() => onCancel(sub.id)} />
      ) : null}
      <Action label="Delete" icon="trash" color="#7F1D1D" onPress={() => onDelete(sub.id)} />
    </View>
  );

  return (
    <ReanimatedSwipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/subscription/${sub.id}`)}
        style={{ backgroundColor: 'rgba(14,20,28,0.55)' }}
        className="flex-row items-center px-4 py-3"
      >
        <ServiceLogo name={sub.service_name} catalogId={sub.catalog_service_id} color={logoColor} />
        <View className="flex-1 ml-3">
          <Text className="text-ink font-semibold" numberOfLines={1}>
            {sub.service_name}
          </Text>
          <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
            {sub.plan_name ? `${sub.plan_name} · ` : ''}
            {CYCLE_LABELS[sub.billing_cycle]}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-ink font-bold">{formatINR(sub.price_inr)}</Text>
          {sub.status === 'active' ? (
            <View className="mt-1">
              <DaysChip days={daysUntil(sub.next_renewal_date)} />
            </View>
          ) : (
            <Text className="text-faint text-xs mt-1 capitalize">{sub.status}</Text>
          )}
        </View>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
}
