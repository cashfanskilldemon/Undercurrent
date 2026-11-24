import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radius, space, type } from '@/constants/theme';

/** 横向筛选胶囊：讨论频道 / 作品流派 / 插件分类共用 */
export function Chips({
  options,
  value,
  onChange,
  allLabel = '全部',
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  allLabel?: string;
}) {
  const list = [allLabel, ...options.filter((o) => o !== allLabel)];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.wrap}>
      {list.map((item) => {
        const active = item === value;
        return (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            style={({ pressed }) => [
              styles.pill,
              active ? styles.pillActive : styles.pillIdle,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.text, active ? styles.textActive : styles.textIdle]}>{item}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 0 },
  row: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md },
  pill: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillIdle: { backgroundColor: 'transparent', borderColor: colors.border },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.65 },
  text: { ...type.label, fontSize: 13 },
  textIdle: { color: colors.mutedForeground },
  textActive: { color: colors.primaryForeground, fontWeight: '600' },
});
