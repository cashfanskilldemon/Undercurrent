import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chips } from '@/components/chips';
import { EmptyView, ErrorView, FootLoading } from '@/components/feedback';
import { PluginCard } from '@/components/plugin-card';
import { colors, space, type } from '@/constants/theme';
import type { Meta, PluginItem } from '@/lib/types';
import { usePaged, useResource } from '@/lib/use-paged';
import { useBreakpoint } from '@/lib/use-breakpoint';

export default function PluginsScreen() {
  const insets = useSafeAreaInsets();
  const { wide } = useBreakpoint();
  const [category, setCategory] = useState('全部');
  const meta = useResource<Meta>('/api/meta');
  const feed = usePaged<PluginItem>('/api/plugins', { category }, 8);

  const categories = meta.data?.categories ?? [];

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: wide ? 20 : insets.top + 10 }]}>
        <Text style={styles.title}>插件</Text>
        <Text style={styles.count}>{feed.items.length ? `${feed.items.length} 个` : ''}</Text>
      </View>

      <Chips options={categories} value={category} onChange={setCategory} />

      {feed.error && !feed.items.length ? (
        <ErrorView message={feed.error} onRetry={feed.refresh} />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={feed.items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.column}
          renderItem={({ item }) => <PluginCard plugin={item} />}
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
          ListEmptyComponent={feed.loading ? undefined : <EmptyView text="这个分类还没有插件" />}
          ListFooterComponent={
            <FootLoading loading={feed.loadingMore} hasMore={feed.hasMore} count={feed.items.length} />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: space.md }}
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
  count: { ...type.caption, color: colors.mutedForeground, marginLeft: 'auto' },
  column: { gap: space.md, paddingHorizontal: space.lg },
});
