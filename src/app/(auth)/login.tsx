import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { colors } from '@/theme/colors';

/**
 * Email-OTP sign-in. Active once the Supabase project is provisioned and
 * EXPO_PUBLIC_SUPABASE_* env vars are set; until then the router never lands
 * here (local mode). Google sign-in via expo-auth-session follows the backend.
 */
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    const addr = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(addr)) {
      Alert.alert('Check the email', 'That address doesn’t look right.');
      return;
    }
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Offline build',
        'This build runs fully on-device - no account needed yet. Sign-in arrives with cloud sync.',
      );
      return;
    }
    setBusy(true);
    try {
      const { error } = await getSupabase().auth.signInWithOtp({ email: addr });
      if (error) throw error;
      router.push({ pathname: '/(auth)/otp', params: { email: addr } });
    } catch (e) {
      Alert.alert('Could not send code', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <View className="w-14 h-14 rounded-2xl bg-accent items-center justify-center mb-6">
          <Ionicons name="wallet-outline" size={28} color={colors.bg} />
        </View>
        <Text className="text-ink text-3xl font-bold font-display">Sign in to Subme</Text>
        <Text className="text-muted text-sm mt-2 leading-5">
          No passwords. We email you a 6-digit code.
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={colors.faint}
          className="bg-card border border-border rounded-xl px-4 py-3.5 text-ink mt-6"
        />
        <TouchableOpacity
          onPress={sendOtp}
          disabled={busy}
          className={`rounded-full py-4 items-center mt-4 ${busy ? 'bg-accent/50' : 'bg-accent'}`}
        >
          <Text className="text-bg font-bold">{busy ? 'Sending…' : 'Email me a code'}</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
