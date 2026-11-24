import { useRouter } from 'expo-router';
import { ChevronLeft, LogIn } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { colors, radius, space, type } from '@/constants/theme';
import { api, setAuthToken } from '@/lib/api';
import { useSession } from '@/lib/session';
import type { LoginResult } from '@/lib/types';
import { CENTER_MAX_WIDTH, useBreakpoint } from '@/lib/use-breakpoint';

/**
 * 登录页：账号（app_user.handle）+ 密码，服务端 PBKDF2 校验。
 * 登录成功后把返回的用户 id 写进会话，后续请求带 X-User-Id。
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wide } = useBreakpoint();
  const { setUserId } = useSession();

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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.header, { paddingTop: wide ? 16 : insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>登录</Text>
      </View>

      <View style={[styles.body, wide && styles.bodyWide]}>
        <View style={styles.brand}>
          <Logo size={44} />
          <Text style={styles.brandName}>UNDERCURRENT</Text>
          <Text style={styles.brandSub}>地下嘻哈 × 电子音乐</Text>
        </View>

        <Text style={styles.fieldLabel}>账号</Text>
        <TextInput
          value={account}
          onChangeText={(v) => {
            setAccount(v);
            setError(null);
          }}
          placeholder="用户名，例如 admin"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          returnKeyType="next"
        />

        <Text style={styles.fieldLabel}>密码</Text>
        <TextInput
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setError(null);
          }}
          placeholder="输入密码"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          returnKeyType="go"
          onSubmitEditing={submit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.submitBtn,
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

        <Pressable onPress={() => router.replace('/home')} style={styles.skip}>
          <Text style={styles.skipText}>先随便逛逛</Text>
        </Pressable>

        <Text style={styles.footer}>
          演示账号：admin / cashfans03{'\n'}
          登录态只存在本地内存，刷新页面会恢复为游客。
        </Text>
      </View>
    </ScrollView>
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
  body: { paddingHorizontal: space.lg, paddingTop: 8 },
  bodyWide: { width: '100%', maxWidth: CENTER_MAX_WIDTH, alignSelf: 'center' },
  brand: { alignItems: 'center', gap: 8, paddingVertical: space.xl, marginBottom: space.sm },
  brandName: { fontSize: 15, fontWeight: '600', letterSpacing: 2.4, color: colors.foreground },
  brandSub: { ...type.small, color: colors.mutedForeground, letterSpacing: 1 },
  fieldLabel: { ...type.label, color: colors.mutedForeground, marginTop: space.md, marginBottom: 6 },
  input: {
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 14.5,
    color: colors.foreground,
  },
  error: { ...type.small, color: colors.destructive, marginTop: 10 },
  submitBtn: {
    marginTop: space.xl,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  submitText: { fontSize: 15, fontWeight: '700', color: colors.primaryForeground },
  skip: { alignSelf: 'center', marginTop: space.lg, padding: 6 },
  skipText: { ...type.small, color: colors.mutedForeground },
  footer: {
    ...type.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: space.xl,
  },
});
