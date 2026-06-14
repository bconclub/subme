import { Text, View } from 'react-native';

export function DaysChip({ days }: { days: number }) {
  const label =
    days < 0 ? 'overdue' : days === 0 ? 'today' : days === 1 ? 'tomorrow' : `${days}d`;
  const tone =
    days <= 1 ? 'bg-danger/20 text-danger' : days <= 3 ? 'bg-warn/20 text-warn' : 'bg-border text-muted';
  const [bg, text] = tone.split(' ');
  return (
    <View className={`px-2.5 py-1 rounded-full ${bg}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
