import { router } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Sun,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { signOut } from '@/lib/auth';
import { useComposer } from '@/lib/composer';
import { useSession } from '@/lib/session';
import {
  applyTheme,
  readThemeChoice,
  saveTheme,
  systemScheme,
  type ColorScheme,
  type ThemeChoice,
} from '@/lib/theme-mode';

type Detail = 'appearance' | 'sound' | null;
type SegmentIcon = 'sun' | 'moon' | 'auto';

const SOUND_DYNAMIC_KEY = 'undercurrent.sound.dynamic';
const SOUND_MESSAGE_KEY = 'undercurrent.sound.message';
/** 主菜单保持原宽，只有子页往右延伸；两页宽度不同，滑动距离按主菜单宽度算 */
const ROOT_WIDTH = 232;
const DETAIL_WIDTH = 320;
/** 退出动画时长，需与 global.css 的 side-menu-close 保持一致 */
const CLOSE_MS = 180;

function readStored(key: string): string | null {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function saveStored(key: string, value: string) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // 隐私模式忽略
  }
}

/**
 * LOGO 旁的菜单按钮：Threads 式横向滑动切换主菜单 / 子菜单。
 * 滑动与高度过渡交给 CSS transition（global.css），走 GPU 合成不卡顿。
 */
export function SideMenu({ left, top }: { left: number; top: number }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [detail, setDetail] = useState<Detail>(null);
  const [rootH, setRootH] = useState(236);
  const [detailH, setDetailH] = useState(130);

  const [theme, setTheme] = useState<ThemeChoice>(() => readThemeChoice());
  const [soundDynamic, setSoundDynamic] = useState(() => readStored(SOUND_DYNAMIC_KEY) !== 'off');
  const [soundMessage, setSoundMessage] = useState(() => readStored(SOUND_MESSAGE_KEY) !== 'off');
  /** 跟随系统主题：监听浏览器深浅色变化，选「自动」时据此决定实际模式 */
  const [deviceScheme, setDeviceScheme] = useState<ColorScheme>(() => systemScheme());
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const scheme = mq.matches ? 'dark' : 'light';
      setDeviceScheme(scheme);
      // 选了「自动」时，系统主题变化要立即反映到界面
      if (readThemeChoice() === 'auto') applyTheme('auto');
    };
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const { setUserId } = useSession();
  const { openComposer } = useComposer();

  /** 收起：先播退出动画，结束后再卸载；重复调用不叠加定时器 */
  const close = useCallback(() => {
    if (closeTimer.current) return;
    setClosing(true);
    setDetail(null);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
      closeTimer.current = null;
    }, CLOSE_MS);
  }, []);
  const back = () => setDetail(null);

  /** 收起动画中再次点按钮：取消关闭，保持打开 */
  const cancelClose = useCallback(() => {
    if (!closeTimer.current) return;
    clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setClosing(false);
  }, []);
  const toggle = () => {
    if (closing) cancelClose();
    else if (open) close();
    else setOpen(true);
  };

  // 组件卸载时清掉定时器
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const chooseTheme = (value: ThemeChoice) => {
    setTheme(value);
    saveTheme(value); // 真正换肤：写 localStorage + <html data-theme>
    back();
  };
  const toggleSound = (key: 'dynamic' | 'message') => {
    if (key === 'dynamic') {
      const next = !soundDynamic;
      setSoundDynamic(next);
      saveStored(SOUND_DYNAMIC_KEY, next ? 'on' : 'off');
    } else {
      const next = !soundMessage;
      setSoundMessage(next);
      saveStored(SOUND_MESSAGE_KEY, next ? 'on' : 'off');
    }
  };

  const logout = () => {
    signOut();
    setUserId(null);
    close();
    router.replace('/home');
  };

  return (
    <>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.trigger, { left, top }, pressed && styles.pressed]}
        accessibilityLabel="打开菜单">
        <Menu size={22} strokeWidth={1.8} color={colors.foreground} />
      </Pressable>

      {open ? (
        <>
          <Pressable
            testID={closing ? 'side-menu-backdrop-closing' : 'side-menu-backdrop'}
            style={styles.backdrop}
            onPress={close}
            accessibilityLabel="关闭菜单"
          />
          <View
            testID={closing ? 'side-menu-panel-closing' : 'side-menu-panel'}
            style={[
              styles.menu,
              {
                left,
                top: top + 44,
                width: detail ? DETAIL_WIDTH : ROOT_WIDTH,
                height: detail ? detailH : rootH,
              },
            ]}>
            <View
              testID="side-menu-pages"
              style={[
                styles.pages,
                { transform: [{ translateX: detail ? -ROOT_WIDTH : 0 }] },
              ]}>
              {/* 第一页：主菜单（保持原宽） */}
              <View
                style={[styles.page, styles.pageRoot]}
                onLayout={(e) => setRootH(e.nativeEvent.layout.height)}>
                <Row label="外观" chevron onPress={() => setDetail('appearance')} />
                <Row label="声音" chevron onPress={() => setDetail('sound')} />
                <Row label="设置" onPress={() => { close(); router.push('/me'); }} />
                <Separator />
                <Row
                  label="报告问题"
                  onPress={() => {
                    close();
                    openComposer('post', { tag: '反馈' });
                  }}
                />
                <Row label="退出" danger onPress={logout} />
              </View>

              {/* 第二页：子菜单（外观 / 声音，往右延伸） */}
              <View
                style={[styles.page, styles.pageDetail]}
                onLayout={(e) => setDetailH(e.nativeEvent.layout.height)}>
                <View style={styles.detailHead}>
                  <Pressable onPress={back} hitSlop={8} style={styles.backBtn}>
                    <ChevronLeft size={20} strokeWidth={2} color={colors.foreground} />
                  </Pressable>
                  <Text style={styles.detailTitle}>
                    {detail === 'sound' ? '声音' : '外观'}
                  </Text>
                </View>
                {detail === 'sound' ? (
                  <>
                    <Text style={styles.detailHint}>收到新通知时，在设备上播放提示音。</Text>
                    <SwitchRow label="动态" on={soundDynamic} onToggle={() => toggleSound('dynamic')} />
                    <SwitchRow label="消息" on={soundMessage} onToggle={() => toggleSound('message')} />
                  </>
                ) : (
                  <>
                    <Separator />
                    <View style={styles.segment}>
                      <Segment icon="sun" selected={theme === 'light'} onPress={() => chooseTheme('light')} />
                      <Segment icon="moon" selected={theme === 'dark'} onPress={() => chooseTheme('dark')} />
                      <Segment icon="auto" selected={theme === 'auto'} onPress={() => chooseTheme('auto')} />
                    </View>
                    {theme === 'auto' ? (
                      <Text style={styles.autoHint}>
                        当前设备为{deviceScheme === 'dark' ? '深色' : '浅色'}模式
                      </Text>
                    ) : null}
                  </>
                )}
              </View>
            </View>
          </View>
        </>
      ) : null}
    </>
  );
}

