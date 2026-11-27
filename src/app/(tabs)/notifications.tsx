import { useRouter } from 'expo-router';
import { Bell, Heart, MessageCircle, Sparkles, UserPlus } from 'lucide-react-native';
import { useCallback, useEffect } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyView, ErrorView } from '@/components/feedback';
import { colors, radius, space, type } from '@/constants/theme';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import type { NotificationItem, NotificationPage } from '@/lib/types';
import { useBreakpoint } from '@/lib/use-breakpoint';
import { useResource } from '@/lib/use-paged';
import { useSession } from '@/lib/session';
import { setUnreadCount } from '@/lib/unread';

const ICONS = {
  like: Heart,
  reply: MessageCircle,
  follow: UserPlus,
  system: Sparkles,
} as const;

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wide } = useBreakpoint();
  const { userId } = useSession();
  // 未登录不请求（后端会返回 401），直接给登录引导
  const feed = useResource<NotificationPage>(userId ? '/api/notifications?size=50' : null);

  useEffect(() => {
    if (userId == null) {
      setUnreadCount(0);
      return;
    }
    if (feed.data) setUnreadCount(feed.data.unreadCount);
  }, [feed.data, userId]);

  const readAll = useCallback(async () => {
    try {
      await api.post('/api/notifications/read-all');
      setUnreadCount(0);
      await feed.reload();
    } catch {
      // 静默：演示环境
    }
  }, [feed]);

  async function open(item: NotificationItem) {
    if (!item.read) {
      try {
        await api.post(`/api/notifications/${item.id}/read`);
        await feed.reload();
      } catch {
        // 静默
      }
    }
    // 通知 href 历史存的是 /threads/1，统一映射到 /post/1
    if (item.href) router.push(item.href.replace('/threads/', '/post/').replace('/posts/', '/post/'));
  }

  const items = feed.data?.list ?? [];

  if (userId == null) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: wide ? 20 : insets.top + 10 }]}>
          <Text style={styles.title}>通知</Text>
        </View>
        <View style={styles.guest}>
          <Text style={styles.guestTitle}>登录后查看通知</Text>
          <Text style={styles.guestHint}>回复、点赞、关注的提醒都发到这里。</Text>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.guestBtnText}>去登录</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: wide ? 20 : insets.top + 10 }]}>
        <View>
          <Text style={styles.title}>通知</Text>
          <Text style={styles.subtitle}>
            {(feed.data?.unreadCount ?? 0) > 0 ? `${feed.data?.unreadCount} 条未读` : '全部已读'}
          </Text>
        </View>
        <Pressable
          onPress={readAll}
          disabled={(feed.data?.unreadCount ?? 0) === 0}
          style={[styles.readAll, (feed.data?.unreadCount ?? 0) === 0 && styles.readAllDisabled]}>
          <Text style={styles.readAllText}>全部已读</Text>
        </Pressable>
      </View>

      {feed.error && !items.length ? (
        <ErrorView message={feed.error} onRetry={feed.reload} />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const Icon = ICONS[item.type] ?? Bell;
            return (
              <Pressable
                onPress={() => open(item)}
                style={[styles.row, !item.read && styles.rowUnread]}>
                <View>
                  {item.actor ? (
                    <Avatar name={item.actor.name} hue={item.actor.hue} size={42} />
                  ) : (
                    <View style={[styles.systemAvatar, { backgroundColor: colors.accent }]}>
                      <Icon size={20} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.typeBadge}>
                    <Icon size={11} color={colors.primaryForeground} />
                  </View>
                </View>
                <View style={styles.rowMain}>
                  <Text style={styles.rowBody} numberOfLines={2}>{item.body}</Text>
                  <Text style={styles.rowTime}>{relativeTime(item.createdAt)}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </Pressable>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={feed.loading}
              onRefresh={feed.reload}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.elevated}
            />
          }
          ListEmptyComponent={feed.loading ? undefined : <EmptyView text="还没有通知" />}
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
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { ...type.display, color: colors.foreground, letterSpacing: 1.2 },
  subtitle: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  readAll: { paddingHorizontal: 14, height: 32, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  readAllDisabled: { opacity: 0.4 },
  readAllText: { fontSize: 13, color: colors.foreground },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowUnread: { backgroundColor: 'rgba(197,233,92,0.04)' },
  systemAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  typeBadge: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background },
  rowMain: { flex: 1 },
  rowBody: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  rowTime: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: 8 },
  guestTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground },
  guestHint: { fontSize: 13, color: colors.mutedForeground, textAlign: 'center' },
  guestBtn: {
    marginTop: space.sm,
    height: 36,
    paddingHorizontal: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.primaryForeground },
});
