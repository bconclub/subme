import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { CapsuleTabBar } from '@/components/CapsuleTabBar';
import { colors } from '@/theme/colors';

type CapsuleProps = ComponentProps<typeof CapsuleTabBar>;

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
      tabBar={(props) => <CapsuleTabBar {...(props as unknown as CapsuleProps)} />}
    >
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="subscriptions" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
