import { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuroraBackground } from './AuroraBackground';

export function Screen({
  children,
  padded = true,
}: {
  children: ReactNode;
  padded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground />
      <View style={{ flex: 1, paddingTop: insets.top }} className={padded ? 'px-4' : undefined}>
        {children}
      </View>
    </View>
  );
}
