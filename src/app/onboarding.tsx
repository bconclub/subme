import { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { PlanPicker } from '@/components/PlanPicker';
import { ServiceLogo } from '@/components/ServiceLogo';
import { popularServices } from '@/lib/catalog';
import { todayIST } from '@/lib/dates';
import { formatINR } from '@/lib/format';
import type { CatalogService } from '@/lib/types';
import { FREE_PLAN_SUB_CAP } from '@/lib/types';
import { useSubsStore } from '@/stores/subscriptions';
import { useSettingsStore } from '@/stores/settings';
import { colors, gradients } from '@/theme/colors';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [picking, setPicking] = useState<CatalogService | null>(null);
  const subs = useSubsStore((s) => s.subs);
  const add = useSubsStore((s) => s.add);
  const remove = useSubsStore((s) => s.remove);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const setConsent = useSettingsStore((s) => s.setConsent);

  const addedByService = new Map(
    subs.map((s) => [s.catalog_service_id, s.id] as const),
  );

  const finish = () => {
    if (phone.trim()) updateProfile({ phone: phone.trim() });
    setConsent('local_notifications', true);
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  const toggleService = (service: CatalogService) => {
    const existing = addedByService.get(service.id);
    if (existing) {
      remove(existing);
    } else if (subs.length >= FREE_PLAN_SUB_CAP) {
      // Free cap - the grid simply stops adding; banner below explains.
    } else if (service.plans.length === 1) {
      addPlan(service, 0);
    } else {
      setPicking(service);
    }
  };

  const addPlan = (service: CatalogService, planIndex: number) => {
    const plan = service.plans[planIndex];
    add({
      service_name: service.name,
      catalog_service_id: service.id,
      plan_name: plan.name,
      price_inr: plan.price_inr,
      billing_cycle: plan.billing_cycle,
      category: service.category,
      start_date: todayIST(),
    });
    setPicking(null);
  };

  return (
    <Screen>
      {step === 0 && (
        <View className="flex-1 justify-center">
          <View className="w-16 h-16 rounded-2xl bg-accent items-center justify-center mb-6">
            <Ionicons name="wallet-outline" size={32} color={colors.bg} />
          </View>
          <Text className="text-ink text-3xl font-bold font-display leading-10">
            Every subscription{'\n'}in one place.
          </Text>
          <Text style={{ color: colors.accent }} className="text-2xl font-bold font-display mt-2">
            No more surprises.
          </Text>
          <Text className="text-muted text-base mt-4 leading-6">
            Netflix, Jio, Swiggy One, ChatGPT - Subme watches every recurring
            charge, shows your monthly burn, and warns you before each renewal
            hits.
          </Text>
        </View>
      )}

      {step === 1 && (
        <View className="flex-1 justify-center">
          <View className="w-16 h-16 rounded-2xl bg-info items-center justify-center mb-6">
            <Ionicons name="shield-checkmark-outline" size={32} color={colors.bg} />
          </View>
          <Text className="text-ink text-3xl font-bold font-display leading-10">
            Your data stays yours.
          </Text>
          <Text className="text-muted text-base mt-4 leading-6">
            Everything you add lives on this phone. No bank logins, no SMS
            snooping, nothing sold to anyone. DPDP compliant by design - you
            can export or wipe every byte from Settings, any time.
          </Text>
          <View className="mt-6">
            <Text className="text-faint text-xs mb-2">
              Phone number (optional - for WhatsApp renewal alerts, coming soon)
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91"
              placeholderTextColor={colors.faint}
              className="bg-card border border-border rounded-xl px-4 py-3 text-ink"
            />
          </View>
        </View>
      )}

      {step === 2 && (
        <View className="flex-1 pt-16">
          <Text className="text-ink text-2xl font-bold font-display">What do you pay for?</Text>
          <Text className="text-muted text-sm mt-1 mb-4">
            Tap to add - prices auto-filled. You can fine-tune later.
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap -mx-1">
              {popularServices().map((service) => {
                const isAdded = addedByService.has(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    onPress={() => toggleService(service)}
                    className={`w-1/3 px-1 mb-2`}
                  >
                    <View
                      className={`items-center rounded-2xl border px-2 py-3 ${
                        isAdded ? 'border-accent bg-accent/10' : 'border-border bg-card'
                      }`}
                    >
                      <ServiceLogo name={service.name} color={service.logo_color} size={40} />
                      <Text
                        className="text-ink text-xs font-medium mt-2 text-center"
                        numberOfLines={1}
                      >
                        {service.name}
                      </Text>
                      <Text className="text-faint text-[10px] mt-0.5">
                        {isAdded ? 'Added ✓' : `from ${formatINR(Math.min(...service.plans.map((p) => p.price_inr)))}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {subs.length >= FREE_PLAN_SUB_CAP ? (
              <Text className="text-warn text-xs text-center mt-2 mb-4">
                Free plan tracks {FREE_PLAN_SUB_CAP} subscriptions. Add the rest after
                upgrading - or manage your top {FREE_PLAN_SUB_CAP} here.
              </Text>
            ) : null}
            <View className="h-24" />
          </ScrollView>
        </View>
      )}

      <View className="pb-10 pt-2">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => (step < 2 ? setStep(step + 1) : finish())}
        >
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#0B1404' }} className="font-bold text-base">
              {step === 0 ? 'Get started' : step === 1 ? 'I like that' : subs.length > 0 ? `Done - track ${subs.length}` : 'Skip for now'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        {step > 0 ? (
          <TouchableOpacity onPress={() => setStep(step - 1)} className="items-center mt-3">
            <Text className="text-faint text-sm">Back</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <PlanPicker
        service={picking}
        onClose={() => setPicking(null)}
        onPick={(i) => picking && addPlan(picking, i)}
      />
    </Screen>
  );
}