function Row({
  label,
  hint,
  chevron,
  danger,
  onPress,
}: {
  label: string;
  hint?: string;
  chevron?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
      {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      {chevron ? <ChevronRight size={15} color={colors.mutedForeground} /> : null}
    </Pressable>
  );
}

function Segment({
  icon,
  selected,
  onPress,
}: {
  icon: SegmentIcon;
  selected: boolean;
  onPress: () => void;
}) {
  if (icon === 'auto') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.segmentItem,
          selected && styles.segmentSelected,
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>自动</Text>
      </Pressable>
    );
  }
  const Icon = icon === 'sun' ? Sun : Moon;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentItem,
        selected && styles.segmentSelected,
        pressed && styles.pressed,
      ]}>
      <Icon size={18} strokeWidth={1.8} color={selected ? colors.foreground : colors.mutedForeground} />
    </Pressable>
  );
}

/** 声音页的开关行：点整行切换，右侧是 Threads 式滑块 */
function SwitchRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <View style={[styles.switchTrack, on && styles.switchTrackOn]}>
        <View style={[styles.switchThumb, on && styles.switchThumbOn]} />
      </View>
    </Pressable>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  /** 点菜单外任意位置关闭：Web 用 fixed 铺满视口，原生端退化为导航栏区域 */
  backdrop: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  /** 剪裁出滑动窗口；高度随当前页变化，过渡由 global.css 驱动 */
  menu: {
    position: 'absolute',
    zIndex: 50,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: colors.menuBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.menuBorder,
  },
  /** 关键：交叉轴不拉伸，两页各自按内容高度布局，弹层才能随页收缩/展开 */
  pages: { flexDirection: 'row', alignItems: 'flex-start', width: ROOT_WIDTH + DETAIL_WIDTH },
  page: { paddingVertical: 6 },
  pageRoot: { width: ROOT_WIDTH },
  pageDetail: { width: DETAIL_WIDTH },
  row: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  rowPressed: { backgroundColor: colors.menuPressed },
  rowLabel: { flex: 1, fontSize: 14, color: colors.foreground },
  rowHint: { fontSize: 12, color: colors.mutedForeground },
  dangerText: { color: colors.destructive },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.menuDivider,
    marginVertical: 6,
  },
  detailHead: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  backBtn: { position: 'absolute', left: 12 },
  detailTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  segment: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.menuSegment,
  },
  segmentItem: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
  },
  segmentSelected: { backgroundColor: colors.menuSelected },
  segmentText: { fontSize: 13, color: colors.mutedForeground },
  segmentTextSelected: { color: colors.foreground, fontWeight: '600' },
  autoHint: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingBottom: 6,
  },
  detailHint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedForeground,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  switchRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  switchLabel: { fontSize: 14, color: colors.foreground },
  switchTrack: {
    width: 38,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.switchTrack,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchTrackOn: { backgroundColor: colors.primary },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.switchThumb,
  },
  switchThumbOn: { alignSelf: 'flex-end' },
});
