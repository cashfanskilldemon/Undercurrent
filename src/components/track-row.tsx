import { Pause, Play } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { colors, hueColor, radius, space, type } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatCount, formatDuration, trackMeta } from '@/lib/format';
import type { TrackItem } from '@/lib/types';

export function TrackRow({ track }: { track: TrackItem }) {
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(track.plays);

  const toggle = useCallback(async () => {
    const next = !playing;
    setPlaying(next);
    if (next) {
      setPlays((n) => n + 1);
      try {
        await api.post(`/api/tracks/${track.id}/play`);
      } catch {
        // 计数失败不影响播放态
      }
    }
  }, [playing, track.id]);

  return (
    <View style={styles.row}>
      <Pressable onPress={toggle} style={styles.cover} hitSlop={6}>
        <View style={[styles.coverFill, { backgroundColor: hueColor(track.artist.hue, 34, 26) }]}>
          <View style={styles.coverBadge}>
            {playing ? (
              <Pause size={16} strokeWidth={2} color={colors.primaryForeground} fill={colors.primaryForeground} />
            ) : (
              <Play size={16} strokeWidth={2} color={colors.primaryForeground} fill={colors.primaryForeground} />
            )}
          </View>
        </View>
      </Pressable>

      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <View style={styles.artistRow}>
          <Avatar name={track.artist.name} hue={track.artist.hue} size={14} />
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist.name}
          </Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.artist}>{formatDuration(track.duration)}</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {trackMeta(track)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.plays}>{formatCount(plays)}</Text>
        <Text style={styles.playsLabel}>播放</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cover: { width: 52, height: 52 },
  coverFill: { flex: 1, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  coverBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  main: { flex: 1, gap: 2 },
  title: { ...type.title, color: colors.foreground },
  artistRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  artist: { ...type.small, color: colors.mutedForeground },
  dot: { ...type.caption, color: colors.mutedForeground },
  meta: { ...type.caption, color: colors.mutedForeground },
  right: { alignItems: 'flex-end' },
  plays: { ...type.num, color: colors.foreground },
  playsLabel: { ...type.caption, color: colors.mutedForeground },
});
