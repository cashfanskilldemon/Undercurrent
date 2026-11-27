import { ChevronDown } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

type DateField = 'year' | 'month' | 'day';
type Selection = Partial<Record<DateField, number | null>>;
type Anchor = { top: number; left: number; width: number };

const TODAY = new Date();
const THIS_YEAR = TODAY.getFullYear();
const DEFAULT_YEAR = 2000;
const ITEM_HEIGHT = 44;
const DROPDOWN_MAX_HEIGHT = 288;
const YEARS = Array.from({ length: THIS_YEAR - 1899 }, (_, i) => THIS_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEAR_OFFSET = Math.max(
  0,
  (THIS_YEAR - DEFAULT_YEAR) * ITEM_HEIGHT - (DROPDOWN_MAX_HEIGHT - ITEM_HEIGHT) / 2,
);

const UNIT: Record<DateField, string> = { year: '年', month: '月', day: '日' };
const PLACEHOLDER: Record<DateField, string> = { year: '年份', month: '月份', day: '日期' };

const ZODIAC = [
  '摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座',
  '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座',
];
const CUT = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22];

function zodiacOf(month: number, day: number) {
  return day < CUT[month - 1] ? ZODIAC[month - 1] : ZODIAC[month % 12];
}

export function AgeMagicGame({
  age,
  onAgeChange,
  gender,
  onGenderChange,
  genders,
  wide = false,
}: {
  age: number | null;
  onAgeChange: (next: number | null) => void;
  gender: string | null;
  onGenderChange: (next: string | null) => void;
  genders: string[];
  wide?: boolean;
}) {
  const [year, setYear] = useState<number | null>(age !== null ? THIS_YEAR - age : DEFAULT_YEAR);
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [open, setOpen] = useState<DateField | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const refs = useRef<Record<DateField, any>>({ year: null, month: null, day: null });

  useEffect(() => {
    if (age !== null && year === null) setYear(THIS_YEAR - age);
  }, [age, year]);

  const daysInMonth = year && month ? new Date(year, month, 0).getDate() : 31;
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const update = (next: Selection) => {
    const y = next.year !== undefined ? next.year : year;
    const m = next.month !== undefined ? next.month : month;
    let d = next.day !== undefined ? next.day : day;
    const limit = y && m ? new Date(y, m, 0).getDate() : 31;
    if (d !== null && d > limit) d = limit;
    setYear(y);
    setMonth(m);
    setDay(d);
    setOpen(null);
    setAnchor(null);

    if (y && m && d) {
      let value = THIS_YEAR - y;
      const thisMonth = TODAY.getMonth() + 1;
      const passed = thisMonth > m || (thisMonth === m && TODAY.getDate() >= d);
      if (!passed) value -= 1;
      onAgeChange(Math.min(120, Math.max(0, value)));
    } else {
      onAgeChange(null);
    }
  };

  const toggle = (field: DateField) => {
    if (open === field) {
      setOpen(null);
      setAnchor(null);
      return;
    }
    const node: any = refs.current[field];
    node?.measure((_x: number, _y: number, w: number, h: number, pageX: number, pageY: number) => {
      setAnchor({ top: pageY + h + 8, left: pageX, width: w });
      setOpen(field);
    });
  };

  const options = open === 'year' ? YEARS : open === 'month' ? MONTHS : DAYS;
  const selected = open === 'year' ? year : open === 'month' ? month : day;

  const full = year !== null && month !== null && day !== null;
  const caption = full
    ? `${year} 年 ${month} 月 ${day} 日 · ${zodiacOf(month!, day!)}${age !== null ? ` · ${age} 岁` : ''}`
    : '选好之后给你算年龄';

  const select = (field: DateField, value: number | null) => {
    const on = open === field;
    return (
      <Pressable
        ref={(v) => {
          refs.current[field] = v;
        }}
        onPress={() => toggle(field)}
        style={(s: any) => [
          styles.select,
          wide && styles.selectWide,
          s.hovered && !on && styles.selectHover,
          on && styles.selectOn,
        ]}>
        <View style={styles.selectValueRow}>
          {value !== null ? (
            <>
              <Text
                style={[
                  styles.selectValue,
                  wide && styles.selectValueWide,
                  on && styles.textOn,
                ]}>
                {value}
              </Text>
              <Text style={[styles.selectUnit, on && styles.textOn]}>{UNIT[field]}</Text>
            </>
          ) : (
            <Text style={[styles.selectPlaceholder, on && styles.textOn]}>{PLACEHOLDER[field]}</Text>
          )}
        </View>
        <View style={[styles.chev, on && styles.chevOn]}>
          <ChevronDown size={wide ? 20 : 18} strokeWidth={2.2} color={on ? colors.background : colors.mutedForeground} />
        </View>
      </Pressable>
    );
  };

  const chip = (g: string) => {
    const on = gender === g;
    return (
      <Pressable
        key={g}
        onPress={() => onGenderChange(on ? null : g)}
        style={(s: any) => [
          styles.chip,
          wide && styles.chipWide,
          s.hovered && !on && styles.chipHover,
          on && styles.chipOn,
        ]}>
        <Text style={[styles.chipText, wide && styles.chipTextWide, on && styles.chipTextOn]}>
          {g}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, wide && styles.wrapWide]}>
      {/* 出生日期：无卡片、无描边，直接用填充块把三段拼起来 */}
      <Text style={[styles.sectionLabel, wide && styles.sectionLabelWide]}>出生日期</Text>
      <View style={styles.dateRow}>
        {select('year', year)}
        {select('month', month)}
        {select('day', day)}
      </View>
      <Text style={[styles.caption, full && styles.captionOn]}>{caption}</Text>

      {/* 性别 / 自我认同 */}
      <Text style={[styles.sectionLabel, styles.genderHead, wide && styles.sectionLabelWide]}>
        性别 / 自我认同
      </Text>
      <View style={styles.grid}>{genders.map((g) => chip(g))}</View>

      <Modal visible={open !== null} transparent animationType="none" onRequestClose={() => setOpen(null)}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            setOpen(null);
            setAnchor(null);
          }}
        />
        {anchor && open ? (
          <View style={[styles.dropdown, { top: anchor.top, left: anchor.left, width: anchor.width }]}>
            <ScrollView
              style={styles.dropdownScroll}
              showsVerticalScrollIndicator
              contentOffset={open === 'year' ? { x: 0, y: YEAR_OFFSET } : undefined}>
              {options.map((n) => {
                const on = selected === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => update({ [open]: n })}
                    style={(s: any) => [styles.item, s.hovered && !on && styles.itemHover, on && styles.itemOn]}>
                    <Text style={[styles.itemText, on && styles.itemTextOn]}>{n}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: 640, alignSelf: 'center', marginTop: 12 },
  wrapWide: { maxWidth: 900, marginTop: 18 },

  /** 小标题：字距拉开、灰、无任何装饰线 */
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 2.4,
    color: colors.mutedForeground,
  },
  sectionLabelWide: { fontSize: 13 },
  genderHead: { marginTop: 40 },

  dateRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  select: {
    flex: 1,
    height: 68,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  selectWide: { height: 78, paddingHorizontal: 22, borderRadius: 22 },
  selectHover: { backgroundColor: colors.input },
  selectOn: { backgroundColor: colors.foreground },
  selectValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  selectValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
    fontVariant: ['tabular-nums'],
  },
  selectValueWide: { fontSize: 25 },
  selectUnit: { fontSize: 12.5, fontWeight: '600', color: colors.mutedForeground },
  selectPlaceholder: { fontSize: 15, fontWeight: '500', color: colors.mutedForeground },
  chev: { marginTop: 1 },
  chevOn: { transform: [{ rotate: '180deg' }] },
  textOn: { color: colors.background },

  caption: { marginTop: 12, marginLeft: 4, fontSize: 13, color: colors.mutedForeground },
  captionOn: { color: colors.foreground, opacity: 0.72, letterSpacing: 0.4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  chip: {
    flexGrow: 1,
    flexBasis: '28%',
    minWidth: 88,
    height: 54,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipWide: { flexGrow: 0, flexBasis: '15%', minWidth: 112, height: 60, paddingHorizontal: 18 },
  chipHover: { backgroundColor: colors.input },
  chipOn: { backgroundColor: colors.foreground },
  chipText: { fontSize: 15, fontWeight: '600', color: colors.foreground, textAlign: 'center' },
  chipTextWide: { fontSize: 16 },
  chipTextOn: { color: colors.background, fontWeight: '700' },

  dropdown: {
    position: 'absolute',
    zIndex: 1000,
    padding: 6,
    borderRadius: 20,
    backgroundColor: colors.menuBg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  dropdownScroll: { maxHeight: DROPDOWN_MAX_HEIGHT },
  item: {
    height: ITEM_HEIGHT,
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: 'center',
  },
  itemHover: { backgroundColor: colors.menuPressed },
  itemOn: { backgroundColor: colors.foreground },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  itemTextOn: { color: colors.background, fontWeight: '700' },
});
