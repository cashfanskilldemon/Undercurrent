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

/** 卡片收起动画时长，与外观菜单的 CLOSE_MS 保持一致 */
const CARD_EXIT_MS = 180;

/** 宽屏 Web 的右侧推荐栏（≥1120px）：搜索、推荐关注、热门作品、标签 */
export function RightRail() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [criteria, setCriteria] = useState<AdvancedCriteria>(EMPTY_CRITERIA);
  const [followed, setFollowed] = useState<number[]>([]);
  /** 鼠标悬停的推荐用户 id，用于弹出 ID 卡片（仅名字触发） */
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  /** 卡片收起中：先播退出动画，动画结束才真正卸载（与菜单的 180ms 一致） */
  const [cardClosing, setCardClosing] = useState(false);
  /** 换 key 让卡片重新挂载，CSS 弹出动画才会从头播放 */
  const [cardSeq, setCardSeq] = useState(0);
  /** 当前已完整显示的卡片所属用户；收起时清空，便于重新弹出 */
  const shownId = useRef<number | null>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearHoverTimers = useCallback(() => {
    if (enterTimer.current) { clearTimeout(enterTimer.current); enterTimer.current = null; }
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
    if (exitTimer.current) { clearTimeout(exitTimer.current); exitTimer.current = null; }
  }, []);
  useEffect(() => () => clearHoverTimers(), [clearHoverTimers]);
  /** 名字进入：缓冲 200ms 才显示卡片，避免扫过时乱弹；收起过程中进入则取消收起 */
  const onNameEnter = useCallback((id: number) => {
    clearHoverTimers();
    setCardClosing(false);
    enterTimer.current = setTimeout(() => {
      enterTimer.current = null;
      setHoveredId(id);
      // 卡片不是这个用户已展开的状态时才重播弹出动画，避免鼠标在卡片上反复重挂载
      if (shownId.current !== id) {
        shownId.current = id;
        setCardSeq((n) => n + 1);
      }
    }, 200);
  }, [clearHoverTimers]);
  /** 名字离开：留一点缓冲让鼠标能移到卡片上，之后播放收起动画再卸载 */
  const onNameLeave = useCallback(() => {
    clearHoverTimers();
    leaveTimer.current = setTimeout(() => {
      leaveTimer.current = null;
      setCardClosing(true);
      shownId.current = null;
      exitTimer.current = setTimeout(() => {
        setHoveredId(null);
        setCardClosing(false);
        exitTimer.current = null;
      }, CARD_EXIT_MS);
    }, 180);
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
                <Text style={styles.personBio} numberOfLines={2}>
                  {demoBioList(p)}
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
                key={cardSeq}
                person={p}
                followed={on}
                closing={cardClosing}
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

/** 卡片里的英文显示名（列表仍用数据库昵称）；后端 UserBrief 加 displayName 后可替换 */
const DEMO_NAMES: Record<string, string> = {
  'ghostwire': 'Ghostwire',
  'line9': 'Line 9',
  'nightshift404': 'Nightshift 404',
  'ashe.mp3': 'Ashe',
  'solderdad': 'Solderdad',
  'kirakyrakira': 'Kyra',
  'brentfaiyaz': 'Brent Faiyaz',
  'shorthordie': 'Shorthordie',
  'studiosusdog': 'Studio Sus',
  'bobbyshmurda': 'Bobby Shmurda',
};
/** 占位简介（英文）：后端 UserBrief 加 bio 字段后可替换；长短不一，卡片高度随内容自适应 */
const DEMO_BIOS: Record<string, string> = {
  'ghostwire': "Raised in the studio, making beats that don't scream.",
  'line9': 'Sampling collector on Line 9 — tapes and old machines.',
  'nightshift404': 'Nightshift 404 · releasing tracks only after 2 a.m.',
  'ashe.mp3': 'Musician · Chongqing. Making sound and making night.',
  'solderdad': 'Improvisation at the bench — circuits and drum machines.',
  'kirakyrakira': 'Kyra Ziver · ISO Supremacy.',
  'brentfaiyaz': 'ISO Supremacy.',
  'shorthordie': 'CaptainHook 🍌 I love you like you love me',
  'studiosusdog': 'Too much dogecoin, studio in the basement.',
  'bobbyshmurda': 'INTERNATIONAL BODMON || || shadow banned still looking good however 😀 Independent...',
};
/** 兜底简介：按 id 取，保证每个用户都有 */
const FALLBACK_BIOS = [
  'Underground electronic artist · independent producer.',
  'Tapes, 808s and late-night inspiration.',
  'Making sound from the edge of the city.',
  'Let the music speak for itself.',
];
/** 列表行简介：中英混排、长短不一（参照 Threads），后端 UserBrief 加 bio 字段后可替换 */
const DEMO_BIOS_LIST: Record<string, string> = {
  'ghostwire': 'Making sound and making night.',
  'line9': '九号线上的采样收集者，磁带和旧电脑。',
  'nightshift404': '夜班404 · only after 2 a.m.',
  'ashe.mp3': '音乐人 · 重庆。',
  'solderdad': '焊台前的即兴，电路与鼓机一起发热。Circuit bender & drum machine lover.',
  'kirakyrakira': 'Kyra Ziver · ISO Supremacy.',
  'brentfaiyaz': 'ISO Supremacy.',
  'shorthordie': 'CaptainHook 🍌 I love you like you love me',
  'studiosusdog': '录音棚在地下室，狗狗加密货币太多。',
  'bobbyshmurda': 'INTERNATIONAL BODMON || shadow banned but still looking good 😀',
};
/** 列表简介：优先占位，再 role/city，最后兜底 */
function demoBioList(p: UserBrief): string {
  if (DEMO_BIOS_LIST[p.handle]) return DEMO_BIOS_LIST[p.handle];
  if (p.role && p.city) return `${p.role} · ${p.city}`;
  return 'Underground sounds. 在地下做声音。';
}

/** 卡片显示名：优先英文占位，否则用 handle 首字母大写 */
function demoName(p: UserBrief): string {
  return DEMO_NAMES[p.handle] ?? p.handle.replace(/(^|_)(\w)/g, (_, __, c: string) => c.toUpperCase());
}
/** 卡片简介：优先占位，最后兜底（全英文） */
function demoBio(p: UserBrief): string {
  if (DEMO_BIOS[p.handle]) return DEMO_BIOS[p.handle];
  return FALLBACK_BIOS[p.id % FALLBACK_BIOS.length];
}

/** 推荐关注行上悬浮的 ID 卡片（参照 Threads）：头像、名字、粉丝数、关注/发消息 */
function HoverCard({
  person,
  followed,
  closing,
  onToggleFollow,
  onMessage,
  onEnter,
  onLeave,
}: {
  person: UserBrief;
  followed: boolean;
  /** 收起中：换 testID 触发 CSS 退出动画，动画期间不再响应鼠标 */
  closing: boolean;
  onToggleFollow: () => void;
  onMessage: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const hoverProps =
    Platform.OS === 'web' ? { onMouseEnter: onEnter, onMouseLeave: onLeave } : {};
  return (
    <View
      testID={closing ? 'user-hover-card-closing' : 'user-hover-card'}
      style={styles.hoverCard}
      {...hoverProps}>
      <View style={styles.hoverTop}>
        <View style={styles.hoverInfo}>
          <View style={styles.hoverNameRow}>
            <Text style={styles.hoverName} numberOfLines={1}>
              {demoName(person)}
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
        <Avatar name={demoName(person)} hue={person.hue} size={62} />
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
    /** 右侧留白，关注按钮不贴边（参照 Threads） */
    paddingRight: 22,
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
  /** 头像与名称/账号顶部对齐（参照 Threads），不随简介多行而垂直居中 */
  person: { flexDirection: 'row', gap: 10, paddingVertical: 6, alignItems: 'flex-start' },
  personName: { ...type.label, color: colors.foreground, fontSize: 13, fontWeight: '700' },
  personHandle: { ...type.small, color: colors.mutedForeground, fontSize: 11.5, marginTop: 1 },
  /** 列表行简介：最多两行，参照 Threads 推荐关注 */
  personBio: { ...type.small, color: colors.foreground, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  personMeta: { ...type.caption, color: colors.mutedForeground, fontSize: 11, marginTop: 3 },
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

  /** 悬停 ID 卡片：从名字下方展开（盖住 handle/粉丝数行），右侧留白避免贴边 */
  hoverCard: {
    position: 'absolute',
    top: 22,
    /** 栏 paddingRight 加大后，卡片 right 相应减小以保持离页面右边不变 */
    right: -2,
    width: 340,
    padding: 22,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 18,
    zIndex: 10,
  },
  hoverTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  /** 名字/handle/简介/粉丝数之间留白，卡片更高更舒展 */
  hoverInfo: { flex: 1, gap: 10, paddingTop: 2 },
  hoverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hoverName: { fontSize: 17, fontWeight: '700', color: colors.strong },
  hoverHandle: { fontSize: 13, color: colors.mutedForeground },
  /** 简介不限制行数，卡片高度随内容自适应 */
  hoverBio: { fontSize: 13, color: colors.foreground, lineHeight: 19, marginTop: 4, flexShrink: 1 },
  hoverFollowers: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  hoverMeta: { fontSize: 13, color: colors.mutedForeground },
  hoverActions: { flexDirection: 'row', gap: 8 },
  /** 黑白风按钮：关注黑底白字、发消息白底黑字，不随主题 */
  hoverFollow: {
    flex: 1,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.hoverFollowBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hoverFollowBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoverFollowOn: {
    backgroundColor: colors.hoverFollowOnBg,
    borderColor: colors.hoverFollowOnBorder,
  },
  hoverFollowText: { fontSize: 12, fontWeight: '700', color: colors.hoverFollowFg },
  hoverFollowTextOn: { color: colors.hoverFollowOnFg },
  hoverMessage: {
    flex: 1,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.hoverMessageBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hoverMessageBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoverMessageText: { fontSize: 12, fontWeight: '600', color: colors.hoverMessageFg },
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
