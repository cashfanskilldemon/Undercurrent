import { usePathname, router } from 'expo-router';
import {
  Bell,
  Disc3,
  Home,
  LogIn,
  MessageSquare,
  PenLine,
  Puzzle,
  Search,
  UserRound,
} from 'lucide-react-native';
import { useState, type ComponentType } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { SideMenu } from '@/components/side-menu';
import { colors, radius, space } from '@/constants/theme';
import { useComposer } from '@/lib/composer';
import { useSession } from '@/lib/session';
import { SIDE_NAV_WIDTH } from '@/lib/use-breakpoint';
import { useUnreadCount } from '@/lib/unread';

const NAV = [
  { href: '/home', label: '首页', Icon: Home },
  { href: '/discover', label: '发现', Icon: Search },
  { href: '/notifications', label: '通知', Icon: Bell },
  { href: '/', label: '讨论', Icon: MessageSquare },
  { href: '/tracks', label: '作品', Icon: Disc3 },
  { href: '/plugins', label: '插件', Icon: Puzzle },
] as const;

/** 帖子详情页算「讨论」的延伸，保持讨论高亮 */
function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname.startsWith('/thread');
  return pathname === href || pathname.startsWith(`${href}/`);
}

type IconType = ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;

/**
 * 尺寸取自 Instagram 桌面端导航（2025 版）：
 * 折叠胶囊 48×48、图标 24、展开宽 196、圆角 8、图标与文字间距 16、行间距 4
 */
const ITEM_HEIGHT = 48;
const COLLAPSED_WIDTH = 48;
const EXPANDED_NAV_WIDTH = 200;
const EXPANDED_COMPOSE_WIDTH = 170;
const ICON_SIZE = 28;
const LABEL_GAP = 16;

/**
 * 单个导航行：悬停时胶囊从左向右推出，文字跟着胶囊一起从左侧滑入（CSS transition 驱动）。
 * hover 事件绑在会变宽的按钮本身 —— 鼠标跟随时不会被判定为「离开」而立刻收回。
 * 动画样式写在 global.css 的 [data-testid='nav-pill']，避开 RN Web SSR 的样式编译器。
 */
