import { useRouter } from 'expo-router';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/avatar';
import { BubbleCloud } from '@/components/bubble-cloud';
import { WeaponPixelIcon, type WeaponIconName } from '@/components/weapon-pixel-icon';
import { colors, radius, type } from '@/constants/theme';
import { api, API_BASE } from '@/lib/api';
import { useBreakpoint } from '@/lib/use-breakpoint';
import type {
  Artist,
  GenreGroup,
  OnboardingData,
  OnboardingPayload,
} from '@/lib/types';

/** 注册后的第一个环节：风格 → 艺人 → 武器 → 年龄 → 城市 */
const STEPS = ['风格', '艺人', '武器', '年龄', '城市'] as const;

/** 最多能选几个流派（后端同值校验） */
const MAX_GENRES = 12;

/** 武器即身份：展示成武器，提交时仍发送后端认可的身份值 */
type WeaponOption = {
  role: string;
  name: string;
  desc: string;
  icon: WeaponIconName;
};

const WEAPONS: WeaponOption[] = [
  { role: '听众', name: '耳机', desc: '听歌、聊歌、蹲现场', icon: 'headphones' },
  { role: '音乐人', name: '麦克风', desc: '发作品、演出、跑现场', icon: 'mic' },
  { role: '制作人', name: '调音台', desc: '做 beat、编曲、混音', icon: 'mixer' },
  { role: '插件作者', name: '效果器', desc: '做插件、卖预设', icon: 'pedal' },
  { role: 'DJ', name: '唱盘', desc: '搓盘、接歌、控场', icon: 'dj' },
  { role: '录音师', name: '磁带机', desc: '收音、录音、修复', icon: 'recorder' },
  { role: '乐评人', name: '黑胶', desc: '写乐评、挖冷门', icon: 'vinyl' },
  { role: '场地主理人', name: '舞台', desc: '办演出、经营现场', icon: 'stage' },
];

/** 后端新增身份时兜底成普通卡片，不让它变成空白 */
const weaponFor = (role: string): WeaponOption =>
  WEAPONS.find((w) => w.role === role) ?? { role, name: role, desc: '', icon: 'headphones' };

/**
 * 屏幕左右边缘的翻页箭头：贴在窗口最左/最右，垂直居中于泡泡区域。
 * 用「撑满高度的容器 + 居中」定位，不依赖 transform（本环境 transform 不可靠）。
 */
