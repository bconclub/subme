import { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Banner } from '@/components/Banner';
import { Donut } from '@/components/Donut';
import { Sparkline } from '@/components/Sparkline';
import { DaysChip } from '@/components/DaysChip';
import { ServiceLogo } from '@/components/ServiceLogo';
import { EmptyState } from '@/components/EmptyState';
import {
  activeCount,
  annualProjection,
  categoryBreakdown,
  monthlyBurn,
  twelveMonthSpend,
  upcomingRenewals,
} from '@/lib/analytics';
import { CATEGORY_LABELS, FREE_PLAN_SUB_CAP } from '@/lib/types';
import { formatDayMonth } from '@/lib/dates';
import { formatINR, formatINRCompact } from '@/lib/format';
import { useSubsStore } from '@/stores/subscriptions';
import { useDetectionsStore } from '@/stores/detections';
import { CATEGORY_COLORS, colors, gradients } from '@/theme/colors';

export default function Dashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const subs = useSubsStore((s) => s.subs);
  const renewalLog = useSubsStore((s) => s.renewalLog);
  const rollForward = useSubsStore((s) => s.rollForward);
  const pendingCount = useDetectionsStore((s) => s.pending.length);
  const [refreshing, setRefreshing] = useState(false);

  const burn = useMemo(() => monthlyBurn(subs), [subs]);
  const annual = useMemo(() => annualProjection(subs), [subs]);
  const active = useMemo(() => activeCount(subs), [subs]);
  const slices = useMemo(() => categoryBreakdown(subs), [subs]);
  const spend = useMemo(() => twelveMonthSpend(subs, renewalLog), [subs, renewalLog]);
  const next = useMemo(() => upcomingRenewals(subs, 5), [subs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    rollForward();
    setTimeout(() => setRefreshing(false), 400);
  }, [rollForward]);

  if (subs.length === 0) {
    return (
      <Screen>
        <Text className="text-ink text-2xl font-bold font-display pt-4">Dashboard</Text>
        <EmptyState
          icon="sparkles-outline"
          title="Nothing tracked yet"
          body="Add your first subscription and your monthly burn, projections and renewal calendar light up instantly."
          ctaLabel="Add a subscription"
          onPress={() => router.push('/subscription/add')}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        className="px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pt-4">
          <View>
            <Text className="text-faint text-xs">Good to see you</Text>
            <Text className="text-ink text-2xl font-bold font-display">Dashboard</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/subscription/add')} activeOpacity={0.85}>
            <LinearGradient
              colors={gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="add" size={26} color="#0B1404" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Hero: gradient monthly burn */}
        <View style={{ borderRadius: 28, overflow: 'hidden', marginTop: 16 }}>
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 22 }}
          >
            <Text style={{ color: 'rgba(11,20,4,0.7)' }} className="text-xs font-semibold tracking-widest">
              MONTHLY BURN
            </Text>
            <Text style={{ color: '#0B1404' }} className="text-[44px] font-bold font-display mt-1">
              {formatINR(burn)}
            </Text>
            <View className="flex-row mt-4">
              <View className="pr-6">
                <Text style={{ color: '#0B1404' }} className="text-base font-bold">
                  {formatINRCompact(annual)}
                </Text>
                <Text style={{ color: 'rgba(11,20,4,0.65)' }} className="text-xs mt-0.5">
                  per year
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: 'rgba(11,20,4,0.2)' }} />
              <View className="pl-6">
                <Text style={{ color: '#0B1404' }} className="text-base font-bold">
                  {active}
                </Text>
                <Text style={{ color: 'rgba(11,20,4,0.65)' }} className="text-xs mt-0.5">
                  active
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Auto-detected nudge */}
        {pendingCount > 0 ? (
          <View className="mt-3">
            <Banner
              icon="sparkles"
              title={`${pendingCount} new subscription${pendingCount > 1 ? 's' : ''} detected`}
              body="We spotted these on your account. Review and add with one tap."
              ctaLabel="Open inbox"
              colorsPair={gradients.violet}
              onPress={() => router.push('/(tabs)/inbox')}
            />
          </View>
        ) : null}

        {/* Upgrade banner */}
        {subs.length >= FREE_PLAN_SUB_CAP ? (
          <View className="mt-3">
            <Banner
              icon="rocket-outline"
              title="You've hit the free limit"
              body={`Tracking ${FREE_PLAN_SUB_CAP}/${FREE_PLAN_SUB_CAP}. Go Pro for unlimited subs + WhatsApp alerts.`}
              ctaLabel="See Subme Pro"
              onPress={() => router.push('/(tabs)/settings')}
            />
          </View>
        ) : null}

        {/* Category donut */}
        {slices.length > 0 ? (
          <Card className="mt-3 flex-row items-center" tone="strong">
            <Donut slices={slices} size={132} strokeWidth={18} />
            <View className="flex-1 ml-4">
              {slices.slice(0, 5).map((s) => (
                <View key={s.category} className="flex-row items-center mb-1.5">
                  <View
                    style={{ backgroundColor: CATEGORY_COLORS[s.category] }}
                    className="w-2.5 h-2.5 rounded-full"
                  />
                  <Text className="text-muted text-xs ml-2 flex-1" numberOfLines={1}>
                    {CATEGORY_LABELS[s.category]}
                  </Text>
                  <Text className="text-ink text-xs font-semibold">
                    {formatINRCompact(s.monthly_inr)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* 12-month sparkline */}
        <Card className="mt-3">
          <Text className="text-muted text-xs uppercase tracking-widest mb-3">
            Spend · last 12 months
          </Text>
          {spend.some((p) => p.total_inr > 0) ? (
            <Sparkline points={spend} width={width - 64} height={56} />
          ) : (
            <Text className="text-faint text-sm">
              Charges land here as renewals happen - check back after your first
              renewal.
            </Text>
          )}
        </Card>

        {/* Next renewals */}
        <Text className="text-ink text-lg font-bold mt-5 mb-2">Next renewals</Text>
        {next.length === 0 ? (
          <Card>
            <Text className="text-faint text-sm">
              No upcoming renewals - everything is paused or cancelled.
            </Text>
          </Card>
        ) : (
          next.map(({ subscription: s, days_away, renewal_date }) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.8}
              onPress={() => router.push(`/subscription/${s.id}`)}
              className="mb-2"
            >
              <Card className="flex-row items-center" intensity={35}>
                <ServiceLogo
                  name={s.service_name}
                  catalogId={s.catalog_service_id}
                  size={38}
                />
                <View className="flex-1 ml-3">
                  <Text className="text-ink font-semibold" numberOfLines={1}>
                    {s.service_name}
                  </Text>
                  <Text className="text-faint text-xs mt-0.5">
                    {formatDayMonth(renewal_date)} · {formatINR(s.price_inr)}
                  </Text>
                </View>
                <DaysChip days={days_away} />
              </Card>
            </TouchableOpacity>
          ))
        )}
        <View className="h-28" />
      </ScrollView>
    </Screen>
  );
}
