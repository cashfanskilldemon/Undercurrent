import Svg, { Path } from 'react-native-svg';

import { colors } from '@/constants/theme';

/** 三条波纹，纯描边无底色，随主题反色 */
export function Logo({ size = 26, color = colors.foreground }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 5 Q12 13 21 5" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M3 10.5 Q12 18.5 21 10.5" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M3 16 Q12 24 21 16" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}
