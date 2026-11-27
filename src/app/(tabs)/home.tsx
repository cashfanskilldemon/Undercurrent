import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, ChevronLeft, ChevronRight, ImagePlus, Music2, Search, Tags } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Avatar } from '@/components/avatar';
import { PostCard } from '@/components/post-card';
import { EmptyView, ErrorView, FootLoading } from '@/components/feedback';
import { colors, radius, space, type } from '@/constants/theme';
import { useComposer } from '@/lib/composer';
import type { PostItem, UserProfile } from '@/lib/types';
import { useRefreshSeq } from '@/lib/refresh';
import { usePaged, useResource } from '@/lib/use-paged';
import { useBreakpoint } from '@/lib/use-breakpoint';
import { useUnreadCount } from '@/lib/unread';

type FeedTab = 'for-you' | 'following';

const RING_SIZE = 70;
const RING_AVATAR = 56;
const RING_STROKE = 3;

/** 渐变 id 必须每次挂载都唯一：重挂载后复用旧 id 会让 react-native-svg 解析到已卸载的 defs（圆环不上色） */
let ringSeq = 0;

/** Instagram 式「日常动态」头像：彩色渐变圆环 + 内圈留一圈底色间隙 */
function StoryRing({ name, hue }: { name: string; hue: number }) {
  const [gid] = useState(() => `uc-ring-${++ringSeq}`);
  const r = (RING_SIZE - RING_STROKE) / 2;
  return (
    <View style={styles.storyRingWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor="#4f5bd5" />
            <Stop offset="0.28" stopColor="#962fbf" />
            <Stop offset="0.55" stopColor="#d62976" />
            <Stop offset="0.78" stopColor="#fa7e1e" />
            <Stop offset="1" stopColor="#feda75" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={r}
          stroke={`url(#${gid})`}
          strokeWidth={RING_STROKE}
          fill="none"
        />
      </Svg>
      <View style={styles.storyInner}>
        <Avatar name={name} hue={hue} size={RING_AVATAR} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wide } = useBreakpoint();
  const { openComposer } = useComposer();
  const unread = useUnreadCount();
  const [tab, setTab] = useState<FeedTab>('for-you');

  // 日常动态横滑：记录滚动位置/视口与内容宽度，决定箭头显示与点击滚动量
  const storiesRef = useRef<ScrollViewInstance>(null);
  const [storyScroll, setStoryScroll] = useState({ x: 0, viewport: 0, content: 0 });

  const onStoryScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    setStoryScroll({ x: contentOffset.x, viewport: layoutMeasurement.width, content: contentSize.width });
  }, []);
  const onStoryLayout = useCallback((e: LayoutChangeEvent) => {
    setStoryScroll((s) => ({ ...s, viewport: e.nativeEvent.layout.width }));
  }, []);
  const onStoryContentSize = useCallback((w: number) => {
    setStoryScroll((s) => ({ ...s, content: w }));
  }, []);
  const canStoryLeft = storyScroll.x > 1;
  const canStoryRight = storyScroll.viewport > 0 && storyScroll.x + storyScroll.viewport < storyScroll.content - 1;
  const scrollStories = useCallback((dir: -1 | 1) => {
    const { x, viewport } = storyScroll;
    const step = Math.max(viewport * 0.8, 200);
    storiesRef.current?.scrollTo({ x: Math.max(0, x + dir * step), animated: true });
  }, [storyScroll]);

  const suggested = useResource<UserProfile[]>('/api/users/suggested?limit=8');
  const feed = usePaged<PostItem>('/api/posts', {
    ...(tab === 'following' ? { following: true } : {}),
  }, 10);
  const refreshSeq = useRefreshSeq();

  // 发帖/上传成功后（seq 变化）或切回本页时，重新拉第一页
  useFocusEffect(useCallback(() => { feed.refresh(); }, [refreshSeq]));

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: wide ? 20 : insets.top + 10 }]}>
        <View>
          <Text style={styles.title}>首页</Text>
          <Text style={styles.subtitle}>地下嘻哈 × 电子音乐</Text>
        </View>
        {!wide && (
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push('/discover')} hitSlop={8}>
              <Search size={21} color={colors.foreground} />
            </Pressable>
            <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
              <Bell size={21} color={colors.foreground} />
              {unread > 0 && <View style={styles.dot} />}
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('for-you')} style={styles.tab}>
          <Text style={[styles.tabText, tab === 'for-you' && styles.tabActive]}>推荐</Text>
          {tab === 'for-you' && <View style={styles.tabBar} />}
        </Pressable>
        <Pressable onPress={() => setTab('following')} style={styles.tab}>
          <Text style={[styles.tabText, tab === 'following' && styles.tabActive]}>关注</Text>
          {tab === 'following' && <View style={styles.tabBar} />}
        </Pressable>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={feed.items}
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
        ListHeaderComponent={
          <View>
            {/* 发帖入口 */}
            <View style={styles.composer}>
              <Avatar name="潮汐线" hue={122} size={38} />
              <Pressable onPress={() => openComposer('post')} style={styles.composerPrompt}>
                <Text style={styles.composerText}>地下发生了什么？</Text>
              </Pressable>
              <Pressable onPress={() => openComposer('post')} hitSlop={6}>
                <ImagePlus size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => openComposer('post', { tag: '求反馈' })} hitSlop={6}>
                <Tags size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => openComposer('upload')} hitSlop={6}>
                <Music2 size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => openComposer('post')} style={styles.postBtn}>
                <Text style={styles.postBtnText}>发帖</Text>
              </Pressable>
            </View>

            {/* 日常动态：艺人头像条（Ins 式彩色圆环），两侧有滚动箭头 */}
            {suggested.data && suggested.data.length > 0 && (
              <View style={styles.storiesBlock}>
                <View style={styles.storiesWrap} onLayout={onStoryLayout}>
                  <ScrollView
                    ref={storiesRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.stories}
                    onScroll={onStoryScroll}
                    onContentSizeChange={onStoryContentSize}
                    scrollEventThrottle={16}
                  >
                    {suggested.data.map((u) => (
                      <Pressable key={u.id} onPress={() => router.push('/discover')} style={styles.story}>
                        <StoryRing name={u.name} hue={u.hue} />
                        <Text style={styles.storyName} numberOfLines={1}>{u.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {canStoryLeft && (
                    <Pressable
                      onPress={() => scrollStories(-1)}
                      style={[styles.storyArrow, styles.storyArrowLeft]}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="向左滚动日常动态"
                    >
                      <ChevronLeft size={16} color={colors.foreground} strokeWidth={2.4} />
                    </Pressable>
                  )}
                  {canStoryRight && (
                    <Pressable
                      onPress={() => scrollStories(1)}
                      style={[styles.storyArrow, styles.storyArrowRight]}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="向右滚动日常动态"
                    >
                      <ChevronRight size={16} color={colors.foreground} strokeWidth={2.4} />
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          feed.error ? (
            <ErrorView message={feed.error} onRetry={feed.refresh} />
          ) : feed.loading ? undefined : (
            <EmptyView text={tab === 'following' ? '关注流还是空的，去发现页关注几个音乐人' : '还没有帖子'} />
          )
        }
        ListFooterComponent={
          <FootLoading loading={feed.loadingMore} hasMore={feed.hasMore} count={feed.items.length} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: 10,
  },
  title: { ...type.display, color: colors.foreground, letterSpacing: 1.2 },
  subtitle: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 16 },
  dot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.destructive },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingHorizontal: space.lg },
  tab: { width: 72, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.mutedForeground },
  tabActive: { color: colors.foreground },
  tabBar: { position: 'absolute', bottom: -1, width: 40, height: 2, backgroundColor: colors.primary, borderRadius: 1 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: space.lg, marginBottom: 6 },
  composerPrompt: { flex: 1, height: 38, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 14, justifyContent: 'center' },
  composerText: { fontSize: 14, color: colors.mutedForeground },
  postBtn: { height: 32, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  postBtnText: { fontSize: 13, fontWeight: '700', color: colors.primaryForeground },
  /** 日常动态条：不再有标题，直接跟在发帖框下面，横向可滚动 */
  storiesBlock: { marginTop: 12, marginBottom: 4 },
  storiesWrap: { position: 'relative' },
  stories: { paddingHorizontal: space.lg },
  storyArrow: {
    position: 'absolute',
    top: (RING_SIZE + 8) / 2 - 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(18,18,18,0.82)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyArrowLeft: { left: 6 },
  storyArrowRight: { right: 6 },
  story: { width: 80, alignItems: 'center', marginRight: 8 },
  storyRingWrap: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  /** 内圈垫一层底色，让渐变环和头像之间留出 1px 呼吸位 */
  storyInner: { padding: 3, borderRadius: 999, backgroundColor: colors.background },
  storyName: { fontSize: 12, color: colors.foreground, marginTop: 7 },
});
