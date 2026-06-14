import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { ServiceLogo } from '@/components/ServiceLogo';
import { searchCatalog } from '@/lib/catalog';
import { todayIST } from '@/lib/dates';
import { formatINR } from '@/lib/format';
import type { BillingCycle, CatalogService, Category } from '@/lib/types';
import { CATEGORY_LABELS, CYCLE_LABELS, FREE_PLAN_SUB_CAP } from '@/lib/types';
import { useSubsStore } from '@/stores/subscriptions';
import { colors } from '@/theme/colors';

const CYCLES: BillingCycle[] = ['weekly', 'monthly', 'quarterly', 'yearly'];
const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export default function AddSubscription() {
  const router = useRouter();
  const subs = useSubsStore((s) => s.subs);
  const add = useSubsStore((s) => s.add);

  const [mode, setMode] = useState<'search' | 'custom'>('search');
  const [query, setQuery] = useState('');
  const [service, setService] = useState<CatalogService | null>(null);

  // Form state (filled by catalog pick or typed for custom).
  const [name, setName] = useState('');
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState('');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState<Category>('other');
  const [startDate, setStartDate] = useState(todayIST());

  const results = useMemo(() => searchCatalog(query).slice(0, 8), [query]);
  const showForm = mode === 'custom' || service !== null;

  const pickService = (s: CatalogService) => {
    setService(s);
    setName(s.name);
    setCategory(s.category);
    const first = s.plans[0];
    if (first) {
      setPlanName(first.name);
      setPrice(String(first.price_inr));
      setCycle(first.billing_cycle);
    }
  };

  const pickPlan = (i: number) => {
    if (!service) return;
    const plan = service.plans[i];
    setPlanName(plan.name);
    setPrice(String(plan.price_inr));
    setCycle(plan.billing_cycle);
  };

  const save = () => {
    const priceNum = Number(price);
    if (!name.trim()) {
      Alert.alert('Name missing', 'Give the subscription a name.');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      Alert.alert('Price missing', 'Enter what it charges in ₹.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      Alert.alert('Bad date', 'Start date must be YYYY-MM-DD.');
      return;
    }
    if (subs.length >= FREE_PLAN_SUB_CAP) {
      Alert.alert(
        'Free plan limit',
        `Free plan tracks ${FREE_PLAN_SUB_CAP} subscriptions. Remove one or upgrade (coming soon).`,
      );
      return;
    }
    add({
      service_name: name,
      catalog_service_id: service?.id ?? null,
      plan_name: planName,
      price_inr: priceNum,
      billing_cycle: cycle,
      category,
      start_date: startDate,
    });
    router.back();
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center pt-4 mb-2">
          <TouchableOpacity onPress={() => router.back()} className="pr-3 py-1">
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text className="text-ink text-xl font-bold font-display">Add subscription</Text>
        </View>

        <View className="flex-row bg-card rounded-xl p-1 mb-3">
          {(['search', 'custom'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => {
                setMode(m);
                if (m === 'custom') setService(null);
              }}
              className={`flex-1 py-2 rounded-lg items-center ${
                mode === m ? 'bg-border' : ''
              }`}
            >
              <Text className={mode === m ? 'text-ink font-semibold' : 'text-faint'}>
                {m === 'search' ? 'From catalog' : 'Custom'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {mode === 'search' && !service ? (
            <>
              <View className="flex-row items-center bg-card border border-border rounded-xl px-3 mb-2">
                <Ionicons name="search" size={16} color={colors.faint} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Netflix, Jio, Cult…"
                  placeholderTextColor={colors.faint}
                  className="flex-1 py-2.5 px-2 text-ink"
                  autoFocus
                />
              </View>
              {results.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => pickService(s)}
                  className="flex-row items-center bg-card border border-border rounded-xl px-3 py-2.5 mb-2"
                >
                  <ServiceLogo name={s.name} catalogId={s.id} size={36} />
                  <View className="flex-1 ml-3">
                    <Text className="text-ink font-medium">{s.name}</Text>
                    <Text className="text-faint text-xs">
                      {CATEGORY_LABELS[s.category]} · from{' '}
                      {formatINR(Math.min(...s.plans.map((p) => p.price_inr)))}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.faint} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setMode('custom')} className="items-center py-3">
                <Text className="text-info text-sm">
                  Can&apos;t find it? Add a custom subscription →
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          {showForm ? (
            <>
              {service ? (
                <View className="flex-row items-center mb-3">
                  <ServiceLogo name={service.name} catalogId={service.id} size={40} />
                  <Text className="text-ink text-lg font-bold ml-3 flex-1">
                    {service.name}
                  </Text>
                  <TouchableOpacity onPress={() => setService(null)}>
                    <Text className="text-faint text-xs">Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Field label="Name">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Society gym, Milk delivery"
                    placeholderTextColor={colors.faint}
                    className="bg-card border border-border rounded-xl px-4 py-3 text-ink"
                  />
                </Field>
              )}

              {service && service.plans.length > 1 ? (
                <Field label="Plan">
                  <View className="flex-row flex-wrap">
                    {service.plans.map((p, i) => (
                      <TouchableOpacity
                        key={`${p.name}-${i}`}
                        onPress={() => pickPlan(i)}
                        className={`px-3 py-2 mr-2 mb-2 rounded-full border ${
                          planName === p.name
                            ? 'border-accent bg-accent/10'
                            : 'border-border bg-card'
                        }`}
                      >
                        <Text
                          className={planName === p.name ? 'text-accent text-xs' : 'text-muted text-xs'}
                        >
                          {p.name} · {formatINR(p.price_inr)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Field>
              ) : !service ? (
                <Field label="Plan name (optional)">
                  <TextInput
                    value={planName}
                    onChangeText={setPlanName}
                    placeholder="e.g. Annual"
                    placeholderTextColor={colors.faint}
                    className="bg-card border border-border rounded-xl px-4 py-3 text-ink"
                  />
                </Field>
              ) : null}

              <Field label="Price (₹)">
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="199"
                  placeholderTextColor={colors.faint}
                  className="bg-card border border-border rounded-xl px-4 py-3 text-ink"
                />
              </Field>

              <Field label="Billing cycle">
                <View className="flex-row">
                  {CYCLES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCycle(c)}
                      className={`px-3 py-2 mr-2 rounded-full border ${
                        cycle === c ? 'border-accent bg-accent/10' : 'border-border bg-card'
                      }`}
                    >
                      <Text className={cycle === c ? 'text-accent text-xs' : 'text-muted text-xs'}>
                        {CYCLE_LABELS[c]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>

              {!service ? (
                <Field label="Category">
                  <View className="flex-row flex-wrap">
                    {CATEGORIES.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setCategory(c)}
                        className={`px-3 py-1.5 mr-2 mb-2 rounded-full border ${
                          category === c ? 'border-accent bg-accent/10' : 'border-border bg-card'
                        }`}
                      >
                        <Text
                          className={category === c ? 'text-accent text-xs' : 'text-muted text-xs'}
                        >
                          {CATEGORY_LABELS[c]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Field>
              ) : null}

              <Field label="Started on (YYYY-MM-DD)">
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="2026-06-12"
                  placeholderTextColor={colors.faint}
                  className="bg-card border border-border rounded-xl px-4 py-3 text-ink"
                />
              </Field>

              <TouchableOpacity
                onPress={save}
                className="bg-accent rounded-full py-4 items-center mt-2 mb-10"
              >
                <Text className="text-bg font-bold text-base">Start tracking</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="text-faint text-xs mb-1.5">{label}</Text>
      {children}
    </View>
  );
}
