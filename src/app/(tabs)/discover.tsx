import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyView, ErrorView } from '@/components/feedback';
import { PluginCard } from '@/components/plugin-card';
import { PostCard } from '@/components/post-card';
import { TrackRow } from '@/components/track-row';
import { colors, radius, space, type } from '@/constants/theme';
import { formatCount } from '@/lib/format';
import type { SearchResult, UserProfile } from '@/lib/types';
import { useResource } from '@/lib/use-paged';
import { useBreakpoint } from '@/lib/use-breakpoint';

type SearchTab = 'all' | 'artists' | 'tracks' | 'posts' | 'plugins';
const TABS: { key: SearchTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'artists', label: '艺人' },
  { key: 'tracks', label: '作品' },
  { key: 'posts', label: '帖子' },
  { key: 'plugins', label: '插件' },
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; tag?: string }>();
  const { wide } = useBreakpoint();
  const [draft, setDraft] = useState(params.q ?? '');
  const [tab, setTab] = useState<SearchTab>('all');
  const query = params.q ?? params.tag ?? '';

  useEffect(() => setDraft(query), [query]);

  const result = useResource<SearchResult>(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
  const data = result.data;

  function submit() {
    router.push(`/discover?q=${encodeURIComponent(draft.trim())}`);
  }

  const artistHits = data?.users ?? [];
  const trackHits = data?.tracks ?? [];
  const postHits = data?.posts ?? [];
  const pluginHits = data?.plugins ?? [];
  const total = data?.total ?? 0;

  const show = (k: SearchTab) => tab === 'all' || tab === k;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: wide ? 20 : insets.top + 10 }]}>
        <View>
          <Text style={styles.title}>发现</Text>
          <Text style={styles.subtitle}>
            {query ? `“${query}” · ${total} 条结果` : '搜索艺人、作品、帖子与插件'}
          </Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          placeholder="搜索艺人、作品、插件或话题"
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
        />
        <Pressable onPress={submit} style={styles.searchBtn}>
          <Text style={styles.searchBtnText}>搜索</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tab}>
            <Text style={[styles.tabText, tab === t.key && styles.tabActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {result.error ? (
        <ErrorView message={result.error} onRetry={result.reload} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          {!query && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>热门话题</Text>
              <View style={styles.chips}>
                {['求反馈', 'boombap', '版权', '808', '插件更新', '演出', '磁带'].map((tag) => (
                  <Pressable key={tag} onPress={() => router.push(`/discover?tag=${encodeURIComponent(tag)}`)} style={styles.chip}>
                    <Text style={styles.chipText}>#{tag}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {result.loading ? (
            <Text style={styles.loading}>搜索中…</Text>
          ) : total === 0 ? (
            <EmptyView text="没有找到相关内容" />
          ) : (
            <>
              {show('artists') && artistHits.length > 0 && (
                <Section title="艺人" count={artistHits.length}>
                  {artistHits.map((u) => (
                    <ArtistRow key={u.id} user={u} />
                  ))}
                </Section>
              )}
              {show('tracks') && trackHits.length > 0 && (
                <Section title="作品" count={trackHits.length}>
                  {trackHits.map((t) => <TrackRow key={t.id} track={t} />)}
                </Section>
              )}
              {show('posts') && postHits.length > 0 && (
                <Section title="帖子" count={postHits.length}>
                  {postHits.map((t) => <PostCard key={t.id} post={t} />)}
                </Section>
              )}
              {show('plugins') && pluginHits.length > 0 && (
                <Section title="插件" count={pluginHits.length}>
                  <View style={styles.pluginGrid}>
                    {pluginHits.map((p) => (
                      <View key={p.id} style={styles.pluginCell}><PluginCard plugin={p} /></View>
                    ))}
                  </View>
                </Section>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{formatCount(count)}</Text>
      </View>
      {children}
    </View>
  );
}

function ArtistRow({ user }: { user: UserProfile }) {
  return (
    <View style={styles.artistRow}>
      <Avatar name={user.name} hue={user.hue} size={44} />
      <View style={styles.artistMain}>
        <Text style={styles.artistName}>{user.name}</Text>
        <Text style={styles.artistMeta}>@{user.handle} · {user.role ?? '音乐人'} · {user.city ?? ''}</Text>
      </View>
      <Text style={styles.artistFollow}>{user.followers ?? 0} 粉丝</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: space.lg, paddingBottom: 10 },
  title: { ...type.display, color: colors.foreground, letterSpacing: 1.2 },
  subtitle: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: space.lg, marginBottom: 12 },
  searchInput: { flex: 1, height: 42, borderRadius: radius.full, backgroundColor: colors.input, paddingHorizontal: 16, fontSize: 14, color: colors.foreground },
  searchBtn: { paddingHorizontal: 18, height: 42, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { fontSize: 14, fontWeight: '700', color: colors.primaryForeground },
  tabs: { flexDirection: 'row', paddingHorizontal: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, marginBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 10 },
  tabText: { fontSize: 14, color: colors.mutedForeground },
  tabActive: { color: colors.primary, fontWeight: '700' },
  section: { marginTop: 16, paddingHorizontal: space.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.foreground },
  sectionCount: { fontSize: 13, color: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, height: 30, borderRadius: radius.full, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13, color: colors.foreground },
  loading: { textAlign: 'center', color: colors.mutedForeground, padding: 24 },
  artistRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  artistMain: { flex: 1 },
  artistName: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  artistMeta: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  artistFollow: { fontSize: 12, color: colors.primary },
  pluginGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pluginCell: { width: '48%' },
});
