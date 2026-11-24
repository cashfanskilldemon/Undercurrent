import {
  CalendarDays,
  Check,
  ChevronRight,
  Crosshair,
  FileText,
  Hash,
  UserRound,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '@/constants/theme';
import { formatCount } from '@/lib/format';
import type { TagStat, UserBrief } from '@/lib/types';

export interface AdvancedCriteria {
  date: string;
  exact: boolean;
  kind: string;
  author: number | null;
  tag: string;
}

export const EMPTY_CRITERIA: AdvancedCriteria = {
  date: '',
  exact: false,
  kind: '',
  author: null,
  tag: '',
};

const DATE_OPTIONS = [
  { value: '', label: '不限时间' },
  { value: 'today', label: '今天' },
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: '1y', label: '近一年' },
];

const KIND_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'text', label: '纯文字' },
  { value: 'track', label: '带作品' },
  { value: 'plugin', label: '带插件' },
];

type Section = 'date' | 'kind' | 'author' | 'tag' | null;

interface Props {
  people: UserBrief[];
  tags: TagStat[];
  initial: AdvancedCriteria;
  onApply: (criteria: AdvancedCriteria) => void;
  onClose: () => void;
}

/** Threads 风格高级搜索面板：发布日期 / 精确匹配 / 帖子类型 / 来自主页 / 社群或标签 */
export function AdvancedSearch({ people, tags, initial, onApply, onClose }: Props) {
  const [form, setForm] = useState<AdvancedCriteria>(initial);
  const [open, setOpen] = useState<Section>(null);

  const set = <K extends keyof AdvancedCriteria>(key: K, value: AdvancedCriteria[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const currentLabel = (options: { value: string; label: string }[], value: string) =>
    options.find((o) => o.value === value)?.label ?? options[0].label;

  const personLabel = people.find((p) => p.id === form.author)?.name ?? '全部主页';
  const tagLabel = form.tag || '全部标签';

  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <Text style={styles.panelTitle}>高级搜索</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.closeText}>收起</Text>
        </Pressable>
      </View>

      <SectionRow
        icon={<CalendarDays size={17} strokeWidth={1.8} color={colors.mutedForeground} />}
        label="发布日期"
        value={currentLabel(DATE_OPTIONS, form.date)}
        expanded={open === 'date'}
        onPress={() => setOpen(open === 'date' ? null : 'date')}
      />
      {open === 'date' ? (
        <Options
          options={DATE_OPTIONS}
          value={form.date}
          onSelect={(v) => set('date', v)}
        />
      ) : null}

      <Pressable
        style={styles.row}
        onPress={() => set('exact', !form.exact)}>
        <View style={styles.rowIcon}>
          <Crosshair size={17} strokeWidth={1.8} color={colors.mutedForeground} />
        </View>
        <Text style={styles.rowLabel}>精确匹配</Text>
        <View style={[styles.switch, form.exact && styles.switchOn]}>
          <View style={[styles.knob, form.exact && styles.knobOn]} />
        </View>
      </Pressable>
      <Text style={styles.rowHint}>开启后只在正文里匹配完整关键词</Text>

      <SectionRow
        icon={<FileText size={17} strokeWidth={1.8} color={colors.mutedForeground} />}
        label="帖子类型"
        value={currentLabel(KIND_OPTIONS, form.kind)}
        expanded={open === 'kind'}
        onPress={() => setOpen(open === 'kind' ? null : 'kind')}
      />
      {open === 'kind' ? (
        <Options options={KIND_OPTIONS} value={form.kind} onSelect={(v) => set('kind', v)} />
      ) : null}

      <SectionRow
        icon={<UserRound size={17} strokeWidth={1.8} color={colors.mutedForeground} />}
        label="来自主页"
        value={personLabel}
        expanded={open === 'author'}
        onPress={() => setOpen(open === 'author' ? null : 'author')}
      />
      {open === 'author' ? (
        <View style={styles.options}>
          <Option label="全部主页" selected={form.author === null} onPress={() => set('author', null)} />
          {people.map((p) => (
            <Option
              key={p.id}
              label={`${p.name} · ${formatCount(p.followers ?? 0)} 粉丝`}
              selected={form.author === p.id}
              onPress={() => set('author', p.id)}
            />
          ))}
        </View>
      ) : null}

      <SectionRow
        icon={<Hash size={17} strokeWidth={1.8} color={colors.mutedForeground} />}
        label="社群或标签"
        value={tagLabel}
        expanded={open === 'tag'}
        onPress={() => setOpen(open === 'tag' ? null : 'tag')}
      />
      {open === 'tag' ? (
        <View style={styles.options}>
          <Option label="全部标签" selected={!form.tag} onPress={() => set('tag', '')} />
          {tags.slice(0, 10).map((t) => (
            <Option
              key={t.tag}
              label={`#${t.tag} · ${formatCount(t.posts)}`}
              selected={form.tag === t.tag}
              onPress={() => set('tag', t.tag)}
            />
          ))}
        </View>
      ) : null}

      <Pressable
        style={styles.apply}
        onPress={() => {
          setOpen(null);
          onApply(form);
        }}>
        <Text style={styles.applyText}>应用</Text>
      </Pressable>
    </View>
  );
}

function SectionRow({
  icon,
  label,
  value,
  expanded,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <ChevronRight
        size={16}
        strokeWidth={1.9}
        color={colors.mutedForeground}
        style={expanded ? styles.chevronOpen : undefined}
      />
    </Pressable>
  );
}

function Options({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.options}>
      {options.map((o) => (
        <Option key={o.value} label={o.label} selected={value === o.value} onPress={() => onSelect(o.value)} />
      ))}
    </View>
  );
}

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.option} onPress={onPress}>
      <Text style={[styles.optionLabel, selected && styles.optionLabelOn]} numberOfLines={1}>
        {label}
      </Text>
      {selected ? <Check size={15} strokeWidth={2.2} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    zIndex: 60,
    padding: space.md,
    paddingBottom: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  panelTitle: { ...type.label, color: colors.foreground, fontSize: 17, fontWeight: '700' },
  closeText: { ...type.small, color: colors.mutedForeground, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: { width: 20, alignItems: 'center' },
  rowLabel: { ...type.label, color: colors.foreground, fontSize: 16, fontWeight: '600' },
  rowValue: { ...type.caption, color: colors.mutedForeground, fontSize: 13, marginTop: 2 },
  rowHint: { ...type.caption, color: colors.mutedForeground, fontSize: 13, marginTop: -4, marginBottom: 4 },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  switch: {
    width: 36,
    height: 21,
    borderRadius: 11,
    backgroundColor: colors.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchOn: { backgroundColor: colors.primary, borderColor: colors.primary, justifyContent: 'flex-end' },
  knob: { width: 15, height: 15, borderRadius: 8, backgroundColor: colors.mutedForeground },
  knobOn: { backgroundColor: colors.background },
  options: {
    paddingVertical: 4,
    paddingLeft: 31,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 7,
  },
  optionLabel: { ...type.small, color: colors.mutedForeground, fontSize: 14, flexShrink: 1 },
  optionLabelOn: { color: colors.foreground, fontWeight: '600' },
  apply: {
    marginTop: 14,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { ...type.label, color: colors.background, fontWeight: '700', fontSize: 16 },
});
