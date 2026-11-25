import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { colors, radius, space, type } from '@/constants/theme';
import { api } from '@/lib/api';
import { signIn } from '@/lib/auth';
import { useSession } from '@/lib/session';
import type { LoginResult } from '@/lib/types';

/** 登录页：账号 + 密码，服务端 BCrypt 校验，成功返回签名 token */
export default function LoginScreen() {
  const router = useRouter();
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
      signIn(result.token, result.user.id, result.user.handle);
      setUserId(result.user.id);
      // 没走过注册引导的老用户也补一次（风格/艺人/身份/年龄/城市）
      router.replace(result.needsOnboarding ? '/onboarding' : '/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="登录"
      subtitle="用你的账号进入 Undercurrent"
      footer={
        <Text style={styles.footer}>
          演示账号：admin / cashfans03{'\n'}
          未登录时只能停留在登录相关页面
        </Text>
      }>
      <TextInput
        value={account}
        onChangeText={(v) => {
          setAccount(v);
          setError(null);
        }}
        placeholder="邮箱或账号"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
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
        autoComplete="current-password"
        style={[styles.input, styles.gap]}
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <View style={styles.linkRow}>
        <Pressable onPress={() => router.push('/forgot-password')} hitSlop={6}>
          <Text style={styles.link}>忘记密码？</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={submit}
        disabled={!canSubmit}
        style={({ pressed }) => [
          styles.submit,
          !canSubmit && styles.disabled,
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
        onPress={() => router.push('/register')}
        style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}>
        <Text style={styles.ghostText}>注册新账号</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
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
  gap: { marginTop: 10 },
  linkRow: { alignItems: 'flex-end', marginTop: 10 },
  link: { ...type.small, color: colors.mutedForeground },
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
  disabled: { opacity: 0.4 },
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
  footer: { ...type.caption, color: colors.mutedForeground, textAlign: 'center', lineHeight: 19 },
});
