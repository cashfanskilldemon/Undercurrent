import { useRouter } from 'expo-router';
import { ChevronLeft, LogIn } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { colors, radius, space, type } from '@/constants/theme';
import { api, setAuthToken } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { LoginResult } from '@/lib/types';

/**
 * 独立登录页：整屏独占（根布局在 /login 时不渲染导航与右栏）。
 * 账号（app_user.handle）+ 密码，服务端 BCrypt 校验，成功返回签名 token。
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setUserId } = useSession();
  const { width } = useWindowDimensions();
  const showBackdrop = width >= 900 && Platform.OS === 'web';

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = account.trim().length > 0 && password.length > 0 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.post<LoginResult>('/api/auth/login', {
        account: account.trim(),
        password,
      });
      setAuthToken(result.token);
      setUserId(result.user.id);
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      {showBackdrop ? <Backdrop /> : null}

      <Pressable
        onPress={() => router.replace('/home')}
        hitSlop={10}
        style={[styles.backBtn, { top: insets.top + 16 }]}>
        <ChevronLeft size={20} color={colors.mutedForeground} />
        <Text style={styles.backText}>返回</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.brand}>
            <Logo size={52} />
            <Text style={styles.brandName}>UNDERCURRENT</Text>
            <Text style={styles.brandSub}>地下嘻哈 × 电子音乐</Text>
          </View>

          <Text style={styles.title}>登录</Text>
          <Text style={styles.subtitle}>用你的账号进入 Undercurrent</Text>

          <TextInput
            value={account}
            onChangeText={(v) => {
              setAccount(v);
              setError(null);
            }}
            placeholder="账号"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            returnKeyType="next"
          />

          <TextInput
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError(null);
            }}
            placeholder="密码"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, styles.inputGap]}
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.submit,
              !canSubmit && styles.submitDisabled,
              pressed && canSubmit && styles.pressed,
            ]}>
            {submitting ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <LogIn size={16} color={colors.primaryForeground} />
                <Text style={styles.submitText}>登录</Text>
              </>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>或</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={() => router.replace('/home')}
            style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}>
            <Text style={styles.ghostText}>先随便逛逛</Text>
          </Pressable>

          <Text style={styles.footer}>
            演示账号：admin / cashfans03{'\n'}
            登录态只存在本地内存，刷新页面会恢复为游客
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/** 背景装饰：几行旋转的站点名，透明度极低，不抢内容 */
function Backdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Text style={[styles.bgWord, { top: 40, left: -80, transform: [{ rotate: '-14deg' }] }]}>
        UNDERCURRENT
      </Text>
      <Text style={[styles.bgWord, { top: 210, right: -120, transform: [{ rotate: '10deg' }] }]}>
        UNDERCURRENT
      </Text>
      <Text style={[styles.bgWord, { bottom: 60, left: -60, transform: [{ rotate: '8deg' }] }]}>
        UNDERCURRENT
      </Text>
      <Text style={[styles.bgWord, { bottom: -20, right: -140, transform: [{ rotate: '-9deg' }] }]}>
        UNDERCURRENT
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  bgWord: {
    position: 'absolute',
    fontSize: 88,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#ffffff',
    opacity: 0.04,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingRight: 8,
  },
  backText: { ...type.small, color: colors.mutedForeground },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  card: { width: '100%', maxWidth: 380 },
  brand: { alignItems: 'center', gap: 8, marginBottom: space.xl },
  brandName: { fontSize: 15, fontWeight: '600', letterSpacing: 2.6, color: colors.foreground },
  brandSub: { ...type.small, color: colors.mutedForeground, letterSpacing: 1 },
  title: { ...type.display, fontSize: 24, color: colors.foreground, textAlign: 'center' },
  subtitle: {
    ...type.small,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: space.xl,
  },
  input: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.foreground,
  },
  inputGap: { marginTop: 10 },
  error: { ...type.small, color: colors.destructive, marginTop: 10 },
  submit: {
    marginTop: space.lg,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
  submitText: { fontSize: 15, fontWeight: '700', color: colors.primaryForeground },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: space.lg,
    marginBottom: space.lg,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: { ...type.caption, color: colors.mutedForeground },
  ghost: {
    height: 46,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { fontSize: 14.5, fontWeight: '600', color: colors.foreground },
  footer: {
    ...type.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: space.xl,
  },
});
