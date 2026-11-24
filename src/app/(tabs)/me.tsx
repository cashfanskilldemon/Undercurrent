import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { API_BASE, api } from '@/lib/api';
import { signOut } from '@/lib/auth';
import { useSession } from '@/lib/session';
import { colors, radius, space, type } from '@/constants/theme';
import { useBreakpoint } from '@/lib/use-breakpoint';
import { formatCount } from '@/lib/format';
import { useResource } from '@/lib/use-paged';
import type { UserProfile } from '@/lib/types';

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wide } = useBreakpoint();
  const { userId, setUserId } = useSession();
  const profile = useResource<UserProfile>(userId == null ? null : `/api/users/${userId}`);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // 未登录：这一页只给登录入口，调试身份等信息留给登录后的自己
  if (userId == null) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: wide ? 20 : insets.top + 10 }]}>
          <Text style={styles.title}>我的</Text>
        </View>
        <View style={styles.guest}>
          <Text style={styles.guestTitle}>还没有登录</Text>
          <Text style={styles.guestHint}>
            登录后可以发帖、上传作品、点赞收藏，并收到回复和关注通知。
          </Text>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.loginBtn, pressed && styles.pressed]}>
            <LogIn size={16} color={colors.primaryForeground} />
            <Text style={styles.loginText}>登录 / 注册</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const check = async () => {
    setChecking(true);
    setStatus(null);
    const started = Date.now();
    try {
      const meta = await api.get<{ channels: unknown[] }>('/api/meta');
      setStatus(`连通，${Date.now() - started}ms，频道 ${meta.channels.length} 个`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : '连接失败');
    } finally {
      setChecking(false);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
      <View style={[styles.header, { paddingTop: wide ? 20 : insets.top + 10 }]}>
        <Text style={styles.title}>我的</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.profileRow}>
          <Avatar name={profile.data?.name ?? '我'} hue={profile.data?.hue ?? 122} size={52} />
          <View style={styles.profileText}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile.data?.name ?? `用户 #${userId}`}
              </Text>
              {profile.data?.role ? <Text style={styles.role}>{profile.data.role}</Text> : null}
            </View>
            {profile.data ? (
              <Text style={styles.profileMeta} numberOfLines={1}>
                @{profile.data.handle}
                {profile.data.followers != null
                  ? ` · ${formatCount(profile.data.followers)} 位粉丝`
                  : ''}
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={styles.sectionHint}>
          当前身份来自登录 token（后端从 Authorization 解析），换账号请先退出登录。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>后端</Text>
        <Row label="地址" value={API_BASE} />
        <Row label="当前" value={status ?? '未检测'} />
        <Pressable
          onPress={check}
          disabled={checking}
          style={({ pressed }) => [styles.checkBtn, pressed && styles.pressed]}>
          {checking ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={styles.checkText}>检测连通性</Text>
          )}
        </Pressable>
        <Text style={styles.sectionHint}>
          真机调试要把地址换成电脑的局域网 IP，在项目根目录建 .env 写
          {'\n'}EXPO_PUBLIC_API_BASE=http://192.168.x.x:8080
        </Text>
      </View>

      <View style={styles.section}>
        <Pressable
          onPress={() => {
            signOut();
            setUserId(null);
            router.replace('/home');
          }}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}>
          <Text style={styles.logoutText}>退出登录</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>Undercurrent · 0.1.0 · Expo SDK 58</Text>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: space.lg,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { ...type.display, color: colors.foreground, letterSpacing: 1.2 },
  section: { padding: space.lg, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  sectionLabel: { ...type.label, color: colors.foreground },
  sectionHint: { ...type.small, color: colors.mutedForeground, lineHeight: 18 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginVertical: 4 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  stepText: { ...type.title, color: colors.foreground },
  stepValue: { ...type.title, color: colors.primary, minWidth: 78 },
  pressed: { opacity: 0.6 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: 6 },
  profileText: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { ...type.title, color: colors.foreground },
  role: {
    ...type.caption,
    color: colors.mutedForeground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  profileMeta: { ...type.small, color: colors.mutedForeground },
  row: { flexDirection: 'row', gap: space.md },
  rowLabel: { ...type.small, color: colors.mutedForeground, width: 42 },
  rowValue: { ...type.small, color: colors.foreground, flex: 1 },
  checkBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { ...type.label, color: colors.primaryForeground, fontWeight: '600' },
  footer: { ...type.caption, color: colors.mutedForeground, textAlign: 'center', marginTop: space.xl },
  /** 未登录视图 */
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: 10 },
  guestTitle: { ...type.title, color: colors.foreground, fontSize: 17 },
  guestHint: { ...type.small, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: space.sm,
    height: 40,
    paddingHorizontal: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  loginText: { fontSize: 14, fontWeight: '700', color: colors.primaryForeground },
  logoutBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    height: 34,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { ...type.label, color: colors.foreground },
});
