import '@/global.css';

import { Redirect, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ComposerDialog } from '@/components/composer-dialog';
import { RightRail } from '@/components/right-rail';
import { SideNav } from '@/components/side-nav';
import { colors } from '@/constants/theme';
import { setCurrentUserId, setUnauthorizedHandler } from '@/lib/api';
import { restoreAuth, signOut } from '@/lib/auth';
import { ComposerProvider } from '@/lib/composer';
import { SessionContext } from '@/lib/session';
import { CENTER_MAX_WIDTH, RAIL_WIDTH, SIDE_NAV_WIDTH, useBreakpoint } from '@/lib/use-breakpoint';

export default function RootLayout() {
  // 启动时同步读回上次登录态（Web 存在 localStorage），避免刷新后闪一下登录页
  const [restored] = useState(() => restoreAuth());

  // 登录态：null = 未登录，此时只能停留在 /login
  const [userId, setUserId] = useState<number | null>(restored?.userId ?? null);

  // 在子组件发请求前先把身份写进 api 模块（渲染期赋值，静态副作用，无状态变更）
  setCurrentUserId(userId);

  // token 失效时后端返回 401，这里统一把界面切回游客态
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
      setUserId(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // 只在 Web 宽屏生效：≥768 左导航，≥1120 右栏；App 恒为单列
  const { wide, xl, width } = useBreakpoint();

  // 登录页要整屏独占：不显示左导航 / 右栏，也不限制中列宽度
  const pathname = usePathname();
  const bare = pathname === '/login';

  // 没登录只能待在登录页；已登录就不用再进登录页
  if (userId == null && !bare) {
    return <Redirect href="/login" />;
  }
  if (userId != null && bare) {
    return <Redirect href="/home" />;
  }

  /**
   * 中列要相对「整个视口」居中（对齐 Threads），但左右两侧宽度不对称
   * （导航 80 / 右栏 340），所以给中列容器补一段左侧内边距抵掉差值。
   * 空间不够时按剩余空白收缩补偿量，保证中列始终能拿到最大宽度。
   */
  const centerOffset = xl
    ? Math.min(
        RAIL_WIDTH - SIDE_NAV_WIDTH,
        Math.max(0, width - (SIDE_NAV_WIDTH + RAIL_WIDTH + CENTER_MAX_WIDTH)),
      )
    : 0;

  return (
    <SessionContext.Provider value={{ userId, setUserId }}>
      <ComposerProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.frame}>
          {wide && !bare ? <SideNav /> : null}

          {/* 中列：补偿左右两侧宽度差后，相对整个视口水平居中 */}
          <View
            style={[
              styles.centerArea,
              !bare && centerOffset > 0 && { paddingLeft: centerOffset },
            ]}>
            <View style={[styles.center, wide && !bare && styles.centerWide]}>
              <Stack
                key={userId ?? 'guest'}
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="thread/[id]"
                  options={{
                    headerShown: true,
                    title: '帖子',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.foreground,
                    headerShadowVisible: false,
                    headerBackTitle: '返回',
                  }}
                />
              </Stack>
            </View>
          </View>

          {xl && !bare ? <RightRail /> : null}
        </View>
        <ComposerDialog />
      </SafeAreaProvider>
      </ComposerProvider>
    </SessionContext.Provider>
  );
}

const styles = {
  frame: {
    flex: 1,
    flexDirection: 'row' as const,
    backgroundColor: colors.background,
  },
  /** 中列占位区：占满导航与右栏之间的剩余宽度，并把内容水平居中 */
  centerArea: {
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    minWidth: 0,
    backgroundColor: colors.background,
  },
  center: {
    width: '100%',
    backgroundColor: colors.background,
  },
  centerWide: {
    maxWidth: CENTER_MAX_WIDTH,
  },
};
