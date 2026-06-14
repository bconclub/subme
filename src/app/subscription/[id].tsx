import { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { ServiceLogo } from '@/components/ServiceLogo';
import { DaysChip } from '@/components/DaysChip';
import { lifetimeSpend } from '@/lib/analytics';
import { daysUntil, formatFullDate } from '@/lib/dates';
import { formatINR } from '@/lib/format';
import { getCatalogService } from '@/lib/catalog';
import { CATEGORY_LABELS, CYCLE_LABELS } from '@/lib/types';
import { useSubsStore } from '@/stores/subscriptions';
import { colors } from '@/theme/colors';

export default function SubscriptionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const sub = useSubsStore((s) => s.subs.find((x) => x.id === id));
  const priceHistory = useSubsStore((s) => s.priceHistory);
  const renewalLog = useSubsStore((s) => s.renewalLog);
  const update = useSubsStore((s) => s.update);
  const pause = useSubsStore((s) => s.pause);
  const resume = useSubsStore((s) => s.resume);
  const cancel = useSubsStore((s) => s.cancel);
  const remove = useSubsStore((s) => s.remove);

  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const history = useMemo(
    () =>
      priceHistory
        .filter((p) => p.subscription_id === id)
        .sort((a, b) => b.effective_from.localeCompare(a.effective_from)),
    [priceHistory, id],
  );
  const renewals = useMemo(
    () =>
      renewalLog
        .filter((r) => r.subscription_id === id)
        .sort((a, b) => b.renewed_on.localeCompare(a.renewed_on)),
    [renewalLog, id],
  );
  const lifetime = useMemo(
    () => (sub ? lifetimeSpend(sub, renewalLog) : 0),
    [sub, renewalLog],
  );

  if (!sub) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">This subscription no longer exists.</Text>
          <TouchableOpacity onPress={() => router.back()} className="mt-4">
            <Text className="text-accent">Go back</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const logoColor =
    (sub.catalog_service_id && getCatalogService(sub.catalog_service_id)?.logo_color) ||
    colors.accentDim;

  const startEdit = () => {
    setPrice(String(sub.price_inr));
    setNotes(sub.notes);
    setEditing(true);
  };

  const saveEdit = () => {
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      Alert.alert('Bad price', 'Enter the amount it charges in ₹.');
      return;
    }
    update(sub.id, { price_inr: p, notes });
    setEditing(false);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete subscription?',
      `${sub.service_name} and its full history will be removed. This can't be undone.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            remove(sub.id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center pt-4 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="pr-3 py-1">
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text className="text-ink text-xl font-bold flex-1" numberOfLines={1}>
            {sub.service_name}
          </Text>
          <TouchableOpacity onPress={editing ? saveEdit : startEdit}>
            <Text className="text-accent font-semibold">{editing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        <Card className="items-center py-5">
          <ServiceLogo name={sub.service_name} color={logoColor} size={56} />
          {editing ? (
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              className="text-ink text-3xl font-bold mt-3 border-b border-accent px-2 text-center"
            />
          ) : (
            <Text className="text-ink text-3xl font-bold mt-3">
              {formatINR(sub.price_inr)}
            </Text>
          )}
          <Text className="text-muted text-sm mt-1">
            {sub.plan_name ? `${sub.plan_name} · ` : ''}
            {CYCLE_LABELS[sub.billing_cycle]} · {CATEGORY_LABELS[sub.category]}
          </Text>
          {sub.status === 'active' ? (
            <View className="flex-row items-center mt-3">
              <Text className="text-faint text-xs mr-2">
                Renews {formatFullDate(sub.next_renewal_date)}
              </Text>
              <DaysChip days={daysUntil(sub.next_renewal_date)} />
            </View>
          ) : (
            <Text className="text-warn text-xs mt-3 capitalize">{sub.status}</Text>
          )}
        </Card>

        <View className="flex-row mt-3">
          <Card className="flex-1 mr-1.5 items-center py-3">
            <Text className="text-ink text-lg font-bold">{formatINR(lifetime)}</Text>
            <Text className="text-faint text-xs mt-0.5">lifetime spend</Text>
          </Card>
          <Card className="flex-1 ml-1.5 items-center py-3">
            <Text className="text-ink text-lg font-bold">
              {formatFullDate(sub.start_date)}
            </Text>
            <Text className="text-faint text-xs mt-0.5">since</Text>
          </Card>
        </View>

        {/* Actions */}
        <View className="flex-row mt-3">
          {sub.status === 'active' ? (
            <ActionBtn label="Pause" icon="pause" onPress={() => pause(sub.id)} />
          ) : (
            <ActionBtn label="Resume" icon="play" onPress={() => resume(sub.id)} />
          )}
          {sub.status !== 'cancelled' ? (
            <ActionBtn label="Mark cancelled" icon="close-circle-outline" onPress={() => cancel(sub.id)} />
          ) : null}
          <ActionBtn label="Delete" icon="trash-outline" danger onPress={confirmDelete} />
        </View>

        {/* Notes */}
        <Text className="text-ink text-base font-bold mt-5 mb-2">Notes</Text>
        {editing ? (
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Shared with family, cancel before Diwali…"
            placeholderTextColor={colors.faint}
            className="bg-card border border-border rounded-xl px-4 py-3 text-ink min-h-[80px]"
          />
        ) : (
          <Card>
            <Text className={sub.notes ? 'text-muted text-sm' : 'text-faint text-sm'}>
              {sub.notes || 'No notes. Tap Edit to add context - shared plans, cancel-by dates.'}
            </Text>
          </Card>
        )}

        {/* Price history */}
        <Text className="text-ink text-base font-bold mt-5 mb-2">Price history</Text>
        <Card>
          {history.map((h, i) => (
            <View
              key={h.id}
              className={`flex-row items-center justify-between py-2 ${
                i < history.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <Text className="text-muted text-sm">{formatFullDate(h.effective_from)}</Text>
              <Text className="text-ink font-semibold">{formatINR(h.price_inr)}</Text>
            </View>
          ))}
          {history.length === 0 ? (
            <Text className="text-faint text-sm">No price changes recorded.</Text>
          ) : null}
        </Card>

        {/* Renewal log */}
        <Text className="text-ink text-base font-bold mt-5 mb-2">Renewal log</Text>
        <Card className="mb-10">
          {renewals.map((r, i) => (
            <View
              key={r.id}
              className={`flex-row items-center justify-between py-2 ${
                i < renewals.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <Text className="text-muted text-sm">{formatFullDate(r.renewed_on)}</Text>
              <Text className="text-ink font-semibold">{formatINR(r.amount_inr)}</Text>
            </View>
          ))}
          {renewals.length === 0 ? (
            <Text className="text-faint text-sm">
              No renewals charged yet - the first one lands on{' '}
              {formatFullDate(sub.next_renewal_date)}.
            </Text>
          ) : null}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function ActionBtn({
  label,
  icon,
  onPress,
  danger,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 mx-0.5 items-center py-3 rounded-xl border ${
        danger ? 'border-danger/40 bg-danger/10' : 'border-border bg-card'
      }`}
    >
      <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.ink} />
      <Text className={`text-xs mt-1 ${danger ? 'text-danger' : 'text-muted'}`}>{label}</Text>
    </TouchableOpacity>
  );
}
