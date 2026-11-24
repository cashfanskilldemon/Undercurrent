import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { colors, radius, space, type } from '@/constants/theme';
import { api } from '@/lib/api';
import { signIn } from '@/lib/auth';
import { useSession } from '@/lib/session';
import type { LoginResult } from '@/lib/types';

/** 注册页：账号 + 密码 +（可选）昵称，成功后直接登录进首页 */
export default function RegisterScreen() {
  const router = useRouter();
  const { setUserId } = useSession();

  const [account, setAccount] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountOk = /^[a-zA-Z0-9_.]{3,20}$/.test(account.trim());
  const passwordOk = password.length >= 6;
  const sameOk = password.length > 0 && password === confirm;
  const canSubmit = accountOk && passwordOk && sameOk && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.post<LoginResult>('/api/auth/register', {
        account: account.trim(),
        password,
        nickname: nickname.trim() || undefined,
      });
      signIn(result.token, result.user.id, result.user.handle);
      setUserId(result.user.id);
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : '注册失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const hint = (() => {
    if (account.length > 0 && !accountOk) return '账号需为 3-20 位字母、数字、下划线或点';
    if (password.length > 0 && !passwordOk) return '密码至少 6 位';
    if (confirm.length > 0 && !sameOk) return '两次输入的密码不一致';
    return null;
  })();

  return (
    <AuthShell
      title="创建账号"
      subtitle="注册后即可发帖、上传作品"
      footer={
        <Pressable onPress={() => router.replace('/login')} style={styles.backLogin}>
          <Text style={styles.backLoginText}>已有账号？去登录</Text>
        </Pressable>
      }>
      <TextInput
        value={account}
        onChangeText={(v) => {
          setAccount(v);
          setError(null);
        }}
        placeholder="账号（3-20 位字母 / 数字）"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        style={styles.input}
      />

      <TextInput
        value={nickname}
        onChangeText={setNickname}
        placeholder="昵称（选填，默认用账号）"
        placeholderTextColor={colors.mutedForeground}
        autoCorrect={false}
        autoComplete="off"
        style={[styles.input, styles.gap]}
        maxLength={20}
      />

      <TextInput
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setError(null);
        }}
        placeholder="密码（至少 6 位）"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        style={[styles.input, styles.gap]}
      />

      <TextInput
        value={confirm}
        onChangeText={(v) => {
          setConfirm(v);
          setError(null);
        }}
        placeholder="确认密码"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        style={[styles.input, styles.gap]}
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
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
            <UserPlus size={16} color={colors.primaryForeground} />
            <Text style={styles.submitText}>注册并登录</Text>
          </>
        )}
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
  hint: { ...type.small, color: colors.mutedForeground, marginTop: 10 },
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
  backLogin: { alignSelf: 'center', padding: 6 },
  backLoginText: { ...type.small, color: colors.mutedForeground },
});
