import { useRouter } from 'expo-router';
import {
  Blocks,
  Check,
  ChevronLeft,
  Headphones,
  Music2,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/avatar';
import { BubbleCloud } from '@/components/bubble-cloud';
import { colors, radius, type } from '@/constants/theme';
import { api } from '@/lib/api';
import { useBreakpoint } from '@/lib/use-breakpoint';
import type {
  GenreGroup,
  OnboardingData,
  OnboardingPayload,
  UserProfile,
} from '@/lib/types';

/** 注册后的第一个环节：风格 → 艺人 → 身份 → 年龄 → 城市 */
const STEPS = ['风格', '艺人', '身份', '年龄', '城市'] as const;

/** 最多能选几个流派（后端同值校验） */
const MAX_GENRES = 12;

/** 身份选项的说明文案与图标（后端只存名字） */
const ROLE_DESC: Record<string, string> = {
  听众: '来听歌、聊歌、蹲现场',
  制作人: '做 beat、编曲、混音',
  音乐人: '发作品、演出、跑现场',
  插件作者: '做插件、卖预设',
};

function RoleIcon({ role, color }: { role: string; color: string }) {
  if (role === '制作人') return <SlidersHorizontal size={18} strokeWidth={1.8} color={color} />;
  if (role === '音乐人') return <Music2 size={18} strokeWidth={1.8} color={color} />;
  if (role === '插件作者') return <Blocks size={18} strokeWidth={1.8} color={color} />;
  return <Headphones size={18} strokeWidth={1.8} color={color} />;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { wide, width } = useBreakpoint();
  /** 宽屏头部：标题在左、分类在右；窗口不够宽时改为上下堆叠 */
  const stacked = width < 1180;
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  /** 宽屏泡泡云的分类筛选：null = 全部 */
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);

  // 选择状态：页面加载时用后端的已选内容回填，刷新后进度不丢
  const [genres, setGenres] = useState<string[]>([]);
  const [artistIds, setArtistIds] = useState<number[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<OnboardingData>('/api/onboarding');
      setData(res);
      setGenres(res.selectedGenres ?? []);
      setArtistIds(res.selectedArtistIds ?? []);
      setRole(res.currentRole ?? null);
      setAgeGroup(res.currentAgeGroup ?? null);
      setCity(res.currentCity ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = <T,>(list: T[], value: T, setList: (next: T[]) => void) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  /** 流派选项：到上限就只提示，不静默丢弃 */
  const toggleGenre = (name: string) => {
    if (genres.includes(name)) {
      setGenres(genres.filter((g) => g !== name));
      setLimitHit(false);
      return;
    }
    if (genres.length >= MAX_GENRES) {
      setLimitHit(true);
      return;
    }
    setGenres([...genres, name]);
    setLimitHit(false);
  };

  useEffect(() => {
    if (!limitHit) return;
    const timer = setTimeout(() => setLimitHit(false), 1600);
    return () => clearTimeout(timer);
  }, [limitHit]);

  const submit = async (skipped: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: OnboardingPayload = skipped
        ? { skipped: true, genres: [], artistIds: [] }
        : {
            genres,
            artistIds,
            role,
            ageGroup,
            city,
          };
      await api.post<OnboardingData>('/api/onboarding', payload);
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败，请重试');
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    submit(false);
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.foreground} />
        <Text style={styles.loadingText}>正在准备你的首页…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.error}>{error ?? '加载失败'}</Text>
        <Pressable onPress={load} style={styles.retry}>
          <Text style={styles.retryText}>重试</Text>
        </Pressable>
      </View>
    );
  }

  const last = step === STEPS.length - 1;
  /** 宽屏第一步用泡泡云，窄屏仍用 chips 列表 */
  const bubbleMode = wide && step === 0;
  const groups: GenreGroup[] = data.genreGroups?.length
    ? data.genreGroups
    : [{ category: '全部', genres: data.genres }];

  const head = (
    <>
      {/* 顶部：品牌 + 步骤 + 跳过 */}
      <View style={styles.topBar}>
        <Text style={styles.brand}>UNDERCURRENT</Text>
        <View style={styles.topRight}>
          <Text style={styles.stepIndex}>
            第 {step + 1} 步 / 共 {STEPS.length} 步
          </Text>
          <Pressable onPress={() => submit(true)} disabled={submitting} hitSlop={8}>
            <Text style={styles.skip}>跳过</Text>
          </Pressable>
        </View>
      </View>

      {/* 进度 */}
      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.progressBar, i <= step && styles.progressBarOn]} />
        ))}
      </View>
    </>
  );

  /** 分类筛选行（宽窄屏共用；宽屏右栏里右对齐） */
  const categoryRow = (extra?: object) =>
    data.genreGroups?.length ? (
      <View style={[styles.categories, extra]}>
        {[null, ...data.genreGroups.map((g) => g.category)].map((c) => {
          const on = activeCategory === c;
          return (
            <Pressable
              key={c ?? '__all__'}
              onPress={() => setActiveCategory(c)}
              style={[styles.catChip, on && styles.catChipOn]}>
              <Text style={[styles.catText, on && styles.catTextOn]}>{c ?? '全部'}</Text>
            </Pressable>
          );
        })}
      </View>
    ) : null;

  /** 已选汇总：分类过滤时也能看到/取消别的分类里选过的 */
  const selectedTally = genres.length ? (
    <View style={styles.selectedRow}>
      <Text style={styles.selectedLabel}>已选</Text>
      {genres.map((g) => (
        <Pressable key={g} onPress={() => toggleGenre(g)} style={styles.selectedChip}>
          <Text style={styles.selectedText}>{g}</Text>
          <X size={11} strokeWidth={2.4} color={colors.mutedForeground} />
        </Pressable>
      ))}
    </View>
  ) : null;

  return (
    <View style={styles.screen}>
      {bubbleMode ? (
        <>
          <View style={styles.bubbleScreen}>
            {head}

            {/* 标题在左、分类在右：把横向空间用起来，纵向留给泡泡 */}
            <View style={[styles.bubbleHead, stacked && styles.bubbleHeadStack]}>
              <View style={styles.bubbleTitleWrap}>
                <Text style={styles.heroTitle}>你喜欢什么声音？</Text>
                <Text style={styles.heroSub}>
                  挑出你常听的流派，我们按口味给你推帖子和作品
                </Text>
              </View>

              <View style={[styles.bubbleHeadRight, stacked && styles.bubbleHeadRightStack]}>
                <Text style={[styles.counter, limitHit && styles.counterWarn]}>
                  {limitHit ? `最多选 ${MAX_GENRES} 个` : `${genres.length} / ${MAX_GENRES}`}
                </Text>
                {categoryRow(stacked ? undefined : styles.categoriesRight)}
              </View>
            </View>

            <View style={styles.cloudWrap}>
              <BubbleCloud
                groups={groups}
                selected={genres}
                max={MAX_GENRES}
                activeCategory={activeCategory}
                onToggle={toggleGenre}
              />
            </View>
          </View>

          {/* 底部工具条：左边展示已选，右边继续 */}
          <View style={styles.toolbar}>
            <View style={styles.tally}>
              {error ? (
                <Text style={styles.tallyError}>{error}</Text>
              ) : genres.length ? (
                <>
                  <Text style={styles.selectedLabel}>已选 {genres.length}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.tallyScroll}
                    contentContainerStyle={styles.tallyChips}>
                    {genres.map((g) => (
                      <Pressable key={g} onPress={() => toggleGenre(g)} style={styles.selectedChip}>
                        <Text style={styles.selectedText}>{g}</Text>
                        <X size={11} strokeWidth={2.4} color={colors.mutedForeground} />
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <Text style={styles.tallyHint}>拖动画布浏览，点泡泡选择</Text>
              )}
            </View>

            <Pressable
              onPress={next}
              disabled={submitting}
              style={[styles.primaryWide, submitting && styles.primaryDisabled]}>
              {submitting ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.primaryText}>继续</Text>
              )}
            </Pressable>
          </View>
        </>
      ) : (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {head}

          {step === 0 ? (
            <>
              <Text style={styles.title}>你喜欢什么声音？</Text>
              <Text style={styles.subtitle}>可以多选，之后还会按你的口味推荐帖子和作品</Text>
              {categoryRow()}
              {selectedTally}
              <View style={styles.chips}>
                {groups
                  .filter((g) => !activeCategory || g.category === activeCategory)
                  .map((g) => (
                    <View key={g.category} style={styles.chipGroup}>
                      <Text style={styles.chipGroupLabel}>{g.category}</Text>
                      <View style={[styles.chips, styles.chipsTight]}>
                        {g.genres.map((name) => {
                          const on = genres.includes(name);
                          return (
                            <Pressable
                              key={name}
                              onPress={() => toggleGenre(name)}
                              style={[styles.chip, on && styles.chipOn]}>
                              <Text style={[styles.chipText, on && styles.chipTextOn]}>{name}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
              </View>
            </>
          ) : null}

        {step === 1 ? (
          <>
            <Text style={styles.title}>最近在听谁？</Text>
            <Text style={styles.subtitle}>选出你喜欢的音乐人，我们会优先把他们的动态推给你</Text>
            <View style={styles.grid}>
              {data.artists.map((a) => (
                <ArtistCard
                  key={a.id}
                  artist={a}
                  on={artistIds.includes(a.id)}
                  onPress={() => toggle(artistIds, a.id, setArtistIds)}
                />
              ))}
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.title}>你是？</Text>
            <Text style={styles.subtitle}>只用来调整推荐和身份标识，随时可以改</Text>
            <View style={styles.grid}>
              {data.roles.map((r) => {
                const on = role === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRole(on ? null : r)}
                    style={[styles.roleCard, on && styles.cardOn]}>
                    <View style={styles.roleIcon}>
                      <RoleIcon role={r} color={on ? colors.background : colors.foreground} />
                    </View>
                    <Text style={[styles.roleName, on && styles.textOn]}>{r}</Text>
                    <Text style={[styles.roleDesc, on && styles.descOn]}>{ROLE_DESC[r] ?? ''}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.title}>你的年龄段？</Text>
            <Text style={styles.subtitle}>匿名统计用，不会公开展示具体生日</Text>
            <View style={styles.chips}>
              {data.ageGroups.map((a) => {
                const on = ageGroup === a;
                return (
                  <Pressable
                    key={a}
                    onPress={() => setAgeGroup(on ? null : a)}
                    style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{a}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text style={styles.title}>你在哪座城市？</Text>
            <Text style={styles.subtitle}>有同城的现场和活动时，好通知你</Text>
            <View style={styles.chips}>
              {data.cities.map((c) => {
                const on = city === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCity(on ? null : c)}
                    style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      )}

      {/* 底部操作条：泡泡云模式自带工具条，这里只服务其他步骤 */}
      {bubbleMode ? null : (
        <View style={styles.footer}>
          {step > 0 ? (
            <Pressable
              onPress={() => setStep(step - 1)}
              disabled={submitting}
              style={styles.back}
              hitSlop={6}>
              <ChevronLeft size={18} strokeWidth={2} color={colors.mutedForeground} />
              <Text style={styles.backText}>上一步</Text>
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Pressable
            onPress={next}
            disabled={submitting}
            style={[styles.primary, submitting && styles.primaryDisabled]}>
            {submitting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.primaryText}>{last ? '进入首页' : '继续'}</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

/** 艺人卡：色块头像 + 昵称 + @handle，选中后整卡反色并打勾 */
function ArtistCard({
  artist,
  on,
  onPress,
}: {
  artist: UserProfile;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.artistCard, on && styles.cardOn]}>
      {on ? (
        <View style={styles.check}>
          <Check size={12} strokeWidth={3} color={colors.foreground} />
        </View>
      ) : null}
      <Avatar name={artist.name} hue={artist.hue} size={52} />
      <Text style={[styles.artistName, on && styles.textOn]} numberOfLines={1}>
        {artist.name}
      </Text>
      <Text style={[styles.artistHandle, on && styles.descOn]} numberOfLines={1}>
        @{artist.handle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollBody: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { ...type.small, color: colors.mutedForeground, fontSize: 13 },
  scroll: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },  brand: { fontSize: 12, fontWeight: '700', letterSpacing: 2.4, color: colors.foreground },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  skip: { ...type.small, fontSize: 14, color: colors.mutedForeground },
  progress: { flexDirection: 'row', gap: 5, marginTop: 16 },
  progressBar: {
    flex: 1,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    opacity: 0.5,
  },
  progressBarOn: { backgroundColor: colors.foreground, opacity: 1 },
  stepIndex: { ...type.caption, color: colors.mutedForeground, fontSize: 12 },
  title: { fontSize: 28, fontWeight: '700', color: colors.foreground, marginTop: 10, letterSpacing: -0.2 },
  subtitle: { ...type.small, fontSize: 14, lineHeight: 21, color: colors.mutedForeground, marginTop: 8 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },

  /** 宽屏泡泡云：整屏铺开，只有极窄的边距，泡泡一直顶到窗口两侧 */
  bubbleScreen: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 36,
    paddingTop: 24,
    paddingBottom: 0,
  },
  /** 标题左、分类右：横向铺满，纵向把空间留给泡泡 */
  bubbleHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 40,
    marginTop: 20,
  },
  bubbleHeadStack: { flexDirection: 'column', alignItems: 'stretch', gap: 14 },
  bubbleTitleWrap: { flex: 1, minWidth: 0 },
  bubbleHeadRight: { alignItems: 'flex-end', gap: 10, maxWidth: '56%' },
  bubbleHeadRightStack: { alignItems: 'flex-start', maxWidth: '100%' },
  heroTitle: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.8,
  },
  heroSub: { ...type.small, fontSize: 14, lineHeight: 20, color: colors.mutedForeground, marginTop: 8 },
  counter: { ...type.caption, fontSize: 13, color: colors.mutedForeground },
  counterWarn: { color: colors.destructive },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  categoriesRight: { marginTop: 0, justifyContent: 'flex-end' },
  /** 已选汇总行：小胶囊 + 叉，便于跨分类取消 */
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  selectedLabel: { ...type.caption, fontSize: 12.5, color: colors.mutedForeground, marginRight: 4 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 11,
    borderRadius: radius.full,
    backgroundColor: colors.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  selectedText: { fontSize: 11.5, color: colors.foreground },
  /** 泡泡区：负边距抵消容器内边距，视觉上贴到窗口边缘 */
  cloudWrap: { flex: 1, marginTop: 6, marginHorizontal: -22, marginBottom: 6 },

  /** 底部工具条：已选横排 + 继续 */
  toolbar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tally: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 64,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  tallyScroll: { flex: 1 },
  tallyChips: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 4 },
  tallyHint: { ...type.small, fontSize: 13, color: colors.mutedForeground },
  tallyError: { ...type.small, fontSize: 13, color: colors.destructive },
  primaryWide: {
    minWidth: 176,
    height: 46,
    paddingHorizontal: 32,
    borderRadius: radius.full,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChipOn: { backgroundColor: colors.elevated, borderColor: colors.borderStrong },
  catText: { fontSize: 12.5, color: colors.mutedForeground },
  catTextOn: { color: colors.foreground, fontWeight: '600' },
  /** 窄屏 fallback：按分类分组的 chips */
  chipGroup: { width: '100%' },
  chipsTight: { marginTop: 8 },
  chipGroupLabel: {
    ...type.caption,
    fontSize: 11.5,
    letterSpacing: 0.6,
    color: colors.mutedForeground,
  },

  chip: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  chipText: { fontSize: 15, color: colors.foreground },
  chipTextOn: { color: colors.background, fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  artistCard: {
    flexGrow: 1,
    flexBasis: 148,
    maxWidth: 176,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  cardOn: { borderColor: colors.foreground, backgroundColor: colors.foreground },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  artistName: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 4 },
  artistHandle: { fontSize: 12, color: colors.mutedForeground },
  textOn: { color: colors.background },
  descOn: { color: colors.background, opacity: 0.7 },

  roleCard: {
    flexGrow: 1,
    flexBasis: 190,
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    gap: 4,
  },
  roleIcon: { marginBottom: 6 },
  roleName: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  roleDesc: { fontSize: 12.5, color: colors.mutedForeground, lineHeight: 18 },

  footer: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 8 },
  backText: { ...type.small, fontSize: 14, color: colors.mutedForeground },
  backPlaceholder: { width: 72 },
  primary: {
    flex: 1,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { fontSize: 15, fontWeight: '700', color: colors.background },
  error: { ...type.small, fontSize: 13, color: colors.destructive, marginTop: 16 },
  retry: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { ...type.small, fontSize: 14, color: colors.foreground },
});