function NavRow({
  label,
  Icon,
  active,
  badge,
  variant = 'nav',
  onPress,
}: {
  label: string;
  Icon: IconType;
  active: boolean;
  badge?: number;
  variant?: 'nav' | 'compose';
  onPress: () => void;
}) {
  const isCompose = variant === 'compose';
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const web = Platform.OS === 'web';

  const hoverProps = web
    ? {
        onMouseMove: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }
    : {};

  const expanded = hovered || pressed;
  const width = expanded
    ? isCompose
      ? EXPANDED_COMPOSE_WIDTH
      : EXPANDED_NAV_WIDTH
    : COLLAPSED_WIDTH;
  const bg = isCompose
    ? colors.primary
    : expanded
      ? colors.elevated
      : active
        ? colors.accent
        : 'transparent';
  const iconColor = isCompose
    ? colors.primaryForeground
    : active
      ? colors.primary
      : colors.foreground;

  // Web 端位移/透明度全部交给 CSS；原生端没有 hover，直接给最终值
  const labelFx = web
    ? null
    : { opacity: expanded ? 1 : 0, transform: [{ translateX: expanded ? 0 : -LABEL_GAP }] };

  return (
    <View style={[styles.itemWrap, isCompose && styles.composeWrap]}>
      <Pressable
        testID={expanded ? 'nav-pill-open' : 'nav-pill'}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        {...hoverProps}
        style={[styles.item, { width, backgroundColor: bg }, pressed && styles.pressed]}
        accessibilityLabel={label}>
        <View style={styles.iconSlot}>
          <Icon
            size={ICON_SIZE}
            strokeWidth={isCompose ? 2.1 : active ? 2.2 : 1.8}
            color={iconColor}
          />
          {!isCompose && !!badge && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
            </View>
          )}
        </View>
        <Text
          testID="nav-label"
          style={[styles.label, isCompose && styles.composeLabel, labelFx]}
          numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

/** 宽屏 Web 的 Instagram 式左导航：窄图标栏，悬停时胶囊 + 文字一起从左向右推出 */
export function SideNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { openComposer } = useComposer();
  const { userId } = useSession();
  const unread = useUnreadCount();
  const { width } = useWindowDimensions();
  /** 80px 栏放不下英文标，让它伸到导航右侧的空白里；窗口窄到会把内容压住时隐藏 */
  const showWordmark = width >= 1400;

  const loggedIn = userId != null;
  const meActive = pathname === '/me' || pathname.startsWith('/me/');

  return (
    <View style={[styles.nav, { paddingTop: Math.max(insets.top, 20) }]}>
      <Pressable
        onPress={() => router.push('/')}
        style={styles.logoBtn}
        accessibilityLabel="UNDERCURRENT 首页">
        {/* 横向锁定：波浪标居中于 80px 栏，英文标挂在右侧空白里 */}
        <View style={styles.brandRow} pointerEvents="none">
          <Logo size={34} />
          {showWordmark ? (
            <Text style={[styles.brandText, Platform.OS === 'web' && styles.brandTextWeb]} numberOfLines={1}>
              UNDERCURRENT
            </Text>
          ) : null}
        </View>
      </Pressable>

      {/* LOGO 旁的菜单：外观 / 声音 / 设置 / 报告问题 / 退出 */}
      <SideMenu
        left={showWordmark ? 205 : 66}
        top={Math.max(insets.top, 20) + 5}
      />

      <View style={styles.menuArea}>
        <View style={styles.menu}>
          {NAV.map(({ href, label, Icon }) => (
            <NavRow
              key={href}
              label={label}
              Icon={Icon}
              active={isActive(pathname, href)}
              badge={loggedIn && href === '/notifications' ? unread : undefined}
              onPress={() => router.push(href)}
            />
          ))}
        </View>
      </View>

      <NavRow
        label="发帖"
        Icon={PenLine}
        variant="compose"
        active={false}
        onPress={() => openComposer('post')}
      />

      {loggedIn ? (
        <NavRow
          label="我的"
          Icon={UserRound}
          active={meActive}
          onPress={() => router.push('/me')}
        />
      ) : (
        <NavRow
          label="登录"
          Icon={LogIn}
          active={pathname === '/login'}
          onPress={() => router.push('/login')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    width: SIDE_NAV_WIDTH,
    flexShrink: 0,
    alignItems: 'center',
    paddingBottom: 20,
    backgroundColor: colors.background,
    /** 下拉菜单要浮在内容之上：nav 需定位，否则 zIndex 不生效 */
    position: 'relative',
    zIndex: 30,
  },
  /** 品牌区：波浪标居中在 80px 栏里，英文标横向挂在它右侧（横排容器宽于栏，避免被 80px 截断） */
  logoBtn: {
    width: SIDE_NAV_WIDTH,
    height: 44,
    marginBottom: space.lg,
  },
  brandRow: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 44,
    width: 260,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 23,
  },
  /** 品牌文字标：纯白、字号比导航大一号、圆体（Web 用内置 Nunito） */
  brandText: {
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 1.6,
    color: colors.strong,
  },
  brandTextWeb: { fontFamily: 'Undercurrent Rounded' },
  menuArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /** Ins 导航行间距 4px */
  menu: { gap: 4, alignItems: 'center' },
  /** 固定锚点宽度，展开的胶囊只向右溢出，不会被居中容器裁掉 */
  itemWrap: { width: COLLAPSED_WIDTH, alignItems: 'flex-start' },
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  iconSlot: { width: ICON_SIZE, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  /** Ins 导航文字 16px / 常规字重 */
  label: {
    marginLeft: LABEL_GAP,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.foreground,
    flexShrink: 0,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, lineHeight: 14, fontWeight: '700', color: '#fff' },
  composeWrap: { width: COLLAPSED_WIDTH, alignItems: 'flex-start', marginBottom: 4 },
  composeLabel: { color: colors.primaryForeground },
});
