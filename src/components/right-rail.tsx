import { useRouter } from 'expo-router';
import { BadgeCheck, Search, SlidersHorizontal, UserRound, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
  /** 鼠标悬停的推荐用户 id，用于弹出 ID 卡片（仅名字触发） */
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearHoverTimers = useCallback(() => {
    if (enterTimer.current) { clearTimeout(enterTimer.current); enterTimer.current = null; }
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
  }, []);
  useEffect(() => () => clearHoverTimers(), [clearHoverTimers]);
  /** 名字进入：缓冲 200ms 才显示卡片，避免扫过时乱弹 */
  const onNameEnter = useCallback((id: number) => {
    clearHoverTimers();
    enterTimer.current = setTimeout(() => { setHoveredId(id); enterTimer.current = null; }, 200);
  }, [clearHoverTimers]);
  /** 名字离开：留一点缓冲，让鼠标能移到卡片上 */
  const onNameLeave = useCallback(() => {
    clearHoverTimers();
    leaveTimer.current = setTimeout(() => { setHoveredId(null); leaveTimer.current = null; }, 180);
  }, [clearHoverTimers]);

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
        /** 只有名字（id）触发卡片，头像/关注按钮不触发 */
        const nameHoverProps =
          Platform.OS === 'web'
            ? { onMouseEnter: () => onNameEnter(p.id), onMouseLeave: onNameLeave }
            : {};
        return (
          <View
            key={p.id}
            style={[styles.personWrap, hoveredId === p.id && styles.personWrapHovered]}>
            <View style={styles.person}>
              <Avatar name={p.name} hue={p.hue} size={36} />
              <View style={{ flex: 1 }}>
                <Text
                  testID="person-name"
                  style={styles.personName}
                  numberOfLines={1}
                  {...nameHoverProps}>
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
            {hoveredId === p.id ? (
              <HoverCard
                person={p}
                followed={on}
                onToggleFollow={() => toggleFollow(p.id)}
                onMessage={() => Alert.alert('消息', '私信功能还没接，先占个位')}
                onEnter={onNameEnter.bind(null, p.id)}
                onLeave={onNameLeave}
              />
            ) : null}
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

/** 占位简介：后端 UserBrief 加 bio 字段后可替换；长短不一，卡片高度随内容自适应 */
const DEMO_BIOS: Record<string, string> = {
  'ghostwire': '录音室里长大的孩子 · 做点不太吵的鼓',
  'line9': '九号线上的采样收集者，磁带和旧电脑。',
  'nightshift404': '夜班404 · 只在凌晨两点以后发布作品',
  'ashe.mp3': '音乐人 · 重庆。做声音，也做夜色。',
  'solderdad': '焊台前的即兴，电路与鼓机一起发热。',
  'kirakyrakira': 'Kyra Ziver · ISO Supremacy.',
  'brentfaiyaz': 'ISO Supremacy.',
  'shorthordie': 'CaptainHook 🍌 I love you like you love me',
  'studiosusdog': '狗狗加密货币太多，录音棚在地下室。',
  'bobbyshmurda': 'INTERNATIONAL BODMON || || shadow banned still looking good however 😀 Independent...',
};
/** 兜底简介：按 id 取，保证每个用户都有 */
const FALLBACK_BIOS = [
  '地下电子音乐人 · 独立制作',
  '磁带、808 与深夜的灵感。',
  '在城市边缘做声音。',
  '让声音自己说话。',
];
/** 取卡片简介：优先真实 role/city，再占位，最后兜底 */
function demoBio(p: UserBrief): string {
  if (DEMO_BIOS[p.handle]) return DEMO_BIOS[p.handle];
  if (p.role && p.city) return `${p.role} · ${p.city}`;
  return FALLBACK_BIOS[p.id % FALLBACK_BIOS.length];
}

/** 推荐关注行上悬浮的 ID 卡片（参照 Threads）：头像、名字、粉丝数、关注/发消息 */
function HoverCard({
  person,
  followed,
  onToggleFollow,
  onMessage,
  onEnter,
  onLeave,
}: {
  person: UserBrief;
  followed: boolean;
  onToggleFollow: () => void;
  onMessage: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const hoverProps =
    Platform.OS === 'web' ? { onMouseEnter: onEnter, onMouseLeave: onLeave } : {};
  return (
    <View testID="user-hover-card" style={styles.hoverCard} {...hoverProps}>
      <View style={styles.hoverTop}>
        <View style={styles.hoverInfo}>
          <View style={styles.hoverNameRow}>
            <Text style={styles.hoverName} numberOfLines={1}>
              {person.name}
            </Text>
            {person.verified ? <BadgeCheck size={15} strokeWidth={2.2} color="#3897f0" /> : null}
          </View>
          <Text style={styles.hoverHandle} numberOfLines={1}>
            @{person.handle}
          </Text>
          <Text style={styles.hoverBio}>{demoBio(person)}</Text>
          <View style={styles.hoverFollowers}>
            <UserRound size={13} color={colors.mutedForeground} />
            <Text style={styles.hoverMeta}>
              {person.followers ? `${formatCount(person.followers)} 位粉丝` : '暂无粉丝'}
            </Text>
          </View>
        </View>
        <Avatar name={person.name} hue={person.hue} size={62} />
      </View>
      <View style={styles.hoverActions}>
        <Pressable
          onPress={onToggleFollow}
          style={[styles.hoverFollow, followed && styles.hoverFollowOn]}>
          <Text style={[styles.hoverFollowText, followed && styles.hoverFollowTextOn]}>
            {followed ? '已关注' : '关注'}
          </Text>
        </Pressable>
        <Pressable onPress={onMessage} style={styles.hoverMessage}>
          <Text style={styles.hoverMessageText}>发消息</Text>
        </Pressable>
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
  searchWrap: { position: 'relative', zIndex: 60, marginBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    paddingHorizontal: 12,
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
    fontSize: 13,
    color: colors.foreground,
  },
  title: { ...type.label, color: colors.foreground, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  titleGap: { ...type.label, color: colors.foreground, fontSize: 14, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  hint: { ...type.small, color: colors.mutedForeground, fontSize: 12, paddingVertical: 6 },
  /** 悬停整行（含卡片）作为定位与事件容器；悬停时抬高层级，避免卡片被后续行盖住 */
  personWrap: { position: 'relative', zIndex: 2 },
  personWrapHovered: { zIndex: 100 },
  person: { flexDirection: 'row', gap: 10, paddingVertical: 6, alignItems: 'center' },
  personName: { ...type.label, color: colors.foreground, fontSize: 13, fontWeight: '700' },
  personHandle: { ...type.small, color: colors.mutedForeground, fontSize: 11.5, marginTop: 1 },
  personMeta: { ...type.caption, color: colors.mutedForeground, fontSize: 11, marginTop: 1 },
  followBtn: {
    minWidth: 50,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnOn: { backgroundColor: colors.elevated, borderColor: colors.border },
  followText: { ...type.small, color: colors.foreground, fontSize: 11.5, fontWeight: '600' },
  followTextOn: { color: colors.mutedForeground, fontWeight: '400' },
  track: { flexDirection: 'row', gap: 8, paddingVertical: 6, alignItems: 'center' },
  rank: { ...type.num, color: colors.mutedForeground, fontSize: 11.5 },
  rankHot: { color: colors.primary, fontWeight: '600' },
  trackTitle: { ...type.label, color: colors.foreground, fontSize: 13 },
  trackMeta: { ...type.caption, color: colors.mutedForeground, fontSize: 11, marginTop: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    ...type.small,
    color: colors.mutedForeground,
    fontSize: 11.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  tagCount: { ...type.caption, color: colors.mutedForeground, fontSize: 10.5 },

  /** 悬停 ID 卡片：从名字下方展开（盖住 handle/粉丝数行），宽度超出右栏往左延伸 */
  hoverCard: {
    position: 'absolute',
    top: 22,
    right: 0,
    width: 340,
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 14,
    zIndex: 10,
  },
  hoverTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  hoverInfo: { flex: 1, gap: 3, paddingTop: 2 },
  hoverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hoverName: { fontSize: 16, fontWeight: '700', color: colors.strong },
  hoverHandle: { fontSize: 13, color: colors.mutedForeground },
  /** 简介不限制行数，卡片高度随内容自适应 */
  hoverBio: { fontSize: 13, color: colors.foreground, lineHeight: 18, marginTop: 4, flexShrink: 1 },
  hoverFollowers: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  hoverMeta: { fontSize: 13, color: colors.mutedForeground },
  hoverActions: { flexDirection: 'row', gap: 8 },
  /** 黑白风按钮：关注黑底白字、发消息白底黑字，不随主题 */
  hoverFollow: {
    flex: 1,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoverFollowOn: { backgroundColor: '#ffffff', borderWidth: StyleSheet.hairlineWidth, borderColor: '#cfcfcf' },
  hoverFollowText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  hoverFollowTextOn: { color: '#0a0a0a' },
  hoverMessage: {
    flex: 1,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#cfcfcf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoverMessageText: { fontSize: 12, fontWeight: '600', color: '#0a0a0a' },
  about: {
    marginTop: 20,
    padding: space.sm + 4,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 5,
  },
  aboutTitle: { ...type.caption, color: colors.primary, letterSpacing: 1, fontSize: 11 },
  aboutText: { ...type.small, color: colors.mutedForeground, fontSize: 11.5, lineHeight: 18 },
});
