import { useRouter } from 'expo-router';
import { Check, MailQuestion, Send } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { colors, radius, space, type } from '@/constants/theme';
import { api } from '@/lib/api';

/**
 * 忘记密码：本环境没有邮件 / 短信服务，提交后会生成一条站内通知给管理员，
 * 由管理员核实身份后重置（页面不暴露账号是否存在）。
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = account.trim().length > 0 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/auth/forgot-password', { account: account.trim() });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthShell title="申请已提交" footer={<BackToLogin onPress={() => router.replace('/login')} />}>
        <View style={styles.doneBox}>
          <View style={styles.doneIcon}>
            <Check size={22} color={colors.primaryForeground} />
          </View>
          <Text style={styles.doneTitle}>已通知管理员</Text>
          <Text style={styles.doneText}>
            我们已把你的重置申请发给管理员，核实身份后会帮你重置密码。
            {'\n'}如果账号不存在，这条申请不会生效。
          </Text>
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
      title="忘记密码"
      subtitle="提交账号，由管理员帮你重置"
      footer={<BackToLogin onPress={() => router.replace('/login')} />}>
      <View style={styles.notice}>
        <MailQuestion size={16} color={colors.mutedForeground} />
        <Text style={styles.noticeText}>
          当前环境没有接入邮件服务，提交后会生成一条申请通知给管理员，请留意处理进度。
        </Text>
      </View>

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
        returnKeyType="go"
        onSubmitEditing={submit}
      />

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
            <Text style={styles.submitText}>提交申请</Text>
          </>
        )}
      </Pressable>
    </AuthShell>
  );
}

function BackToLogin({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.backLogin}>
      <Text style={styles.backLoginText}>返回登录</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: space.lg,
  },
  noticeText: { ...type.small, color: colors.mutedForeground, flex: 1, lineHeight: 18 },
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
  doneBox: { alignItems: 'center', gap: 8, paddingVertical: space.md },
  doneIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  doneTitle: { ...type.title, color: colors.foreground },
  doneText: {
    ...type.small,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 19,
  },
});
