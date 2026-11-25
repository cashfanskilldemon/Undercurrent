import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { Logo } from '@/components/logo';
import { colors, space, type } from '@/constants/theme';

/**
 * 登录 / 注册 / 忘记密码三页共用的外壳：
 * 整屏背景 + 旋转水印 + 居中卡片 + 品牌区，保证几页视觉完全一致。
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const showBackdrop = width >= 900 && Platform.OS === 'web';

  return (
    <View style={styles.screen}>
      {showBackdrop ? <Backdrop /> : null}

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

          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {children}
        </View>

        {footer ? <View style={styles.footerSlot}>{footer}</View> : null}
      </ScrollView>
    </View>
  );
}

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
    color: colors.strong,
    opacity: 0.04,
  },
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
  footerSlot: { width: '100%', maxWidth: 380, marginTop: space.xl },
});
