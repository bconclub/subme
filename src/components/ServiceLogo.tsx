import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { getCatalogService } from '@/lib/catalog';
import { colors } from '@/theme/colors';

/**
 * Service logo — real brand marks pulled live from the internet.
 * Source order: Simple Icons (crisp brand-colored SVG glyph), then the site
 * favicon (PNG), then a colored monogram. Pass `catalogId` and it resolves the
 * Simple Icons slug, domain and brand color from the catalog. Custom
 * subscriptions (no slug/domain) fall straight to the monogram.
 */

type Source = { kind: 'svg' | 'img'; uri: string };

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
  const slug = service?.slug;
  const resolvedDomain = domain ?? deriveDomain(service?.website);
  const resolvedColor = color ?? service?.logo_color ?? colors.accentDim;

  const sources: Source[] = [];
  if (slug) sources.push({ kind: 'svg', uri: `https://cdn.simpleicons.org/${slug}` });
  if (resolvedDomain)
    sources.push({
      kind: 'img',
      uri: `https://www.google.com/s2/favicons?sz=128&domain=${resolvedDomain}`,
    });

  const key = `${slug ?? ''}|${resolvedDomain ?? ''}`;
  // Advance through sources on error, scoped to this service (no effect).
  const [err, setErr] = useState<{ k: string; i: number }>({ k: '', i: 0 });
  const idx = err.k === key ? err.i : 0;
  const current = sources[idx];
  const next = () => setErr({ k: key, i: idx + 1 });

  const glyph = Math.round(size * 0.6);
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
        backgroundColor: current ? '#FFFFFF' : withAlpha(resolvedColor, 0.22),
        borderWidth: 1,
        borderColor: current ? colors.glassBorder : withAlpha(resolvedColor, 0.45),
      }}
    >
      {current?.kind === 'svg' ? (
        <SvgUri uri={current.uri} width={glyph} height={glyph} onError={next} />
      ) : current?.kind === 'img' ? (
        <Image
          source={{ uri: current.uri }}
          onError={next}
          style={{ width: glyph, height: glyph }}
          resizeMode="contain"
        />
      ) : (
        <Text
          style={{ color: resolvedColor, fontFamily: 'SpaceGrotesk_700Bold', fontSize: size * 0.38 }}
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

function withAlpha(hex: string, alpha: number): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
