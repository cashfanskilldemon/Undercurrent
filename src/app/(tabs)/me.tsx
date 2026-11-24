import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE, api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { colors, radius, space, type } from '@/constants/theme';
import { useBreakpoint } from '@/lib/use-breakpoint';

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const { wide } = useBreakpoint();
  const { userId, setUserId } = useSession();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
        <Text style={styles.sectionLabel}>调试身份</Text>
        <Text style={styles.sectionHint}>
          登录还没接，先用数字模拟。后端从请求头 X-User-Id 取当前用户，切换后点赞归属会变。
        </Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setUserId(Math.max(1, userId - 1))}
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}>
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.stepValue}>用户 #{userId}</Text>
          <Pressable
            onPress={() => setUserId(Math.min(10, userId + 1))}
            style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}>
            <Text style={styles.stepText}>＋</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionHint}>种子数据里有 10 个用户（1–10），2 号是「九号线」。</Text>
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
});
