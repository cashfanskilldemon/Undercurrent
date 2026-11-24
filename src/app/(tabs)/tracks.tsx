import { useFocusEffect } from 'expo-router';
import { Upload } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chips } from '@/components/chips';
import { EmptyView, ErrorView, FootLoading } from '@/components/feedback';
import { TrackRow } from '@/components/track-row';
import { colors, radius, space, type } from '@/constants/theme';
import { useComposer } from '@/lib/composer';
import { useRefreshSeq } from '@/lib/refresh';
import type { Meta, TrackItem } from '@/lib/types';
import { usePaged, useResource } from '@/lib/use-paged';
import { useBreakpoint } from '@/lib/use-breakpoint';

const SORTS = [
  { key: 'latest', label: '最新' },
  { key: 'plays', label: '播放' },
  { key: 'likes', label: '点赞' },
] as const;

export default function TracksScreen() {
  const insets = useSafeAreaInsets();
  const { wide } = useBreakpoint();
  const { openComposer } = useComposer();
  const [genre, setGenre] = useState('全部');
  const [sort, setSort] = useState<string>('latest');
  const meta = useResource<Meta>('/api/meta');
  const feed = usePaged<TrackItem>('/api/tracks', { genre, sort }, 10);
  const refreshSeq = useRefreshSeq();

  useFocusEffect(useCallback(() => { feed.refresh(); }, [refreshSeq]));

  const genres = meta.data?.genres ?? [];

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: wide ? 20 : insets.top + 10 }]}>
        <Text style={styles.title}>作品</Text>
        <View style={styles.headerRight}>
          <View style={styles.segment}>
            {SORTS.map((s) => {
              const active = s.key === sort;
              return (
                <Pressable key={s.key} onPress={() => setSort(s.key)} hitSlop={4}>
                  <Text style={[styles.segmentText, active && styles.segmentActive]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={() => openComposer('upload')} style={styles.uploadBtn} hitSlop={4}>
            <Upload size={15} color={colors.primaryForeground} />
            <Text style={styles.uploadText}>上传</Text>
          </Pressable>
        </View>
      </View>

      <Chips options={genres} value={genre} onChange={setGenre} />

      {feed.error && !feed.items.length ? (
        <ErrorView message={feed.error} onRetry={feed.refresh} />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={feed.items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <TrackRow track={item} />}
          onEndReached={feed.loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={feed.refreshing}
              onRefresh={feed.refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.elevated}
            />
          }
          ListHeaderComponent={
            feed.items[0] ? (
              <View style={styles.featured}>
                <Text style={styles.featuredLabel}>最热</Text>
                <Text style={styles.featuredTitle} numberOfLines={1}>
                  {feed.items[0].title}
                </Text>
                <Text style={styles.featuredBlurb} numberOfLines={2}>
                  {feed.items[0].blurb ?? ''}
                </Text>
              </View>
            ) : undefined
          }
          ListEmptyComponent={feed.loading ? undefined : <EmptyView text="这个流派还没有作品" />}
          ListFooterComponent={
            <FootLoading loading={feed.loadingMore} hasMore={feed.hasMore} count={feed.items.length} />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { ...type.display, color: colors.foreground, letterSpacing: 1.2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16, marginLeft: 'auto' },
  segment: { flexDirection: 'row', gap: 16 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 30, paddingHorizontal: 12, borderRadius: radius.full, backgroundColor: colors.primary },
  uploadText: { fontSize: 12, fontWeight: '700', color: colors.primaryForeground },
  segmentText: { ...type.small, color: colors.mutedForeground },
  segmentActive: { color: colors.primary, fontWeight: '600' },
  featured: {
    margin: space.lg,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  featuredLabel: { ...type.caption, color: colors.primary, letterSpacing: 1 },
  featuredTitle: { ...type.title, color: colors.foreground, marginTop: 2 },
  featuredBlurb: { ...type.small, color: colors.mutedForeground, marginTop: 2 },
});
