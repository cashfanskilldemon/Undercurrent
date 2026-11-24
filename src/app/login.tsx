import { useRouter } from 'expo-router';
import { ChevronLeft, LogIn } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Logo } from '@/components/logo';
import { EmptyView, ErrorView } from '@/components/feedback';
import { colors, radius, space, type } from '@/constants/theme';
import { formatCount } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { UserProfile } from '@/lib/types';
import { useBreakpoint, CENTER_MAX_WIDTH } from '@/lib/use-breakpoint';
import { useResource } from '@/lib/use-paged';

/**
 * 登录页：后端暂未接入密码校验（app_user 里没有密码字段，也没有 /api/auth），
 * 所以这里用「选择一个演示账号」的方式完成登录，选中即写入会话。
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wide } = useBreakpoint();
  const { setUserId } = useSession();
  const accounts = useResource<UserProfile[]>('/api/users/suggested?limit=12');

  const loginAs = (id: number) => {
    setUserId(id);
    router.replace('/home');
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: wide ? 16 : insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>登录</Text>
      </View>

      <FlatList
        data={accounts.data ?? []}
        keyExtractor={(u) => String(u.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          wide && styles.contentWide,
          { paddingBottom: insets.bottom + 32 },
        ]}
        ListHeaderComponent={
          <View>
            <View style={styles.brand}>
              <Logo size={44} />
              <Text style={styles.brandName}>UNDERCURRENT</Text>
              <Text style={styles.brandSub}>地下嘻哈 × 电子音乐</Text>
            </View>
            <Text style={styles.lead}>选择一个账号进入</Text>
            <Text style={styles.hint}>
              演示环境暂未接入密码校验，账号数据来自后端种子数据；登录后可以发帖、点赞、收通知。
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => loginAs(item.id)}
            style={({ pressed }) => [styles.account, pressed && styles.pressed]}>
            <Avatar name={item.name} hue={item.hue} size={44} />
            <View style={styles.accountText}>
              <View style={styles.nameRow}>
                <Text style={styles.accountName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.role ? <Text style={styles.role}>{item.role}</Text> : null}
              </View>
              <Text style={styles.accountMeta} numberOfLines={1}>
                @{item.handle}
                {item.followers != null ? ` · ${formatCount(item.followers)} 位粉丝` : ''}
              </Text>
            </View>
            <View style={styles.enterBtn}>
              <LogIn size={15} color={colors.primaryForeground} />
              <Text style={styles.enterText}>进入</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          accounts.error ? (
            <ErrorView message={accounts.error} onRetry={accounts.reload} />
          ) : accounts.loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: space.xl }} />
          ) : (
            <EmptyView text="没有可用的演示账号" />
          )
        }
        ListFooterComponent={
          <Text style={styles.footer}>登录状态仅保存在本地内存，刷新页面会恢复为游客。</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingBottom: 10,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...type.title, color: colors.foreground },
  content: { paddingHorizontal: space.lg, paddingTop: 8 },
  contentWide: { width: '100%', maxWidth: CENTER_MAX_WIDTH, alignSelf: 'center' },
  brand: { alignItems: 'center', gap: 8, paddingVertical: space.xl },
  brandName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 2.4,
    color: colors.foreground,
  },
  brandSub: { ...type.small, color: colors.mutedForeground, letterSpacing: 1 },
  lead: { ...type.title, color: colors.foreground, marginTop: space.md },
  hint: { ...type.small, color: colors.mutedForeground, lineHeight: 19, marginTop: 6, marginBottom: space.lg },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  accountText: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accountName: { ...type.title, color: colors.foreground },
  role: {
    ...type.caption,
    color: colors.mutedForeground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  accountMeta: { ...type.small, color: colors.mutedForeground },
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  enterText: { fontSize: 13, fontWeight: '700', color: colors.primaryForeground },
  footer: {
    ...type.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: space.xl,
    lineHeight: 18,
  },
});
