import { useMemo, useState } from 'react';
import {
  Alert,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SubRow } from '@/components/SubRow';
import { EmptyState } from '@/components/EmptyState';
import type { Subscription } from '@/lib/types';
import { useSubsStore } from '@/stores/subscriptions';
import { colors } from '@/theme/colors';

export default function Subscriptions() {
  const router = useRouter();
  const subs = useSubsStore((s) => s.subs);
  const pause = useSubsStore((s) => s.pause);
  const resume = useSubsStore((s) => s.resume);
  const cancel = useSubsStore((s) => s.cancel);
  const remove = useSubsStore((s) => s.remove);
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? subs.filter(
          (s) =>
            s.service_name.toLowerCase().includes(q) ||
            s.plan_name.toLowerCase().includes(q) ||
            s.category.includes(q),
        )
      : subs;
    const by = (status: Subscription['status']) =>
      filtered
        .filter((s) => s.status === status)
        .sort((a, b) => a.service_name.localeCompare(b.service_name));
    return [
      { title: 'Active', data: by('active') },
      { title: 'Paused', data: by('paused') },
      { title: 'Cancelled', data: by('cancelled') },
    ].filter((sec) => sec.data.length > 0);
  }, [subs, query]);

  const confirmDelete = (id: string) => {
    const sub = subs.find((s) => s.id === id);
    Alert.alert(
      'Delete subscription?',
      `${sub?.service_name ?? 'This subscription'} and its full history will be removed. This can't be undone.`,
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(id) },
      ],
    );
  };

  return (
    <Screen padded={false}>
      <View className="px-4 pt-4 flex-row items-center justify-between">
        <Text className="text-ink text-2xl font-bold">Subscriptions</Text>
        <TouchableOpacity
          onPress={() => router.push('/subscription/add')}
          className="bg-accent rounded-full w-10 h-10 items-center justify-center"
        >
          <Ionicons name="add" size={24} color={colors.bg} />
        </TouchableOpacity>
      </View>

      <View className="px-4 mt-3">
        <View className="flex-row items-center bg-card border border-border rounded-xl px-3">
          <Ionicons name="search" size={16} color={colors.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, plan, category"
            placeholderTextColor={colors.faint}
            className="flex-1 py-2.5 px-2 text-ink"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.faint} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {subs.length === 0 ? (
        <EmptyState
          icon="albums-outline"
          title="No subscriptions yet"
          body="Add Netflix, Jio, your gym - anything that charges you on repeat. Swipe any row later to pause, cancel or delete."
          ctaLabel="Add your first"
          onPress={() => router.push('/subscription/add')}
        />
      ) : sections.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No matches"
          body={`Nothing matches “${query}”. Try a service name or category.`}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          className="mt-2"
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text className="text-faint text-xs uppercase tracking-widest px-4 pt-4 pb-2">
              {section.title} · {section.data.length}
            </Text>
          )}
          ItemSeparatorComponent={() => <View className="h-px bg-border mx-4" />}
          renderItem={({ item }) => (
            <SubRow
              sub={item}
              onPause={pause}
              onResume={resume}
              onCancel={cancel}
              onDelete={confirmDelete}
            />
          )}
          ListFooterComponent={<View className="h-28" />}
        />
      )}
    </Screen>
  );
}
