import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { colors, radius, space, type } from '@/constants/theme';
import { api } from '@/lib/api';
import { signIn } from '@/lib/auth';
import { useSession } from '@/lib/session';
import type { CodeResult, LoginResult } from '@/lib/types';

type Mode = 'email' | 'account';

const EMAIL_RE = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/;
const ACCOUNT_RE = /^[a-zA-Z0-9_.]{3,20}$/;
const RESEND_SECONDS = 60;

/** 注册页：邮箱（带邮箱验证码）或账号两种方式，成功后直接登录进首页 */
export default function RegisterScreen() {
  const router = useRouter();
  const { setUserId } = useSession();

  const [mode, setMode] = useState<Mode>('email');
  const [account, setAccount] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const emailOk = EMAIL_RE.test(email.trim());
  const idOk = mode === 'email' ? emailOk : ACCOUNT_RE.test(account.trim());
  const codeOk = mode === 'email' ? /^\d{6}$/.test(code) : true;
  const passwordOk = password.length >= 6;
  const sameOk = password.length > 0 && password === confirm;
  const canSubmit = idOk && codeOk && passwordOk && sameOk && !submitting;

  const sendCode = async () => {
    if (!emailOk || countdown > 0 || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.post<CodeResult>('/api/auth/email-code', {
        email: email.trim(),
        scene: 'register',
      });
      setCountdown(RESEND_SECONDS);
      setDevCode(res.devCode ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.post<LoginResult>('/api/auth/register', {
        ...(mode === 'email' ? { email: email.trim(), emailCode: code } : { account: account.trim() }),
        password,
        nickname: nickname.trim() || undefined,
      });
      signIn(result.token, result.user.id, result.user.handle);
      setUserId(result.user.id);
      // 注册后的第一个环节：选喜欢的风格、艺人、身份、年龄段、城市
      router.replace(result.needsOnboarding === false ? '/home' : '/onboarding');
    } catch (e) {
      setError(e instanceof Error ? e.message : '注册失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const hint = (() => {
    if (mode === 'email' && email.length > 0 && !emailOk) return '请输入正确的邮箱';
    if (mode === 'account' && account.length > 0 && !idOk) return '账号需为 3-20 位字母、数字、下划线或点';
    if (password.length > 0 && !passwordOk) return '密码至少 6 位';
    if (confirm.length > 0 && !sameOk) return '两次输入的密码不一致';
    return null;
  })();

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setDevCode(null);
  };

  return (
    <AuthShell
      title="创建账号"
      subtitle="注册后即可发帖、上传作品"
      footer={
        <Pressable onPress={() => router.replace('/login')} style={styles.backLogin}>
          <Text style={styles.backLoginText}>已有账号？去登录</Text>
        </Pressable>
      }>
      <View style={styles.segment}>
        {(['email', 'account'] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => switchMode(m)}
            style={[styles.segmentItem, mode === m && styles.segmentItemActive]}>
            <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
              {m === 'email' ? '邮箱' : '账号'}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'email' ? (
        <>
          <View style={styles.codeRow}>
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v.trim());
                setError(null);
              }}
              placeholder="邮箱"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              style={[styles.input, styles.flex]}
            />
            <Pressable
              onPress={sendCode}
              disabled={!emailOk || countdown > 0 || sending}
              style={({ pressed }) => [
                styles.codeBtn,
                (!emailOk || countdown > 0) && styles.codeBtnDisabled,
                pressed && styles.pressed,
              ]}>
              {sending ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Text style={styles.codeBtnText}>
                  {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                </Text>
              )}
            </Pressable>
          </View>

          <TextInput
            value={code}
            onChangeText={(v) => {
              setCode(v.replace(/\D/g, '').slice(0, 6));
              setError(null);
            }}
            placeholder="6 位验证码"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.input, styles.gap]}
          />
          {devCode ? <Text style={styles.devHint}>演示环境未发真实邮件，验证码：{devCode}</Text> : null}
        </>
      ) : (
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
      )}

      <TextInput
        value={nickname}
        onChangeText={setNickname}
        placeholder={mode === 'email' ? '昵称（选填，默认用邮箱前缀）' : '昵称（选填，默认用账号）'}
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

      <Text style={styles.note}>手机号后续用于实名认证，注册阶段不要求填写。</Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.full,
    backgroundColor: colors.input,
    marginBottom: space.md,
  },
  segmentItem: {
    flex: 1,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: { backgroundColor: colors.elevated },
  segmentText: { fontSize: 13.5, fontWeight: '600', color: colors.mutedForeground },
  segmentTextActive: { color: colors.foreground },
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
  flex: { flex: 1 },
  gap: { marginTop: 10 },
  codeRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  codeBtn: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 108,
  },
  codeBtnDisabled: { opacity: 0.45 },
  codeBtnText: { ...type.small, color: colors.foreground, fontWeight: '600' },
  devHint: { ...type.caption, color: colors.primary, marginTop: 8 },
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
  note: {
    ...type.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: space.md,
  },
  backLogin: { alignSelf: 'center', padding: 6 },
  backLoginText: { ...type.small, color: colors.mutedForeground },
});
