import { useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { FREE_PLAN_SUB_CAP, type ConsentType } from '@/lib/types';
import { useSubsStore } from '@/stores/subscriptions';
import { useSettingsStore } from '@/stores/settings';
import { colors } from '@/theme/colors';

const DAYS_OPTIONS = [0, 1, 2, 3, 7];

const CONSENT_ITEMS: { type: ConsentType; label: string; detail: string; available: boolean }[] = [
  {
    type: 'local_notifications',
    label: 'Renewal alerts on this phone',
    detail: 'Local notifications before each renewal. Nothing leaves the device.',
    available: true,
  },
  {
    type: 'whatsapp_alerts',
    label: 'WhatsApp alerts',
    detail: 'Renewal reminders on WhatsApp. Coming soon - consent recorded now.',
    available: true,
  },
  {
    type: 'notification_listener',
    label: 'Auto-detect from app notifications',
    detail: 'Reads payment notifications to spot subscriptions. Coming soon.',
    available: false,
  },
  {
    type: 'sms_ingestion',
    label: 'Auto-detect from SMS',
    detail: 'Reads bank SMS to spot recurring charges. Coming soon.',
    available: false,
  },
];

export default function Settings() {
  const router = useRouter();
  const profile = useSettingsStore((s) => s.profile);
  const alertPrefs = useSettingsStore((s) => s.alertPrefs);
  const consents = useSettingsStore((s) => s.consents);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const setAlertPrefs = useSettingsStore((s) => s.setAlertPrefs);
  const setConsent = useSettingsStore((s) => s.setConsent);
  const resetSettings = useSettingsStore((s) => s.resetAll);
  const subs = useSubsStore((s) => s.subs);
  const clearSubs = useSubsStore((s) => s.clearAll);

  const [name, setName] = useState(profile.full_name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');

  const granted = (t: ConsentType) =>
    consents.find((c) => c.consent_type === t)?.granted ?? false;

  const exportData = async () => {
    const state = useSubsStore.getState();
    const settings = useSettingsStore.getState();
    const payload = {
      exported_at: new Date().toISOString(),
      app: 'Subme',
      profile: settings.profile,
      alert_prefs: settings.alertPrefs,
      consents: settings.consents,
      subscriptions: state.subs,
      price_history: state.priceHistory,
      renewal_log: state.renewalLog,
    };
    await Share.share({
      title: 'Subme data export',
      message: JSON.stringify(payload, null, 2),
    });
  };

  const deleteEverything = () => {
    Alert.alert(
      'Delete all data?',
      'Every subscription, renewal record, consent and profile detail on this phone will be permanently erased. There is no undo.',
      [
        { text: 'Keep my data', style: 'cancel' },
        {
          text: 'Erase everything',
          style: 'destructive',
          onPress: () => {
            clearSubs();
            resetSettings();
            router.replace('/onboarding');
          },
        },
      ],
    );
  };

  return (
    <Screen padded={false}>
      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        <Text className="text-ink text-2xl font-bold pt-4">Settings</Text>

        {/* Plan */}
        <Card className="mt-4 flex-row items-center">
          <View className="flex-1">
            <Text className="text-ink font-bold">Free plan</Text>
            <Text className="text-muted text-xs mt-0.5">
              {subs.length}/{FREE_PLAN_SUB_CAP} subscriptions tracked
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Coming soon', 'Subme Pro - unlimited subscriptions, WhatsApp alerts, auto-detection. Payments land in a future update.')
            }
            className="bg-accent/15 border border-accent rounded-full px-4 py-2"
          >
            <Text className="text-accent font-semibold text-xs">Upgrade</Text>
          </TouchableOpacity>
        </Card>

        {/* Profile */}
        <Text className="text-ink text-base font-bold mt-5 mb-2">Profile</Text>
        <Card>
          <Text className="text-faint text-xs mb-1.5">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onEndEditing={() => updateProfile({ full_name: name.trim() || null })}
            placeholder="Your name"
            placeholderTextColor={colors.faint}
            className="bg-surface border border-border rounded-xl px-4 py-3 text-ink mb-3"
          />
          <Text className="text-faint text-xs mb-1.5">
            Phone (for WhatsApp alerts, coming soon)
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            onEndEditing={() => updateProfile({ phone: phone.trim() || null })}
            keyboardType="phone-pad"
            placeholder="+91"
            placeholderTextColor={colors.faint}
            className="bg-surface border border-border rounded-xl px-4 py-3 text-ink"
          />
        </Card>

        {/* Alerts */}
        <Text className="text-ink text-base font-bold mt-5 mb-2">Renewal alerts</Text>
        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-ink font-medium">Alert me before renewals</Text>
              <Text className="text-faint text-xs mt-0.5">At 9:00 AM IST</Text>
            </View>
            <Switch
              value={alertPrefs.enabled}
              onValueChange={(v) => {
                setAlertPrefs({ enabled: v });
                setConsent('local_notifications', v);
              }}
              trackColor={{ true: colors.accentDim, false: colors.border }}
              thumbColor={colors.ink}
            />
          </View>
          {alertPrefs.enabled ? (
            <View className="mt-4">
              <Text className="text-faint text-xs mb-2">How many days before?</Text>
              <View className="flex-row">
                {DAYS_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setAlertPrefs({ days_before: d })}
                    className={`px-3.5 py-2 mr-2 rounded-full border ${
                      alertPrefs.days_before === d
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <Text
                      className={
                        alertPrefs.days_before === d
                          ? 'text-accent text-xs font-semibold'
                          : 'text-muted text-xs'
                      }
                    >
                      {d === 0 ? 'Same day' : `${d}d`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </Card>

        {/* Consent dashboard */}
        <Text className="text-ink text-base font-bold mt-5 mb-2">Privacy & consent</Text>
        <Card>
          <Text className="text-muted text-xs leading-5 mb-3">
            Subme follows India&apos;s DPDP Act: every data use needs your explicit
            yes, and you can take it back any time. Today all data stays on
            this phone.
          </Text>
          {CONSENT_ITEMS.map((item, i) => (
            <View
              key={item.type}
              className={`flex-row items-center py-3 ${
                i < CONSENT_ITEMS.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <View className="flex-1 pr-3">
                <Text className="text-ink text-sm font-medium">{item.label}</Text>
                <Text className="text-faint text-xs mt-0.5 leading-4">{item.detail}</Text>
              </View>
              <Switch
                value={granted(item.type)}
                disabled={!item.available}
                onValueChange={(v) => setConsent(item.type, v)}
                trackColor={{ true: colors.accentDim, false: colors.border }}
                thumbColor={item.available ? colors.ink : colors.faint}
              />
            </View>
          ))}
        </Card>

        {/* Data */}
        <Text className="text-ink text-base font-bold mt-5 mb-2">Your data</Text>
        <Card>
          <TouchableOpacity
            onPress={exportData}
            className="flex-row items-center py-3 border-b border-border"
          >
            <Ionicons name="download-outline" size={20} color={colors.info} />
            <View className="flex-1 ml-3">
              <Text className="text-ink text-sm font-medium">Export my data</Text>
              <Text className="text-faint text-xs mt-0.5">
                Full JSON - subscriptions, history, consents.
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={deleteEverything} className="flex-row items-center py-3">
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <View className="flex-1 ml-3">
              <Text className="text-danger text-sm font-medium">Delete everything</Text>
              <Text className="text-faint text-xs mt-0.5">
                Hard delete of all local data. No undo.
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        <Text className="text-faint text-xs text-center mt-6 mb-10">
          Subme 1.0.0 · Made in India 🇮🇳 · Your data stays yours.
        </Text>
        <View className="h-24" />
      </ScrollView>
    </Screen>
  );
}
