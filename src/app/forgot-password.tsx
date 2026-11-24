import { useRouter } from 'expo-router';
import { Check, Send } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { colors, radius, space, type } from '@/constants/theme';
import { api } from '@/lib/api';
import type { SmsCodeResult } from '@/lib/types';

const PHONE_RE = /^1[3-9]\d{9}$/;
const RESEND_SECONDS = 60;

/** 忘记密码：手机号 + 短信验证码 + 新密码 */
export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const phoneOk = PHONE_RE.test(phone.trim());
  const codeOk = /^\d{6}$/.test(code);
  const passwordOk = password.length >= 6;
  const sameOk = password.length > 0 && password === confirm;
  const canSubmit = phoneOk && codeOk && passwordOk && sameOk && !submitting;

  const sendCode = async () => {
    if (!phoneOk || countdown > 0 || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.post<SmsCodeResult>('/api/auth/sms-code', {
        phone: phone.trim(),
        scene: 'reset',
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
      await api.post('/api/auth/reset-password', {
        phone: phone.trim(),
        code,
        newPassword: password,
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '重置失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        title="密码已重置"
        footer={
          <Pressable onPress={() => router.replace('/login')} style={styles.backLogin}>
            <Text style={styles.backLoginText}>去登录</Text>
          </Pressable>
        }>
        <View style={styles.doneBox}>
          <View style={styles.doneIcon}>
            <Check size={22} color={colors.primaryForeground} />
          </View>
          <Text style={styles.doneText}>请用新密码登录，之前的登录失败次数已清零。</Text>
        </View>
        <Pressable
          onPress={() => router.replace('/login')}
          style={({ pressed }) => [styles.submit, pressed && styles.pressed]}>
          <Text style={styles.submitText}>返回登录</Text>
        </Pressable>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="重置密码"
      subtitle="用注册手机号接收验证码"
      footer={
        <Pressable onPress={() => router.replace('/login')} style={styles.backLogin}>
          <Text style={styles.backLoginText}>返回登录</Text>
        </Pressable>
      }>
      <View style={styles.codeRow}>
        <TextInput
          value={phone}
          onChangeText={(v) => {
            setPhone(v.replace(/\D/g, '').slice(0, 11));
            setError(null);
          }}
          placeholder="注册手机号"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
          autoComplete="tel"
          maxLength={11}
          style={[styles.input, styles.flex]}
        />
        <Pressable
          onPress={sendCode}
          disabled={!phoneOk || countdown > 0 || sending}
          style={({ pressed }) => [
            styles.codeBtn,
            (!phoneOk || countdown > 0) && styles.codeBtnDisabled,
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
      {devCode ? <Text style={styles.devHint}>演示环境未接真实短信，验证码：{devCode}</Text> : null}

      <TextInput
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setError(null);
        }}
        placeholder="新密码（至少 6 位）"
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
        placeholder="确认新密码"
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        style={[styles.input, styles.gap]}
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {password.length > 0 && !passwordOk ? (
        <Text style={styles.hint}>密码至少 6 位</Text>
      ) : null}
      {confirm.length > 0 && !sameOk ? <Text style={styles.hint}>两次输入的密码不一致</Text> : null}
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
            <Send size={15} color={colors.primaryForeground} />
            <Text style={styles.submitText}>重置密码</Text>
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
  backLogin: { alignSelf: 'center', padding: 6 },
  backLoginText: { ...type.small, color: colors.mutedForeground },
  doneBox: { alignItems: 'center', gap: 10, paddingVertical: space.md },
  doneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { ...type.small, color: colors.mutedForeground, textAlign: 'center', lineHeight: 19 },
});
