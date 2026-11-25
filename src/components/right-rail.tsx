import { useRouter } from 'expo-router';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AdvancedSearch, EMPTY_CRITERIA, type AdvancedCriteria } from '@/components/advanced-search';
import { Avatar } from '@/components/avatar';
import { colors, radius, space, type } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatCount } from '@/lib/format';
import type { Meta, ThreadItem, TrackItem, UserBrief } from '@/lib/types';
import { RAIL_WIDTH } from '@/lib/use-breakpoint';
import { usePaged, useResource } from '@/lib/use-paged';

/** 宽屏 Web 的右侧推荐栏（≥1120px）：搜索、推荐关注、热门作品、标签 */
export function RightRail() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [criteria, setCriteria] = useState<AdvancedCriteria>(EMPTY_CRITERIA);
  const [followed, setFollowed] = useState<number[]>([]);

  const top = usePaged<TrackItem>('/api/tracks', { sort: 'plays' }, 5);
  const meta = useResource<Meta>('/api/meta');
  // 没有用户推荐接口，取帖子流的前几位不同作者作推荐
  const feed = usePaged<ThreadItem>('/api/threads', {}, 10);

  const people = useMemo(() => {
    const seen = new Set<number>();
    const out: UserBrief[] = [];
    for (const t of feed.items) {
      if (seen.has(t.author.id)) continue;
      seen.add(t.author.id);
      out.push(t.author);
      if (out.length === 5) break;
    }
    return out;
  }, [feed.items]);

  // RN 的 URL polyfill 对 URLSearchParams 支持不全，这里手拼查询串
  const buildSearchUrl = (q: string, c: AdvancedCriteria) => {
    const parts: string[] = [];
    if (q) parts.push(`q=${encodeURIComponent(q)}`);
    if (c.date) parts.push(`date=${encodeURIComponent(c.date)}`);
    if (c.exact) parts.push('exact=1');
    if (c.kind) parts.push(`kind=${encodeURIComponent(c.kind)}`);
    if (c.author) parts.push(`author=${c.author}`);
    if (c.tag) parts.push(`tag=${encodeURIComponent(c.tag)}`);
    return parts.length ? `/?${parts.join('&')}` : '/';
  };

  const submit = () => router.push(buildSearchUrl(query.trim(), criteria));

  const applyAdvanced = (c: AdvancedCriteria) => {
    setCriteria(c);
    setShowAdvanced(false);
    router.push(buildSearchUrl(query.trim(), c));
  };

  const toggleFollow = async (id: number) => {
    const wasFollowing = followed.includes(id);
    // 乐观更新：先切 UI，失败回滚
    setFollowed((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    try {
      const r = await api.post<{ followed: boolean }>(`/api/users/${id}/follow`);
      setFollowed((prev) => (r.followed ? [...new Set([...prev, id])] : prev.filter((v) => v !== id)));
    } catch {
      setFollowed((prev) => (wasFollowing ? [...new Set([...prev, id])] : prev.filter((v) => v !== id)));
    }
  };

  return (
    <View style={styles.rail}>
      {/* 搜索：回车跳到讨论页过滤；右侧筛选图标展开高级搜索 */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Search size={18} strokeWidth={1.9} color={colors.mutedForeground} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            returnKeyType="search"
            placeholder="搜索"
            placeholderTextColor={colors.mutedForeground}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={6}>
              <X size={14} strokeWidth={2} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => setShowAdvanced((v) => !v)} hitSlop={8} style={styles.filterBtn}>
            <SlidersHorizontal
              size={18}
              strokeWidth={1.8}
              color={showAdvanced ? colors.primary : colors.mutedForeground}
            />
          </Pressable>
        </View>

        {showAdvanced ? (
          <AdvancedSearch
            people={people}
            tags={meta.data?.tags ?? []}
            initial={criteria}
            onApply={applyAdvanced}
            onClose={() => setShowAdvanced(false)}
          />
        ) : null}
      </View>

      <Text style={styles.title}>推荐关注</Text>
      {feed.loading && !people.length ? (
        <Text style={styles.hint}>加载中…</Text>
      ) : null}
      {people.map((p) => {
        const on = followed.includes(p.id);
        return (
          <View key={p.id} style={styles.person}>
            <Avatar name={p.name} hue={p.hue} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.personName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.personHandle} numberOfLines={1}>
                @{p.handle}
              </Text>
              <Text style={styles.personMeta} numberOfLines={1}>
                {p.followers ? `${formatCount(p.followers)} 位粉丝` : '暂无粉丝'}
              </Text>
            </View>
            <Pressable
              onPress={() => toggleFollow(p.id)}
              hitSlop={4}
              style={[styles.followBtn, on && styles.followBtnOn]}>
              <Text style={[styles.followText, on && styles.followTextOn]}>{on ? '已关注' : '关注'}</Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={styles.titleGap}>热门作品</Text>
      {top.loading ? <Text style={styles.hint}>加载中…</Text> : null}
      {top.error ? <Text style={styles.hint}>{top.error}</Text> : null}
      {top.items.map((t, i) => (
        <View key={t.id} style={styles.track}>
          <Text style={[styles.rank, i < 3 && styles.rankHot]}>{String(i + 1).padStart(2, '0')}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {t.title}
            </Text>
            <Text style={styles.trackMeta} numberOfLines={1}>
              {t.artist.name} · {formatCount(t.plays)} 次播放
            </Text>
          </View>
        </View>
      ))}

      {meta.data?.tags.length ? (
        <>
          <Text style={styles.titleGap}>热门标签</Text>
          <View style={styles.tags}>
            {meta.data.tags.slice(0, 8).map((t) => (
              <Text key={t.tag} style={styles.tag}>
                #{t.tag} <Text style={styles.tagCount}>{formatCount(t.posts)}</Text>
              </Text>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.about}>
        <Text style={styles.aboutTitle}>关于 UNDERCURRENT</Text>
        <Text style={styles.aboutText}>
          三条波纹之下，是还没被算法收录的声音。地下电子音乐人的作品、工具与日常。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: RAIL_WIDTH,
    flexShrink: 0,
    paddingTop: 24,
    paddingBottom: 20,
    paddingLeft: 16,
    /** 右侧内边距更小，整栏视觉再往右贴一点 */
    paddingRight: 8,
    backgroundColor: colors.background,
  },
  searchWrap: { position: 'relative', zIndex: 60, marginBottom: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: colors.input,
  },
  filterBtn: {
    paddingLeft: 10,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.borderStrong,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 15,
    color: colors.foreground,
  },
  title: { ...type.label, color: colors.foreground, fontSize: 17, fontWeight: '700', marginBottom: 10 },
  titleGap: { ...type.label, color: colors.foreground, fontSize: 17, fontWeight: '700', marginTop: space.xl, marginBottom: 10 },
  hint: { ...type.small, color: colors.mutedForeground, fontSize: 14, paddingVertical: 8 },
  person: { flexDirection: 'row', gap: 12, paddingVertical: 8, alignItems: 'center' },
  personName: { ...type.label, color: colors.foreground, fontSize: 16, fontWeight: '700' },
  personHandle: { ...type.small, color: colors.mutedForeground, fontSize: 14, marginTop: 1 },
  personMeta: { ...type.caption, color: colors.mutedForeground, fontSize: 14, marginTop: 2 },
  followBtn: {
    minWidth: 62,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnOn: { backgroundColor: colors.elevated, borderColor: colors.border },
  followText: { ...type.small, color: colors.foreground, fontSize: 14, fontWeight: '600' },
  followTextOn: { color: colors.mutedForeground, fontWeight: '400' },
  track: { flexDirection: 'row', gap: 10, paddingVertical: 9, alignItems: 'center' },
  rank: { ...type.num, color: colors.mutedForeground, fontSize: 13.5 },
  rankHot: { color: colors.primary, fontWeight: '600' },
  trackTitle: { ...type.label, color: colors.foreground, fontSize: 16 },
  trackMeta: { ...type.caption, color: colors.mutedForeground, fontSize: 14, marginTop: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    ...type.small,
    color: colors.mutedForeground,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  tagCount: { ...type.caption, color: colors.mutedForeground, fontSize: 12 },
  about: {
    marginTop: space.xl,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 6,
  },
  aboutTitle: { ...type.caption, color: colors.primary, letterSpacing: 1, fontSize: 12.5 },
  aboutText: { ...type.small, color: colors.mutedForeground, fontSize: 14, lineHeight: 22 },
});
