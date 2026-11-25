import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { colors } from '@/constants/theme';
import type { GenreGroup } from '@/lib/types';

/** 单个泡泡布局结果 */
type Bubble = {
  name: string;
  category: string;
  r: number;
  x: number;
  y: number;
  fontSize: number;
};

/** 估算文字宽度：CJK 按全宽，拉丁字母取经验均值（不依赖真实测量，布局稳定） */
function units(text: string) {
  let sum = 0;
  for (const ch of text) {
    sum += /[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 1 : 0.56;
  }
  return Math.max(sum, 1);
}

/** 固定种子随机数：同一批数据每次布局一致，视觉上是手摆的、但不会跳 */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 半径由名字长度决定，越大越靠中心（先放大球） */
function radiusFor(name: string) {
  const u = units(name);
  const normal = (u * 13.5) / 2 + 14;
  // 保证即使字号被压到 9.5 也还装得进圆里，长名字不会被挤出边界
  const readable = (u * 9.5) / 2 + 11;
  return Math.min(Math.max(normal, readable, 27), 66);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * 排布思路：先把画布切成接近正方形的网格（铺满四边，不留空角），
 * 大球先挑格子、格内轻微抖动，最后做几轮「互相推开」的松弛，
 * 得到既均匀又自然的泡泡云 —— 比纯随机撒点更稳、更省空间。
 */
function layout(items: { name: string; category: string }[], W: number, H: number): Bubble[] {
  const pad = 14;
  const rand = seeded(20261125);
  const n = items.length;
  if (!n) return [];

  const sized = items.map((it) => ({ ...it, r: radiusFor(it.name) }));
  const areaSum = sized.reduce((sum, b) => sum + Math.PI * b.r * b.r, 0);
  // 条目少时留白多一点，条目多时压紧；单分类视图靠它放大铺满
  const fill = Math.min(0.5, 0.28 + n * 0.0018);
  const scale = clamp(Math.sqrt((W * H * fill) / Math.max(areaSum, 1)), 0.55, 2.4);

  // 行列按画布长宽比分配，格子接近正方形
  const cols = Math.max(1, Math.round(Math.sqrt((n * W) / Math.max(H, 1))));
  const rows = Math.max(1, Math.ceil(n / cols));
  const cellW = (W - pad * 2) / cols;
  const cellH = (H - pad * 2) / rows;
  const maxR = Math.min(cellW, cellH) * 0.76;

  // 格子行优先铺开；泡泡比格子少时用「最远点采样」挑格子，空位均匀散开（不会留出一条竖着的空洞）
  const cells: { c: number; r: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) cells.push({ c, r });
  }
  const total = cells.length;
  let chosen = cells;
  if (total > n) {
    const px = cells.map((cell) => pad + cellW * (cell.c + 0.5));
    const py = cells.map((cell) => pad + cellH * (cell.r + 0.5));
    const taken = new Array(total).fill(false);
    let start = 0;
    let bestD = Infinity;
    for (let i = 0; i < total; i++) {
      const d = (px[i] - W / 2) ** 2 + (py[i] - H / 2) ** 2;
      if (d < bestD) {
        bestD = d;
        start = i;
      }
    }
    taken[start] = true;
    const order = [start];
    while (order.length < n) {
      let next = -1;
      let far = -1;
      for (let i = 0; i < total; i++) {
        if (taken[i]) continue;
        let near = Infinity;
        for (const j of order) {
          const d = (px[i] - px[j]) ** 2 + (py[i] - py[j]) ** 2;
          if (d < near) near = d;
        }
        if (near > far) {
          far = near;
          next = i;
        }
      }
      if (next < 0) break;
      taken[next] = true;
      order.push(next);
    }
    chosen = order.map((i) => cells[i]);
  }

  const out: Bubble[] = [...sized]
    .sort((a, b) => b.r - a.r)
    .map((b, i) => {
      const cell = chosen[i % chosen.length];
      // 大小再抖一点，形成「大小球错落」的节奏，而不是一整面等大的圆
      const r = Math.min(b.r * scale * (0.86 + rand() * 0.34), maxR);
      // 抖动可以稍微越过格子边界，后面的松弛会把重叠推开，显得更像自然散落
      const jx = Math.max(0, cellW / 2 - r * 0.72);
      const jy = Math.max(0, cellH / 2 - r * 0.72);
      const x = pad + cellW * (cell.c + 0.5) + (rand() * 2 - 1) * jx;
      const y = pad + cellH * (cell.r + 0.5) + (rand() * 2 - 1) * jy;
      return {
        name: b.name,
        category: b.category,
        r,
        x,
        y,
        // 字号按最终半径反推，保证文字一定装得进圆里
        fontSize: clamp((r * 2 - 20) / units(b.name), 10, 22),
      };
    });

  // 松弛：重叠的两两推开，再夹回画布内；几轮就稳定
  for (let iter = 0; iter < 60; iter++) {
    let moved = 0;
    for (let i = 0; i < out.length; i++) {
      const a = out[i];
      for (let j = i + 1; j < out.length; j++) {
        const b = out[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        const need = a.r + b.r + 14;
        if (d >= need) continue;
        if (d < 0.01) {
          dx = rand() - 0.5;
          dy = rand() - 0.5;
          d = Math.hypot(dx, dy) || 1;
        }
        const push = (need - d) / 2;
        const ux = (dx / d) * push;
        const uy = (dy / d) * push;
        a.x -= ux;
        a.y -= uy;
        b.x += ux;
        b.y += uy;
        moved++;
      }
    }
    for (const b of out) {
      b.x = clamp(b.x, pad + b.r, Math.max(pad + b.r, W - pad - b.r));
      b.y = clamp(b.y, pad + b.r, Math.max(pad + b.r, H - pad - b.r));
    }
    if (!moved) break;
  }

  return out;
}

export function BubbleCloud({
  groups,
  selected,
  max,
  activeCategory,
  onToggle,
}: {
  groups: GenreGroup[];
  selected: string[];
  max: number;
  /** null = 全部 */
  activeCategory: string | null;
  onToggle: (name: string) => void;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const win = useWindowDimensions();
  const fieldRef = useRef<any>(null);

  /**
   * 取真实尺寸：Web 上用 ResizeObserver 直接读 DOM（onLayout 首帧偶尔给 0 且不再触发），
   * 其它平台仍走 onLayout。
   */
  useEffect(() => {
    const node: any = fieldRef.current;
    if (!node || typeof node.clientWidth !== 'number') return;

    const sync = () => {
      const w = node.clientWidth;
      const h = node.clientHeight;
      if (w < 40 || h < 40) return;
      setSize((prev) =>
        Math.abs(prev.w - w) < 1 && Math.abs(prev.h - h) < 1 ? prev : { w, h }
      );
    };
    sync();

    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(sync);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const items = useMemo(
    () => groups.flatMap((g) => g.genres.map((name) => ({ name, category: g.category }))),
    [groups]
  );

  // 选了分类就只摆这一类：数量少了就能放大，比把其余的淡掉更好看也更好点
  const visible = useMemo(
    () => (activeCategory ? items.filter((it) => it.category === activeCategory) : items),
    [items, activeCategory]
  );

  /**
   * 首帧 onLayout 可能还没回调（flex 高度没算完），这时先用窗口尺寸兜个底，
   * 免得整片区域空着；量到真实尺寸后会重排。
   */
  const box =
    size.w > 40 && size.h > 40
      ? size
      : {
          w: Math.max(360, win.width - 88),
          h: Math.max(320, win.height - 330),
        };

  // 只在尺寸/数据变化时重排；选中、悬停不触发重新布局
  const bubbles = useMemo(() => layout(visible, box.w, box.h), [visible, box.w, box.h]);

  return (
    <View
      ref={fieldRef}
      testID="bubble-field"
      style={styles.field}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width < 40 || height < 40) return;
        setSize((prev) =>
          Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1
            ? prev
            : { w: width, h: height }
        );
      }}>
      {size.w < 1 ? null : bubbles.map((b) => {
        const on = selected.includes(b.name);
        // 到上限后，未选中的泡泡变淡提示「选不下了」，但仍可点——点了才提示原因
        const full = !on && selected.length >= max;
        return (
          <View
            key={b.name}
            testID="bubble-cell"
            style={[
              styles.cell,
              { left: b.x - b.r, top: b.y - b.r, width: b.r * 2, height: b.r * 2 },
            ]}>
            <Pressable
              testID="bubble"
              onPress={() => onToggle(b.name)}
              onHoverIn={() => setHovered(b.name)}
              onHoverOut={() => setHovered((h) => (h === b.name ? null : h))}
              style={[
                styles.bubble,
                { borderRadius: b.r },
                hovered === b.name && styles.bubbleHover,
                on && styles.bubbleOn,
                full && styles.bubbleFull,
              ]}>
              <Text
                numberOfLines={1}
                style={[styles.label, { fontSize: b.fontSize }, on && styles.labelOn]}>
                {b.name}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, position: 'relative', overflow: 'hidden' },
  cell: { position: 'absolute' },
  bubble: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  bubbleHover: { borderColor: colors.foreground, backgroundColor: colors.elevated },
  bubbleOn: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  bubbleFull: { opacity: 0.45 },
  label: { color: colors.foreground, textAlign: 'center' },
  labelOn: { color: colors.background, fontWeight: '600' },
});
