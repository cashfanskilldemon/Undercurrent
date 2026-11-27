import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chips } from '@/components/chips';
import { EmptyView, ErrorView, FootLoading } from '@/components/feedback';
import { Logo } from '@/components/logo';
import { PostCard } from '@/components/post-card';
import { colors, space, type } from '@/constants/theme';
import { usePaged, useResource } from '@/lib/use-paged';
import type { Meta, PostItem } from '@/lib/types';
import { useBreakpoint } from '@/lib/use-breakpoint';

const DATE_LABELS: Record<string, string> = {
  today: '今天',
  '7d': '近 7 天',
  '30d': '近 30 天',
  '1y': '近一年',
};
const DATE_SPANS: Record<string, number> = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '1y': 365,
};
const KIND_LABELS: Record<string, string> = {
  text: '纯文字',
  track: '带作品',
  plugin: '带插件',
};

export default function PostsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    q?: string;
    date?: string;
    exact?: string;
    kind?: string;
    author?: string;
    tag?: string;
  }>();
  const keyword = String(params.q ?? '').trim();
  const date = String(params.date ?? '');
  const exact = params.exact === '1';
  const kind = String(params.kind ?? '');
  const authorId = Number(params.author ?? 0) || null;
  const tag = String(params.tag ?? '');
  const hasFilter = !!(keyword || date || exact || kind || authorId || tag);

  const { wide } = useBreakpoint();
  const [channel, setChannel] = useState('全部');
  const meta = useResource<Meta>('/api/meta');
  const feed = usePaged<PostItem>('/api/posts', { channel }, 10);

  // 后端暂无搜索接口：在已加载的帖子中按关键词 + 高级条件客户端过滤
  const visible = useMemo(() => {
    let list = feed.items;

    if (keyword) {
      const k = keyword.toLowerCase();
      list = list.filter((it) => {
        const fields = exact
          ? [it.body]
          : [it.body, it.author.name, it.channel, it.author.handle, ...it.tags];
        return fields.some((v) => (v ?? '').toLowerCase().includes(k));
      });
    }

    const days = DATE_SPANS[date];
    if (days) {
      const now = Date.now();
      list = list.filter((it) => {
        const t = new Date(it.createdAt).getTime();
        return !Number.isNaN(t) && now - t <= days * 86400000;
      });
    }

    if (kind) {
      list = list.filter((it) =>
        kind === 'text' ? !it.attachment?.kind : it.attachment?.kind === kind,
      );
    }

    if (authorId) list = list.filter((it) => it.author.id === authorId);
    if (tag) list = list.filter((it) => it.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));

    return list;
  }, [feed.items, keyword, exact, date, kind, authorId, tag]);

  const authorName = authorId
    ? feed.items.find((it) => it.author.id === authorId)?.author.name ?? `用户 ${authorId}`
    : '';
  const summary = [
    keyword ? `「${keyword}」` : '',
    exact ? '精确' : '',
    DATE_LABELS[date] ?? '',
    KIND_LABELS[kind] ?? '',
    authorName,
    tag ? `#${tag}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const channels = meta.data?.channels.map((c) => c.name) ?? ['全部'];

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: (wide ? 20 : insets.top + 10) }]}>
        {wide ? (
          <Text style={styles.title}>讨论</Text>
        ) : (
          <>
            <Logo size={22} />
            <Text style={styles.brand}>UNDERCURRENT</Text>
          </>
        )}
        <Text style={styles.count}>{visible.length ? `${visible.length} 条` : ''}</Text>
      </View>

      {hasFilter ? (
        <View style={styles.searchNotice}>
          <Text style={styles.searchNoticeText} numberOfLines={2}>
            {summary} · {visible.length} 条结果
          </Text>
          <Pressable onPress={() => router.replace('/')} hitSlop={6}>
            <Text style={styles.searchClear}>清除</Text>
          </Pressable>
        </View>
      ) : null}

      <Chips options={channels} value={channel} onChange={setChannel} />

      {feed.error && !feed.items.length ? (
        <ErrorView message={feed.error} onRetry={feed.refresh} />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={visible}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PostCard post={item} />}
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
          ListEmptyComponent={
            feed.loading ? undefined : <EmptyView text={hasFilter ? '没有匹配的帖子' : '这个频道还没人发帖'} />
          }
          ListFooterComponent={
            <FootLoading
              loading={feed.loadingMore}
              hasMore={!hasFilter && feed.hasMore}
              count={visible.length}
            />
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
    gap: 8,
    paddingHorizontal: space.lg,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  brand: { ...type.display, color: colors.foreground, letterSpacing: 1.2 },
  title: { ...type.display, color: colors.foreground, letterSpacing: 1.2 },
  count: { ...type.caption, color: colors.mutedForeground, marginLeft: 'auto' },
  searchNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  searchNoticeText: { ...type.small, color: colors.foreground },
  searchClear: { ...type.small, color: colors.primary, fontWeight: '600' },
});
