import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { ServiceLogo } from '@/components/ServiceLogo';
import { EmptyState } from '@/components/EmptyState';
import { renewalsForMonth, totalDueInMonth } from '@/lib/analytics';
import { daysInMonth, parseISODate, todayIST, toISODate } from '@/lib/dates';
import { formatINR } from '@/lib/format';
import { useSubsStore } from '@/stores/subscriptions';
import { colors } from '@/theme/colors';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Calendar() {
  const router = useRouter();
  const subs = useSubsStore((s) => s.subs);
  const today = todayIST();
  const t = parseISODate(today);
  const [ym, setYm] = useState({ y: t.y, m: t.m });
  const [selected, setSelected] = useState<string | null>(null);

  const dayMap = useMemo(() => renewalsForMonth(subs, ym.y, ym.m), [subs, ym]);
  const totalDue = useMemo(() => totalDueInMonth(subs, ym.y, ym.m), [subs, ym]);

  const move = (delta: number) => {
    setSelected(null);
    setYm(({ y, m }) => {
      const zero = m - 1 + delta;
      return { y: y + Math.floor(zero / 12), m: ((zero % 12) + 12) % 12 + 1 };
    });
  };

  // Monday-first grid.
  const firstWeekday = (new Date(Date.UTC(ym.y, ym.m - 1, 1)).getUTCDay() + 6) % 7;
  const numDays = daysInMonth(ym.y, ym.m);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDay = selected ? dayMap.get(selected) : null;
  const hasActive = subs.some((s) => s.status === 'active');

  return (
    <Screen>
      <Text className="text-ink text-2xl font-bold font-display pt-4">Calendar</Text>

      {!hasActive ? (
        <EmptyState
          icon="calendar-outline"
          title="No renewals to show"
          body="Once you track an active subscription, its renewal dates appear here with what's due each month."
          ctaLabel="Add a subscription"
          onPress={() => router.push('/subscription/add')}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card className="mt-4">
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity onPress={() => move(-1)} className="p-2">
                <Ionicons name="chevron-back" size={20} color={colors.muted} />
              </TouchableOpacity>
              <Text className="text-ink font-bold text-base">
                {MONTH_NAMES[ym.m - 1]} {ym.y}
              </Text>
              <TouchableOpacity onPress={() => move(1)} className="p-2">
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <View className="flex-row mb-1">
              {WEEKDAYS.map((d, i) => (
                <Text key={i} className="flex-1 text-center text-faint text-xs">
                  {d}
                </Text>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {cells.map((day, i) => {
                if (day === null) return <View key={i} className="w-[14.28%] h-14" />;
                const iso = toISODate(ym.y, ym.m, day);
                const hits = dayMap.get(iso);
                const isToday = iso === today;
                const isSelected = iso === selected;
                return (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.7}
                    onPress={() => setSelected(hits ? iso : null)}
                    className="w-[14.28%] h-14 items-center pt-1"
                  >
                    <View
                      className={`w-7 h-7 rounded-full items-center justify-center ${
                        isSelected
                          ? 'bg-accent'
                          : isToday
                            ? 'border border-accent'
                            : ''
                      }`}
                    >
                      <Text
                        className={`text-[13px] ${
                          isSelected
                            ? 'text-bg font-bold'
                            : isToday
                              ? 'text-accent font-semibold'
                              : 'text-ink'
                        }`}
                      >
                        {day}
                      </Text>
                    </View>
                    {hits ? (
                      <View className="flex-row items-center mt-1" style={{ height: 18 }}>
                        {hits.renewals.slice(0, 2).map((s, k) => (
                          <View key={s.id} style={{ marginLeft: k === 0 ? 0 : -6 }}>
                            <ServiceLogo
                              name={s.service_name}
                              catalogId={s.catalog_service_id}
                              size={16}
                            />
                          </View>
                        ))}
                        {hits.renewals.length > 2 ? (
                          <Text className="text-faint text-[9px] ml-0.5">
                            +{hits.renewals.length - 2}
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <Card className="mt-3 flex-row items-center justify-between">
            <Text className="text-muted text-sm">Due in {MONTH_NAMES[ym.m - 1]}</Text>
            <Text className="text-ink text-lg font-bold">{formatINR(totalDue)}</Text>
          </Card>

          {selectedDay ? (
            <Animated.View key={selectedDay.date} entering={FadeInDown.duration(220).springify()}>
              <Text className="text-ink text-base font-bold mt-4 mb-2">
                Due on {selectedDay.date.slice(8)} {MONTH_NAMES[ym.m - 1]} ·{' '}
                {formatINR(selectedDay.total_inr)}
              </Text>
              {selectedDay.renewals.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => router.push(`/subscription/${s.id}`)}
                  className="flex-row items-center bg-card border border-border rounded-2xl px-4 py-3 mb-2"
                >
                  <ServiceLogo
                    name={s.service_name}
                    catalogId={s.catalog_service_id}
                    size={36}
                  />
                  <Text className="text-ink font-medium flex-1 ml-3" numberOfLines={1}>
                    {s.service_name}
                  </Text>
                  <Text className="text-ink font-bold">{formatINR(s.price_inr)}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          ) : dayMap.size > 0 ? (
            <Text className="text-faint text-xs text-center mt-3">
              Tap a highlighted date to see what&apos;s due.
            </Text>
          ) : (
            <Text className="text-faint text-xs text-center mt-3">
              Nothing renews in {MONTH_NAMES[ym.m - 1]}.
            </Text>
          )}
          <View className="h-28" />
        </ScrollView>
      )}
    </Screen>
  );
}
