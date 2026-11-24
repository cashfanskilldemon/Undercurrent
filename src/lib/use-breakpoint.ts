import { Platform, useWindowDimensions } from 'react-native';

/**
 * 响应式断点：只在 Web 上生效，App（iOS/Android）永远是单列手机布局。
 * 与原 Undercurrent-web 的栅格保持一致：
 *   wide = ≥768px   左侧导航出现，底部 tab 隐藏（两栏）
 *   xl   = ≥1120px  右侧推荐栏出现（三栏），中列收窄居中
 */
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  return {
    isWeb,
    wide: isWeb && width >= 768,
    xl: isWeb && width >= 1120,
    width,
  };
}

/** 宽屏下的中列内容最大宽度：Threads 内容列 640，这里比它稍宽一点 */
export const CENTER_MAX_WIDTH = 680;
/** 左侧导航宽（Instagram 式窄图标栏，图标居中） */
export const SIDE_NAV_WIDTH = 80;
/** 右侧推荐栏宽（收窄一点让它更贴右边缘） */
export const RAIL_WIDTH = 340;
