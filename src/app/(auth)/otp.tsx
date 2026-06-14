import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { getSupabase } from '@/lib/supabase';
import { colors } from '@/theme/colors';

export default function Otp() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    if (code.trim().length < 6) {
      Alert.alert('Code too short', 'Enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await getSupabase().auth.verifyOtp({
        email: email ?? '',
        token: code.trim(),
        type: 'email',
      });
      if (error) throw error;
      router.replace('/(tabs)/dashboard');
    } catch (e) {
      Alert.alert('Wrong code', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Text className="text-ink text-3xl font-bold font-display">Check your email</Text>
        <Text className="text-muted text-sm mt-2">
          We sent a 6-digit code to{' '}
          <Text className="text-ink font-semibold">{email}</Text>.
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="••••••"
          placeholderTextColor={colors.faint}
          className="bg-card border border-border rounded-xl px-4 py-4 text-ink text-2xl tracking-[12px] text-center mt-6"
        />
        <TouchableOpacity
          onPress={verify}
          disabled={busy}
          className={`rounded-full py-4 items-center mt-4 ${busy ? 'bg-accent/50' : 'bg-accent'}`}
        >
          <Text className="text-bg font-bold">{busy ? 'Verifying…' : 'Verify'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="items-center mt-4">
          <Text className="text-faint text-sm">Use a different email</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
