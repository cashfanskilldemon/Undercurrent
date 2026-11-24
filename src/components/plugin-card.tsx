import { Star } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, hueColor, radius, space, type } from '@/constants/theme';
import { formatCount, formatPrice } from '@/lib/format';
import type { PluginItem } from '@/lib/types';

export function PluginCard({ plugin }: { plugin: PluginItem }) {
  const knobs = Math.min(plugin.knobs || 0, 6);
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.panel, { backgroundColor: hueColor(plugin.hue, 30, 22) }]}>
        <View style={styles.knobs}>
          {Array.from({ length: knobs }).map((_, i) => (
            <View
              key={i}
              style={[styles.knob, { backgroundColor: hueColor(plugin.hue, 45, 46) }]}
            />
          ))}
        </View>
        <Text style={styles.formats} numberOfLines={1}>
          {plugin.formats.join(' · ')}
        </Text>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {plugin.name}
      </Text>
      <Text style={styles.maker} numberOfLines={1}>
        {plugin.maker.name}
        {plugin.category ? ` · ${plugin.category}` : ''}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.price}>{formatPrice(plugin.price)}</Text>
        <View style={styles.rating}>
          <Star size={11} strokeWidth={2} color={colors.primary} fill={colors.primary} />
          <Text style={styles.ratingText}>{plugin.rating.toFixed(1)}</Text>
          <Text style={styles.downloads}>· {formatCount(plugin.downloads)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 10,
    gap: 6,
  },
  pressed: { opacity: 0.75 },
  panel: {
    height: 84,
    borderRadius: radius.md,
    padding: 10,
    justifyContent: 'space-between',
  },
  knobs: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  knob: { width: 10, height: 10, borderRadius: 5 },
  formats: { ...type.caption, color: colors.mutedForeground },
  name: { ...type.label, color: colors.foreground, marginTop: 2 },
  maker: { ...type.caption, color: colors.mutedForeground },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  price: { ...type.label, color: colors.primary },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  ratingText: { ...type.caption, color: colors.foreground },
  downloads: { ...type.caption, color: colors.mutedForeground },
});
