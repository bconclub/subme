import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ServiceLogo } from '@/components/ServiceLogo';
import { CYCLE_LABELS } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { formatFullDate } from '@/lib/dates';
import { getCatalogService } from '@/lib/catalog';
import type { PendingDetection } from '@/ingestion/engine';
import { confirmDetection, runScan } from '@/ingestion/scan';
import { useDetectionsStore } from '@/stores/detections';
import { colors, gradients } from '@/theme/colors';

export default function Inbox() {
  const router = useRouter();
  const pending = useDetectionsStore((s) => s.pending);
  const dismiss = useDetectionsStore((s) => s.dismiss);
  const [scanning, setScanning] = useState(false);
  const [lastWasDemo, setLastWasDemo] = useState(false);

  const scan = useCallback(async () => {
    setScanning(true);
    try {
      const r = await runScan();
      setLastWasDemo(r.usedSimulated);
      if (r.permissionDenied) {
        Alert.alert(
          'SMS access needed',
          'Subme reads only payment SMS to find your subscriptions - nothing is uploaded. Grant SMS permission to scan automatically.',
        );
      } else if (r.newDetections === 0 && r.renewalsConfirmed === 0) {
        Alert.alert('All caught up', 'No new subscriptions found in your recent messages.');
      }
    } finally {
      setScanning(false);
    }
  }, []);

  const confirm = (d: PendingDetection) => {
    confirmDetection(d);
  };

  return (
    <Screen padded={false}>
      <ScrollView
        className="px-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={scanning} onRefresh={scan} tintColor={colors.accent} />
        }
      >
        <View className="flex-row items-center justify-between pt-4">
          <View>
            <Text className="text-faint text-xs">Auto-detected</Text>
            <Text className="text-ink text-2xl font-bold">Inbox</Text>
          </View>
          <TouchableOpacity onPress={scan} disabled={scanning} activeOpacity={0.85}>
            <LinearGradient
              colors={gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 999, paddingHorizontal: 16, height: 44, flexDirection: 'row', alignItems: 'center' }}
            >
              {scanning ? (
                <ActivityIndicator size="small" color="#04201A" />
              ) : (
                <Ionicons name="scan-outline" size={18} color="#04201A" />
              )}
              <Text style={{ color: '#042018' }} className="font-bold text-sm ml-2">
                {scanning ? 'Scanning' : 'Scan now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {pending.length === 0 ? (
          <>
            <EmptyState
              icon="sparkles-outline"
              title="No new subscriptions found"
              body="Subme scans your payment messages and surfaces any subscription it spots here - confirm with one tap. Run a scan, or add one yourself if needed."
              ctaLabel="Scan now"
              onPress={scan}
            />
            <TouchableOpacity
              onPress={() => router.push('/subscription/add')}
              className="items-center -mt-6"
            >
              <Text className="text-faint text-sm">Add manually instead</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-muted text-sm mt-4 mb-2">
              {pending.length} found on your account - confirm what&apos;s yours.
            </Text>
            {pending.map((d) => (
              <View key={d.key} className="mb-2.5">
                <Card tone="strong">
                  <View className="flex-row items-center">
                    <ServiceLogo
                      name={d.service_name}
                      color={getCatalogService(d.service_id)?.logo_color ?? colors.accentDim}
                      size={44}
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-ink font-bold text-[15px]">{d.service_name}</Text>
                      <Text className="text-muted text-xs mt-0.5">
                        {formatINR(d.amount_inr)} · {CYCLE_LABELS[d.billing_cycle]}
                        {d.suggested_plan_name ? ` · ${d.suggested_plan_name}` : ''}
                      </Text>
                    </View>
                    <View
                      style={{ backgroundColor: 'rgba(52,229,176,0.15)' }}
                      className="px-2 py-1 rounded-full"
                    >
                      <Text className="text-accent text-[10px] font-semibold">
                        {Math.round(d.confidence * 100)}% match
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                    className="rounded-xl px-3 py-2 mt-3"
                  >
                    <Text className="text-faint text-[11px]" numberOfLines={2}>
                      <Ionicons name="chatbox-ellipses-outline" size={11} color={colors.faint} />{' '}
                      {d.evidence}
                    </Text>
                    <Text className="text-faint text-[10px] mt-1">
                      Seen {formatFullDate(d.first_seen_on)}
                      {d.account_hint ? ` · ${d.account_hint}` : ''}
                    </Text>
                  </View>

                  <View className="flex-row mt-3">
                    <TouchableOpacity
                      onPress={() => dismiss(d.key)}
                      className="flex-1 mr-1.5 items-center py-2.5 rounded-full border border-border"
                    >
                      <Text className="text-muted text-sm font-semibold">Not mine</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirm(d)}
                      activeOpacity={0.85}
                      className="flex-[1.4] ml-1.5"
                    >
                      <LinearGradient
                        colors={gradients.hero}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ borderRadius: 999, paddingVertical: 10, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#042018' }} className="font-bold text-sm">
                          Add to Subme
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </Card>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => router.push('/subscription/add')}
              className="items-center py-3 mt-1"
            >
              <Text className="text-faint text-sm">Add one manually instead</Text>
            </TouchableOpacity>
          </>
        )}

        {lastWasDemo ? (
          <Text className="text-faint text-[11px] text-center mt-2">
            Demo scan (sample SMS). Real SMS scanning activates in the dev build with
            permission.
          </Text>
        ) : null}
        <View className="h-28" />
      </ScrollView>
    </Screen>
  );
}
