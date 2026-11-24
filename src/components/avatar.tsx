import { StyleSheet, Text, View } from 'react-native';

import { hueColor, hueText } from '@/constants/theme';

/** Web 版没有头像图，用色相色块 + 首字代替 */
export function Avatar({
  name,
  hue,
  size = 40,
}: {
  name: string;
  hue: number;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: hueColor(hue) },
      ]}>
      <Text
        numberOfLines={1}
        style={[styles.text, { fontSize: Math.round(size * 0.42), color: hueText(hue) }]}>
        {name.slice(0, 1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '600' },
});
