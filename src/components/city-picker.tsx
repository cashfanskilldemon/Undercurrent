import { Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ALL_CITIES, CITY_GROUPS, HOT_CITIES } from '@/constants/cities';
import { colors } from '@/constants/theme';

const TABS = [{ title: '热门', cities: HOT_CITIES }, ...CITY_GROUPS];

/**
 * 城市选择：无边框设计。
 * 一条搜索胶囊 + 一行地区切换（热门 / 华北 / 华东 …），
 * 每个地区默认只铺前几行，其余「展开全部」，避免一屏几十行胶囊。
 */
export function CityPicker({
  value,
  onChange,
  wide = false,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  wide?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [expand, setExpand] = useState(false);
  const keyword = query.trim();
  const results = keyword ? ALL_CITIES.filter((c) => c.includes(keyword)) : [];
  const list = keyword ? results : TABS[active].cities;
  const limit = wide ? 30 : 12;
  const shown = expand ? list : list.slice(0, limit);
  const rest = list.length - shown.length;

  const pickTab = (i: number) => {
    setActive(i);
    setExpand(false);
  };

  const chip = (city: string) => {
    const on = value === city;
    return (
      <Pressable
        key={city}
        onPress={() => onChange(on ? null : city)}
        style={(s: any) => [
          styles.chip,
          wide && styles.chipWide,
          s.hovered && !on && styles.chipHover,
          on && styles.chipOn,
        ]}>
        <Text style={[styles.chipText, wide && styles.chipTextWide, on && styles.chipTextOn]}>
          {city}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, wide && styles.wrapWide]}>
      <View style={[styles.head, wide && styles.headWide]}>
        <View style={[styles.searchRow, wide && styles.searchRowWide]}>
          <Search size={17} strokeWidth={2.2} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setExpand(false);
            }}
            placeholder="搜索城市"
            placeholderTextColor={colors.mutedForeground}
            autoCorrect={false}
            testID="city-search-input"
            style={styles.search}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
        {value ? <Text style={styles.picked}>已选 · {value}</Text> : null}
      </View>

      {keyword ? null : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabs}>
          {TABS.map((t, i) => {
            const on = i === active;
            return (
              <Pressable
                key={t.title}
                onPress={() => pickTab(i)}
                style={(s: any) => [styles.tab, s.hovered && !on && styles.tabHover, on && styles.tabOn]}>
                <Text style={[styles.tabText, wide && styles.tabTextWide, on && styles.tabTextOn]}>
                  {t.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {keyword ? (
        <Text style={styles.hint}>
          {results.length ? `搜索结果 · ${results.length} 座城市` : '没有找到这座城市，换个关键词试试'}
        </Text>
      ) : null}

      <View style={styles.grid}>
        {shown.map(chip)}
        {rest > 0 ? (
          <Pressable
            onPress={() => setExpand(true)}
            style={(s: any) => [styles.more, s.hovered && styles.moreHover]}>
            <Text style={styles.moreText}>展开全部 {list.length} 座</Text>
          </Pressable>
        ) : null}
        {expand && list.length > limit ? (
          <Pressable
            onPress={() => setExpand(false)}
            style={(s: any) => [styles.more, s.hovered && styles.moreHover]}>
            <Text style={styles.moreText}>收起</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 620, alignSelf: 'center', marginTop: 16 },
  wrapWide: { maxWidth: 900, marginTop: 22 },

  head: { gap: 10 },
  headWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchRow: {
    flex: 1,
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchRowWide: { maxWidth: 420, height: 56 },
  search: { flex: 1, fontSize: 15.5, color: colors.foreground },
  picked: { fontSize: 12.5, color: colors.mutedForeground, letterSpacing: 0.6 },

  tabsScroll: { marginTop: 16, flexGrow: 0 },
  tabs: { gap: 6, paddingVertical: 2, paddingRight: 12 },
  tab: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabHover: { backgroundColor: colors.accent },
  tabOn: { backgroundColor: colors.accent },
  tabText: { fontSize: 14.5, fontWeight: '600', color: colors.mutedForeground },
  tabTextWide: { fontSize: 15 },
  tabTextOn: { color: colors.foreground },

  hint: { marginTop: 20, marginLeft: 4, fontSize: 12.5, color: colors.mutedForeground },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  chip: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWide: { height: 48, paddingHorizontal: 22 },
  chipHover: { backgroundColor: colors.input },
  chipOn: { backgroundColor: colors.foreground },
  chipText: { fontSize: 14.5, fontWeight: '500', color: colors.foreground },
  chipTextWide: { fontSize: 15.5 },
  chipTextOn: { color: colors.background, fontWeight: '700' },

  more: {
    height: 44,
    paddingHorizontal: 19,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreHover: { backgroundColor: colors.accent },
  moreText: { fontSize: 13.5, fontWeight: '500', color: colors.mutedForeground },
});
