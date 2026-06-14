import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import type { CatalogService } from '@/lib/types';
import { CYCLE_LABELS } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { ServiceLogo } from './ServiceLogo';

/** Bottom-sheet plan picker shown after tapping a catalog service. */
export function PlanPicker({
  service,
  onPick,
  onClose,
}: {
  service: CatalogService | null;
  onPick: (planIndex: number) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={service !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <View className="bg-surface rounded-t-3xl px-5 pt-5 pb-10 border-t border-border">
        {service ? (
          <>
            <View className="flex-row items-center mb-4">
              <ServiceLogo name={service.name} color={service.logo_color} size={40} />
              <View className="ml-3">
                <Text className="text-ink text-lg font-bold">{service.name}</Text>
                <Text className="text-muted text-xs">Pick your plan</Text>
              </View>
            </View>
            {service.plans.map((plan, i) => (
              <TouchableOpacity
                key={`${plan.name}-${i}`}
                onPress={() => onPick(i)}
                className="flex-row items-center justify-between bg-card border border-border rounded-xl px-4 py-3.5 mb-2"
              >
                <Text className="text-ink font-medium">{plan.name}</Text>
                <Text className="text-muted">
                  {formatINR(plan.price_inr)} · {CYCLE_LABELS[plan.billing_cycle]}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : null}
      </View>
    </Modal>
  );
}
