import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { getCatalogService } from '@/lib/catalog';
import { colors } from '@/theme/colors';

/**
 * Service logo — shows the real brand mark with graceful fallback.
 * Tries the brand's favicon (Google's icon service, by domain), then falls
 * back to a colored monogram of the first letter. Pass `catalogId` and it
 * resolves the domain + brand color from the catalog automatically; or pass
 * `domain` / `color` directly (custom subscriptions have neither → monogram).
 */
export function ServiceLogo({
  name,
  catalogId,
  domain,
  color,
  size = 44,
}: {
  name: string;
  catalogId?: string | null;
  domain?: string;
  color?: string;
  size?: number;
}) {
  const service = catalogId ? getCatalogService(catalogId) : undefined;
  const resolvedDomain = domain ?? deriveDomain(service?.website);
  const resolvedColor = color ?? service?.logo_color ?? colors.accentDim;

  // Track which domain failed to load, so changing service retries the new one
  // without a state-resetting effect.
  const [failedDomain, setFailedDomain] = useState<string | null>(null);

  const showImg = !!resolvedDomain && failedDomain !== resolvedDomain;
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3.6,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: showImg ? 'rgba(255,255,255,0.06)' : withAlpha(resolvedColor, 0.22),
        borderWidth: 1,
        borderColor: showImg ? colors.glassBorder : withAlpha(resolvedColor, 0.45),
      }}
    >
      {showImg ? (
        <Image
          source={{ uri: `https://www.google.com/s2/favicons?sz=128&domain=${resolvedDomain}` }}
          onError={() => setFailedDomain(resolvedDomain ?? null)}
          style={{ width: Math.round(size * 0.56), height: Math.round(size * 0.56) }}
          resizeMode="contain"
        />
      ) : (
        <Text
          style={{
            color: resolvedColor,
            fontFamily: 'SpaceGrotesk_700Bold',
            fontSize: size * 0.38,
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

function deriveDomain(website?: string): string | undefined {
  if (!website) return undefined;
  try {
    return new URL(website).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/** Hex (#RRGGBB) → rgba string with the given alpha. */
function withAlpha(hex: string, alpha: number): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