function EdgeArrow({
  side,
  disabled,
  onPress,
}: {
  side: 'left' | 'right';
  disabled?: boolean;
  onPress: () => void;
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.edge, side === 'left' ? styles.edgeLeft : styles.edgeRight]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={side === 'left' ? '上一步' : '下一步'}
        style={({ pressed }) => [
          styles.arrowBtn,
          pressed && !disabled && styles.arrowBtnOn,
          disabled && styles.arrowBtnOff,
        ]}>
        <Icon
          size={22}
          strokeWidth={1.8}
          color={disabled ? colors.mutedForeground : colors.foreground}
        />
      </Pressable>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { isWeb, wide, width } = useBreakpoint();
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

  /** 宽屏艺人按流派分行：行顺序沿用流派字典，每行内部保留后端的推荐顺序 */
  const artistRows = useMemo(() => {
    const byCat = new Map<string, Artist[]>();
    for (const artist of data?.artists ?? []) {
      const category = artist.category || '其他';
      if (!byCat.has(category)) byCat.set(category, []);
      byCat.get(category)!.push(artist);
    }
    const order = [...(data?.genreGroups?.map((g) => g.category) ?? []), '其他'];
    return [...byCat.entries()].sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
  }, [data]);

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

  const prev = () => {
    if (step > 0) setStep(step - 1);
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
  /** Web 宽屏：五步全部铺开（第一步泡泡云，后四步宽网格）；窄屏保持单列 */
  const wideMode = wide;
  const bubbleMode = wideMode && step === 0;
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
      {/* 最底层涂鸦底纹：五线谱/音符/贴纸线稿 + 圆体品牌字，整体压淡，不接事件 */}
      {isWeb ? (
        <View pointerEvents="none" style={styles.graffiti}>
          <View
            style={
              [
                StyleSheet.absoluteFill,
                {
                  backgroundImage: 'url(/img/graffiti.svg)',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.1,
                },
              ] as any
            }
          />
          <Text
            style={
              [
                styles.graffitiWord,
                styles.graffitiWordA,
                { WebkitTextStrokeWidth: 1.2, WebkitTextStrokeColor: 'rgba(216,216,220,0.09)' },
              ] as any
            }>
            UNDERCURRENT
          </Text>
          <Text
            style={
              [
                styles.graffitiWord,
                styles.graffitiWordB,
                { WebkitTextStrokeWidth: 1, WebkitTextStrokeColor: 'rgba(216,216,220,0.08)' },
              ] as any
            }>
            UNDERCURRENT
          </Text>
        </View>
      ) : null}

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

        </>
      ) : (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={
            wideMode ? (step === 2 ? styles.weaponScrollWide : styles.wideScroll) : styles.scroll
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {head}

          {step === 0 ? (
            <>
              <Text style={[styles.title, wideMode && styles.heroTitle]}>你喜欢什么声音？</Text>
              <Text style={[styles.subtitle, wideMode && styles.heroSub]}>可以多选，之后还会按你的口味推荐帖子和作品</Text>
              {categoryRow()}
              {selectedTally}
              <View style={[styles.chips, wideMode && styles.chipsWide]}>
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
                              style={[styles.chip, wideMode && styles.chipWide, on && styles.chipOn]}>
                              <Text style={[styles.chipText, wideMode && styles.chipTextWide, on && styles.chipTextOn]}>{name}</Text>
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
            <Text style={[styles.title, wideMode && styles.heroTitle]}>最近在听谁？</Text>
            <Text style={[styles.subtitle, wideMode && styles.heroSub]}>选出你喜欢的音乐人，我们会优先把他们的动态推给你</Text>
            {wideMode ? (
              <View style={styles.artistRows}>
                <ArtistRows
                  rows={artistRows}
                  artistIds={artistIds}
                  onToggle={(id) => toggle(artistIds, id, setArtistIds)}
                />
              </View>
            ) : (
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
            )}
          </>
        ) : null}

        {step === 2 ? (
          <View style={[styles.weaponContent, wideMode && styles.weaponContentWide]}>
            <Text style={[styles.title, styles.weaponTitle, wideMode && styles.heroTitle]}>装备你的职业</Text>
            <Text style={[styles.subtitle, styles.weaponSubtitle, wideMode && styles.heroSub]}>选定一件武器，它就是你的身份，随时可以重新装备</Text>
            <View style={wideMode ? styles.weaponGridWide : styles.weaponGrid}>
              {[...data.roles]
                .sort((a, b) => {
                  const ia = WEAPONS.findIndex((w) => w.role === a);
                  const ib = WEAPONS.findIndex((w) => w.role === b);
                  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
                })
                .map((r) => {
                  const weapon = weaponFor(r);
                  const on = role === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRole(on ? null : r)}
                      style={[
                        wideMode ? styles.weaponCardWide : styles.weaponCard,
                        on && styles.cardOn,
                      ]}>
                      {on ? (
                        <View style={styles.equippedBadge}>
                          <Text style={styles.equippedText}>已装备</Text>
                        </View>
                      ) : null}
                      <View style={[styles.weaponIcon, wideMode && styles.weaponIconWide]}>
                        <WeaponPixelIcon
                          name={weapon.icon}
                          size={wideMode ? 128 : 80}
                          color={on ? colors.background : colors.foreground}
                          background={on ? colors.foreground : colors.elevated}
                        />
                      </View>
                      <Text style={[styles.weaponName, wideMode && styles.weaponNameWide, on && styles.textOn]}>
                        {weapon.name}
                      </Text>
                      <Text style={[styles.weaponDesc, wideMode && styles.weaponDescWide, on && styles.descOn]}>
                        {weapon.desc ? `${r} · ${weapon.desc}` : r}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={[styles.title, wideMode && styles.heroTitle]}>你的年龄段？</Text>
            <Text style={[styles.subtitle, wideMode && styles.heroSub]}>匿名统计用，不会公开展示具体生日</Text>
            <View style={[styles.chips, wideMode && styles.chipsWide]}>
              {data.ageGroups.map((a) => {
                const on = ageGroup === a;
                return (
                  <Pressable
                    key={a}
                    onPress={() => setAgeGroup(on ? null : a)}
                    style={[styles.chip, wideMode && styles.chipWide, on && styles.chipOn]}>
                    <Text style={[styles.chipText, wideMode && styles.chipTextWide, on && styles.chipTextOn]}>{a}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text style={[styles.title, wideMode && styles.heroTitle]}>你在哪座城市？</Text>
            <Text style={[styles.subtitle, wideMode && styles.heroSub]}>有同城的现场和活动时，好通知你</Text>
            <View style={[styles.chips, wideMode && styles.chipsWide]}>
              {data.cities.map((c) => {
                const on = city === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCity(on ? null : c)}
                    style={[styles.chip, wideMode && styles.chipWide, on && styles.chipOn]}>
                    <Text style={[styles.chipText, wideMode && styles.chipTextWide, on && styles.chipTextOn]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      )}

      {/* Web 宽屏：五步统一用屏幕两侧的箭头翻页；窄屏保留底部操作条 */}
      {wideMode ? (
        <>
          <EdgeArrow side="left" disabled={step === 0 || submitting} onPress={prev} />
          <EdgeArrow side="right" disabled={submitting} onPress={next} />
        </>
      ) : null}

      {wideMode ? null : (
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

/** 一行的滚动状态：全放 ref，逐帧只写 scrollLeft，不触发 React 渲染 */
type RowDriver = {
  x: number;
  max: number;
  dir: number;
  paused: boolean;
  /** 拖动/滚轮结束后 200ms 内不自动滚，给惯性一个缓冲 */
  resumeAt: number;
  /** 一组艺人的总宽度（60 × 170），位置对它取模就能无缝接回开头 */
  cycle: number;
  /** 上次真正写进 DOM 的整像素位置，相同就跳过这次写入 */
  written: number;
  scrollTo: (x: number) => void;
};

/**
 * 宽屏艺人分行：一行一个流派，行内自动缓慢来回滑动，相邻行方向相反。
 * 全页面只跑一个 requestAnimationFrame，逐帧调各行的 scrollTo，不 setState；
 * 鼠标拖动时暂停该行，松手后继续；拖动后的点击用时间窗吞掉，避免误选。
 */
function ArtistRows({
  rows,
  artistIds,
  onToggle,
}: {
  rows: [string, Artist[]][];
  artistIds: number[];
  onToggle: (id: number) => void;
}) {
  const drivers = useRef<RowDriver[]>([]);
  const register = useCallback((index: number, driver: RowDriver | null) => {
    if (driver) drivers.current[index] = driver;
    else delete drivers.current[index];
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(2.5, Math.max(0.4, (now - last) / 16.7));
      last = now;
      for (const driver of drivers.current) {
        if (!driver || driver.paused || now < driver.resumeAt || driver.max <= 0) continue;
        // 内容渲染两遍，位置对 cycle 取模即可无缝循环：到最右端会接回最左端，不回头
        if (driver.cycle > 0) {
          driver.x = (((driver.x + driver.dir * 0.38 * dt) % driver.cycle) + driver.cycle) % driver.cycle;
        }
        driver.scrollTo(driver.x);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <View style={styles.artistRows}>
      {rows.map(([category, artists], index) => (
        <ArtistRow
          key={category}
          index={index}
          register={register}
          category={category}
          artists={artists}
          artistIds={artistIds}
          onToggle={onToggle}
        />
      ))}
    </View>
  );
}

function ArtistRow({
  index,
  register,
  category,
  artists,
  artistIds,
  onToggle,
}: {
  index: number;
  register: (index: number, driver: RowDriver | null) => void;
  category: string;
  artists: Artist[];
  artistIds: number[];
  onToggle: (id: number) => void;
}) {
  const scrollRef = useRef<any>(null);
  const wrapRef = useRef<any>(null);
  const dragUntilRef = useRef(0);
  const initedRef = useRef(false);
  const driver = useRef<RowDriver>({
    x: 0,
    max: 0,
    dir: index % 2 === 0 ? 1 : -1,
    paused: false,
    resumeAt: 0,
    cycle: 0,
    written: -1,
    // Web 上直接写 scrollLeft，绕开 scrollTo 可能的平滑滚动动画；原生端仍用 scrollTo。
    // 按整像素写并去重：0.38px/帧的位移大约只有 23 次/帧真正落 DOM，省掉大半写入。
    scrollTo: (x) => {
      const px = Math.round(x);
      if (px === driver.current.written) return;
      driver.current.written = px;
      const node: any = scrollRef.current;
      if (!node) return;
      if ('scrollLeft' in node) node.scrollLeft = px;
      else node.scrollTo?.({ x: px, animated: false });
    },
  });

  useEffect(() => {
    register(index, driver.current);
    return () => register(index, null);
  }, [index, register]);

  /**
   * 用原生 pointer 事件做拖动：PanResponder 在 Web 上经常被子卡片 / img 抢走，
   * 用户真实鼠标拖不动；pointer capture 能保证按下后整段拖动都落到这一行。
   */
  useEffect(() => {
    const node: any = wrapRef.current;
    if (!node) return;
    let pressed = false;
    let dragging = false;
    let startX = 0;
    let startScroll = 0;

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pressed = true;
      dragging = false;
      startX = e.clientX;
      startScroll = driver.current.x;
      driver.current.paused = true;
      // 不能在按下时 setPointerCapture：捕获会把 click 重定向到容器，艺人卡就选不中了。
      // 用 window 上的 move/up 接住整段拖动即可。
    };
    const move = (e: PointerEvent) => {
      if (!pressed) return;
      const dx = e.clientX - startX;
      if (!dragging && Math.abs(dx) < 6) return;
      dragging = true;
      e.preventDefault();
      const next = Math.max(0, Math.min(driver.current.max, startScroll - dx));
      driver.current.x = next;
      driver.current.scrollTo(next);
      dragUntilRef.current = Date.now() + 220;
    };
    const up = (e: PointerEvent) => {
      if (!pressed) return;
      pressed = false;
      if (dragging) dragUntilRef.current = Date.now() + 220;
      dragging = false;
      const d = driver.current;
      // 拖到第二遍时折回第一遍的同一位置（内容重复，视觉上无跳变）
      if (d.cycle > 0 && d.x >= d.cycle) {
        d.x = d.x % d.cycle;
        d.scrollTo(d.x);
      }
      d.paused = false;
      d.resumeAt = performance.now() + 200;
    };

    node.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      node.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  return (
    <View style={styles.artistRow}>
      <View style={styles.artistRowHead}>
        <Text style={styles.artistRowTitle}>{category}</Text>
        <Text style={styles.artistRowHint}>缓慢自动滑动，也可以拖动</Text>
      </View>
      <View ref={wrapRef} testID="artist-row-drag">
        <ScrollView
          ref={scrollRef}
          testID="artist-row-scroll"
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={(e) => {
            const viewport = e.nativeEvent.layout.width;
            const cycle = artists.length * (158 + 12); // 卡宽 + 间距
            const node: any = scrollRef.current;
            const d = driver.current;
            d.cycle = cycle;
            d.max = Math.max(0, (node?.scrollWidth ?? cycle * 2 + 96) - viewport);
            if (!initedRef.current && cycle > 0) {
              initedRef.current = true;
              // 偶数行从 0 开始，奇数行从 cycle 开始（视觉上等价于 0，但方向相反）
              d.x = d.dir > 0 ? 0 : cycle;
              d.scrollTo(d.x);
            }
          }}
          onScroll={(e) => {
            // 浏览器把 scrollLeft 取整，逐帧回写会把小数增量吃掉；
            // 只在用户滚轮/触控板大幅改动时才接管位置
            const actual = e.nativeEvent.contentOffset.x;
            if (Math.abs(actual - driver.current.x) > 8) {
              driver.current.x = actual;
              driver.current.resumeAt = performance.now() + 200;
            }
          }}
          contentContainerStyle={styles.artistRowScroll}>
          {/* 渲染两遍：第二遍只是循环用的“接尾”，位置对 cycle 取模后看不出跳变 */}
          {[0, 1].flatMap((copy) =>
            artists.map((a) => (
              <ArtistCard
                key={`${a.id}-${copy}`}
                artist={a}
                row
                on={artistIds.includes(a.id)}
                onPress={() => {
                  if (Date.now() >= dragUntilRef.current) onToggle(a.id);
                }}
              />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

/** 艺人卡：网易云抓的实拍头像 + 艺名 + 流派，选中后整卡反色并打勾 */
function ArtistCard({
  artist,
  on,
  onPress,
  large = false,
  row = false,
}: {
  artist: Artist;
  on: boolean;
  onPress: () => void;
  large?: boolean;
  row?: boolean;
}) {
  const size = large ? 72 : row ? 58 : 52;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.artistCard,
        large && styles.artistCardWide,
        row && styles.artistCardRow,
        on && styles.cardOn,
      ]}>
      {on ? (
        <View style={styles.check}>
          <Check size={12} strokeWidth={3} color={colors.foreground} />
        </View>
      ) : null}
      {artist.avatar ? (
        <Image
          source={{ uri: `${API_BASE}${artist.avatar}` }}
          style={[styles.artistPhoto, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <Avatar name={artist.name} hue={(artist.neteaseId ?? 0) % 360} size={size} />
      )}
      <Text style={[styles.artistName, large && styles.artistNameWide, on && styles.textOn]} numberOfLines={1}>
        {artist.name}
      </Text>
      <Text style={[styles.artistHandle, large && styles.artistHandleWide, on && styles.descOn]} numberOfLines={1}>
        {artist.category ?? ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  /** 涂鸦层：铺满、压到最底，内部再控制各自的透明度 */
  graffiti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  /** 品牌涂鸦字：Sedgwick Ave Display（OFL 免费），描边+淡填充，像喷在墙上的 tag */
  graffitiWord: {
    position: 'absolute',
    fontFamily: 'Undercurrent Graffiti',
    color: 'rgba(216, 216, 220, 0.14)',
  },
  graffitiWordA: {
    left: -12,
    top: '3%',
    fontSize: 124,
    transform: [{ rotate: '-8deg' }],
  },
  graffitiWordB: {
    right: -8,
    bottom: '3%',
    fontSize: 86,
    transform: [{ rotate: '6deg' }],
  },
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
  /** Web 宽屏：第 2~5 步铺满整窗，左右留出箭头的空间 */
  wideScroll: {
    width: '100%',
    paddingHorizontal: 84,
    paddingTop: 24,
    paddingBottom: 120,
  },
  /** 武器步骤：少留白，让大图卡片铺满整窗 */
  weaponScrollWide: {
    width: '100%',
    flexGrow: 1,
    paddingHorizontal: 64,
    paddingTop: 24,
    paddingBottom: 120,
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
  cloudWrap: { flex: 1, marginTop: 6, marginHorizontal: -22, marginBottom: 0 },

  /**
   * 屏幕两侧的翻页箭头：整条边撑满高度、内部垂直居中，
   * 泡泡区刚好居中，箭头也就落在它的中间位置。
   */
  edge: {
    position: 'absolute',
    top: 132,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 5,
  },
  edgeLeft: { left: 10 },
  edgeRight: { right: 10 },
  arrowBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  arrowBtnOn: { backgroundColor: colors.card, borderColor: colors.foreground },
  arrowBtnOff: { opacity: 0.45 },
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
  /** 宽屏艺人：按流派一行一条，每条内部横向滑动 */
  artistRows: { gap: 26, marginTop: 26 },
  artistRow: { width: '100%', userSelect: 'none' },
  artistRowHead: { flexDirection: 'row', alignItems: 'baseline', gap: 14, marginBottom: 12 },
  artistRowTitle: { fontSize: 21, fontWeight: '700', color: colors.foreground },
  artistRowHint: { fontSize: 12, color: colors.mutedForeground },
  artistRowScroll: { flexDirection: 'row', gap: 12, paddingRight: 96 },

  /** 宽屏选项：更高的胶囊、更大的字 */
  chipsWide: { gap: 12, marginTop: 28 },
  chipWide: { height: 54, paddingHorizontal: 28 },
  chipTextWide: { fontSize: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  /** 宽屏网格：卡片排成 5~8 列，横向空间全用上 */
  wideGrid: { gap: 14, marginTop: 28 },
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
  /** 横向滑动行里的固定宽度卡片，避免被 flex 拉伸 */
  artistCardRow: {
    width: 158,
    flexGrow: 0,
    flexBasis: 158,
    maxWidth: 158,
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 8,
  },
  artistCardWide: {
    flexBasis: 196,
    maxWidth: 224,
    paddingVertical: 24,
    paddingHorizontal: 14,
    gap: 10,
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
  artistNameWide: { fontSize: 16 },
  artistHandleWide: { fontSize: 13 },
  /** 艺人头像：圆形实拍图，加载前先用 elevated 底色占位 */
  artistPhoto: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.elevated },
  textOn: { color: colors.background },
  descOn: { color: colors.background, opacity: 0.7 },

  weaponContent: { width: '100%', alignItems: 'center' },
  weaponContentWide: { flex: 1, justifyContent: 'center', paddingTop: 0 },
  weaponTitle: { textAlign: 'center' },
  weaponSubtitle: { textAlign: 'center', alignSelf: 'center', maxWidth: 720 },
  weaponGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24, width: '100%' },
  weaponGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 40,
    marginTop: 28,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  weaponCard: {
    position: 'relative',
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 150,
    minHeight: 200,
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  weaponCardWide: {
    flexGrow: 0,
    flexBasis: '19%',
    minWidth: 180,
    maxWidth: 240,
    minHeight: 208,
    padding: 20,
    gap: 10,
  },
  equippedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equippedText: { fontSize: 11, fontWeight: '700', color: colors.foreground },
  weaponIcon: { alignItems: 'center', justifyContent: 'center' },
  weaponIconWide: { height: 136 },
  weaponName: { fontSize: 16, fontWeight: '700', color: colors.foreground, textAlign: 'center' },
  weaponNameWide: { fontSize: 22 },
  weaponDesc: {
    fontSize: 12.5,
    color: colors.mutedForeground,
    lineHeight: 18,
    textAlign: 'center',
  },
  weaponDescWide: { fontSize: 13.5, lineHeight: 20 },

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
