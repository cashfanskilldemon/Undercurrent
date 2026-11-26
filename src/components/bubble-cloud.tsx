import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { colors } from '@/constants/theme';
import type { GenreGroup } from '@/lib/types';

/** Web 上直接写 DOM 的 left/top，绕过每帧 React 重渲染（126 个节点也稳 60fps） */
const isWeb = Platform.OS === 'web';

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
function layout(
  items: { name: string; category: string }[],
  W: number,
  H: number,
  zoom = ZOOM
): Bubble[] {
  const pad = 14;
  const rand = seeded(20261125);
  const n = items.length;
  if (!n) return [];

  const sized = items.map((it) => ({ ...it, r: radiusFor(it.name) }));
  const areaSum = sized.reduce((sum, b) => sum + Math.PI * b.r * b.r, 0);
  // 条目少时留白多一点，条目多时压紧；单分类视图靠它放大铺满
  // 画布不放大时（单分类、一屏放得下）密度再提一档，否则十几个球会散得太空
  const dense = 1 + (ZOOM - zoom) * 0.35;
  const fill = Math.min(0.5, 0.28 + n * 0.0018) * dense;
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

/** 泡泡区域相对可视区的最大放大倍数：画布更大、泡泡更大，靠拖动浏览 */
const ZOOM = 2.2;

/**
 * 画布该放大多少，按「一屏大约摆多少颗泡泡」来定：
 * 全部（126 个）时画布比可视区大一圈，可以拖着逛；
 * 切到单个分类（十几个）就自动回到 1:1，正好铺满一屏 —— 不会只剩中间一两个球。
 */
function zoomFor(n: number) {
  return clamp(Math.sqrt(Math.max(n, 1) / 26), 1, ZOOM);
}

/**
 * 拖动保护：拖动画布时鼠标最后可能停在某个泡泡上，
 * 松手后 Pressable 仍会补一次 onPress，导致「拖动一下顺手选了一个」。
 * 这里记一个时间窗口，拖动开始/进行/结束时刷新，窗口内的点击一律丢弃。
 */
const dragGuard = { until: 0 };
const DRAG_TAP_GUARD_MS = 260;

/** 点击位移阈值：按下到松开移动超过这个距离，就认为是在拖动而不是点击 */
const TAP_SLOP = 8;

/** 单个泡泡：位置由父级逐帧计算后传入，用 left/top 绝对定位（本环境 transform 不生效） */
const BubbleCell = forwardRef<
  any,
  {
    bubble: Bubble;
    x: number;
    y: number;
    selected: boolean;
    full: boolean;
    hovered: boolean;
    onHover: (name: string | null) => void;
    onToggle: (name: string) => void;
  }
>(({ bubble, x, y, selected, full, hovered, onHover, onToggle }, ref) => {
  /** 按下时的屏幕坐标，用来区分「点击」和「拖完松手」 */
  const downRef = useRef<{ x: number; y: number } | null>(null);

  const screenPoint = (event: any) => {
    const native: any = event?.nativeEvent ?? {};
    return { x: native.clientX ?? native.pageX ?? 0, y: native.clientY ?? native.pageY ?? 0 };
  };

  return (
    <View
      ref={ref}
      testID="bubble-cell"
      style={[
        styles.cell,
        {
          left: x - bubble.r,
          top: y - bubble.r,
          width: bubble.r * 2,
          height: bubble.r * 2,
        },
      ]}>
      <Pressable
        testID="bubble"
        onPressIn={(event) => {
          downRef.current = screenPoint(event);
        }}
        onPress={(event) => {
          const from = downRef.current;
          downRef.current = null;
          // 1) 刚拖过画布：直接吞掉这次点击
          if (Date.now() < dragGuard.until) return;
          // 2) 这一下按下去之后指针移动过：算拖动，不算点击
          if (from) {
            const to = screenPoint(event);
            // 坐标取不到时（部分平台合成事件没有 clientX）只依赖上面的时间窗口
            if (to.x > 0 && to.y > 0 && Math.hypot(to.x - from.x, to.y - from.y) > TAP_SLOP) {
              return;
            }
          }
          onToggle(bubble.name);
        }}
        onHoverIn={() => onHover(bubble.name)}
        onHoverOut={() => onHover(null)}
        style={[
          styles.bubble,
          { borderRadius: bubble.r },
          hovered && styles.bubbleHover,
          selected && styles.bubbleOn,
          full && styles.bubbleFull,
        ]}>
        <Text
          numberOfLines={1}
          style={[styles.label, { fontSize: bubble.fontSize }, selected && styles.labelOn]}>
          {bubble.name}
        </Text>
      </Pressable>
    </View>
  );
});
BubbleCell.displayName = 'BubbleCell';

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
  /** 画布平移（left/top），拖动时更新 */
  const [pan, setPan] = useState({ x: 0, y: 0 });
  /** 所有泡泡的实时位置（x,y 交替），由每帧物理写回并驱动渲染 */
  const [positions, setPositions] = useState<number[]>([]);
  const win = useWindowDimensions();
  const fieldRef = useRef<any>(null);
  /** 可拖动画布的 DOM 节点（Web 上拖动时直写 left/top，不触发 React 渲染） */
  const worldRef = useRef<any>(null);
  /** 每个泡泡的 DOM 节点，物理逐帧直写位置 */
  const cellRefs = useRef<(any | null)[]>([]);
  const handlersRef = useRef({ onToggle });
  handlersRef.current = { onToggle };
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ ox: number; oy: number; moved: boolean } | null>(null);

  // 物理状态（放在 ref，逐帧读写不触发渲染；只在每帧末尾整体 setPositions 一次）
  const posRef = useRef<number[]>([]);
  const velRef = useRef<number[]>([]);
  const baseRef = useRef<number[]>([]);
  const radiiRef = useRef<number[]>([]);

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

  /** 虚拟画布尺寸：泡泡多时比可视区大一圈，泡泡随之放大，靠拖动浏览 */
  const zoom = zoomFor(visible.length);
  const worldW = Math.round(box.w * zoom);
  const worldH = Math.round(box.h * zoom);

  // 只在尺寸/数据变化时重排；选中、悬停、拖动都不触发重新布局
  const bubbles = useMemo(() => layout(visible, worldW, worldH, zoom), [visible, worldW, worldH, zoom]);

  /** 重排（切分类、改尺寸）后整片淡入一次，位置大变时不像「画面缩了一下」那么突兀 */
  const [fadeIn, setFadeIn] = useState(0);
  useEffect(() => {
    setFadeIn(0);
    const timer = setTimeout(() => setFadeIn(1), 24);
    return () => clearTimeout(timer);
  }, [bubbles]);

  /** 稳定的 ref 回调：只在重排时重建，避免每次渲染都把 DOM 节点摘下再挂上 */
  const cellSetters = useMemo(
    () =>
      bubbles.map((_, i) => (node: any) => {
        cellRefs.current[i] = node;
      }),
    [bubbles]
  );

  /** 把 ref 里的实时坐标刷回 DOM（React 重渲染会把 left/top 写回旧值，这里在同一帧内纠正） */
  const syncCells = () => {
    if (!isWeb) return;
    const pos = posRef.current;
    const rad = radiiRef.current;
    for (let i = 0; i < cellRefs.current.length; i++) {
      const el: any = cellRefs.current[i];
      const cx = pos[i * 2];
      const cy = pos[i * 2 + 1];
      if (!el?.style || cx == null || rad[i] == null) continue;
      el.style.left = `${cx - rad[i]}px`;
      el.style.top = `${cy - rad[i]}px`;
    }
  };

  /** 平移画布：Web 直写 DOM（拖动时零 React 渲染，才跟得住手），其它平台走 state */
  const applyPan = (next: { x: number; y: number }) => {
    const node: any = worldRef.current;
    if (isWeb && node?.style) {
      node.style.left = `${next.x}px`;
      node.style.top = `${next.y}px`;
      return;
    }
    setPan(next);
  };

  // 每次渲染后把实时位置补回 DOM
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!isWeb) return;
    const node: any = worldRef.current;
    if (node?.style) {
      node.style.left = `${panRef.current.x}px`;
      node.style.top = `${panRef.current.y}px`;
    }
    syncCells();
  });

  /** 初始化泡泡位置与漂浮速度（每个泡泡给一个缓慢的随机初速度） */
  useEffect(() => {
    const arr: number[] = [];
    const vel: number[] = [];
    for (let i = 0; i < bubbles.length; i++) {
      arr[i * 2] = bubbles[i].x;
      arr[i * 2 + 1] = bubbles[i].y;
      // 缓慢漂浮：约 0.18~0.35 px/帧，方向随机（温和，不抢焦点，也方便点击）
      const a = (i * 2.399963) % (Math.PI * 2);
      const sp = 0.18 + ((i * 37) % 13) / 72;
      vel[i * 2] = Math.cos(a) * sp;
      vel[i * 2 + 1] = Math.sin(a) * sp;
    }
    posRef.current = arr;
    velRef.current = vel.slice();
    baseRef.current = vel;
    radiiRef.current = bubbles.map((b) => b.r);
    setPositions(arr.slice());
  }, [bubbles]);

  /** 平移边界：画布不能拖到可视区外留白（画布比可视区小则居中不拖） */
  const clampOffset = (x: number, y: number) => ({
    x: worldW <= box.w ? -(worldW - box.w) / 2 : clamp(x, box.w - worldW, 0),
    y: worldH <= box.h ? -(worldH - box.h) / 2 : clamp(y, box.h - worldH, 0),
  });

  /** 画布尺寸改变时回到居中位置（首次进入、分类切换导致重排后） */
  useEffect(() => {
    const center = clampOffset(-(worldW - box.w) / 2, -(worldH - box.h) / 2);
    panRef.current = center;
    setPan(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldW, worldH, box.w, box.h]);

  /**
   * 逐帧物理：自由漂浮 + 软碰撞 + 边界反弹 + 速度回归基准。
   * 每帧算完整体 setPositions 一次，驱动 126 个泡泡用 left/top 重新定位。
   */
  useEffect(() => {
    let raf = 0;
    let last = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const step = (now: number) => {
      // 限制帧间隔换算，避免掉帧时泡泡暴走；固定接近 1 让速度更稳
      const dtf = Math.min(1.6, Math.max(0.6, (now - last) / 16.7));
      last = now;

      const pos = posRef.current;
      const vel = velRef.current;
      const base = baseRef.current;
      const rad = radiiRef.current;
      const n = rad.length;

      if (n && pos.length >= n * 2 && vel.length >= n * 2 && worldW > 0) {
        // 1) 自由漂浮
        for (let i = 0; i < n; i++) {
          pos[i * 2] += vel[i * 2] * dtf;
          pos[i * 2 + 1] += vel[i * 2 + 1] * dtf;
        }
        // 2) 软碰撞：靠得太近就柔和弹开
        for (let i = 0; i < n; i++) {
          const xi = pos[i * 2];
          const yi = pos[i * 2 + 1];
          const ri = rad[i];
          for (let j = i + 1; j < n; j++) {
            let dx = pos[j * 2] - xi;
            let dy = pos[j * 2 + 1] - yi;
            const min = ri + rad[j] + 6;
            const d2 = dx * dx + dy * dy;
            if (d2 >= min * min) continue;
            let d = Math.sqrt(d2);
            if (d < 0.001) {
              dx = 0.01;
              dy = 0.01;
              d = 0.014;
            }
            const nx = dx / d;
            const ny = dy / d;
            const ov = (min - d) * 0.04;
            vel[i * 2] -= nx * ov * 0.1;
            vel[i * 2 + 1] -= ny * ov * 0.1;
            vel[j * 2] += nx * ov * 0.1;
            vel[j * 2 + 1] += ny * ov * 0.1;
            pos[i * 2] -= nx * ov;
            pos[i * 2 + 1] -= ny * ov;
            pos[j * 2] += nx * ov;
            pos[j * 2 + 1] += ny * ov;
          }
        }
        // 3) 边界反弹 + 4) 速度回归基准（保证永远温和漂浮，不会慢慢停住）
        for (let i = 0; i < n; i++) {
          const r = rad[i];
          const minX = 14 + r;
          const maxX = worldW - 14 - r;
          const minY = 14 + r;
          const maxY = worldH - 14 - r;
          if (pos[i * 2] < minX) {
            pos[i * 2] = minX;
            vel[i * 2] = Math.abs(vel[i * 2]) * 0.8;
          } else if (pos[i * 2] > maxX) {
            pos[i * 2] = maxX;
            vel[i * 2] = -Math.abs(vel[i * 2]) * 0.8;
          }
          if (pos[i * 2 + 1] < minY) {
            pos[i * 2 + 1] = minY;
            vel[i * 2 + 1] = Math.abs(vel[i * 2 + 1]) * 0.8;
          } else if (pos[i * 2 + 1] > maxY) {
            pos[i * 2 + 1] = maxY;
            vel[i * 2 + 1] = -Math.abs(vel[i * 2 + 1]) * 0.8;
          }
          const k = 0.02;
          vel[i * 2] += (base[i * 2] - vel[i * 2]) * k;
          vel[i * 2 + 1] += (base[i * 2 + 1] - vel[i * 2 + 1]) * k;
        }
        // Web：直接写 DOM 的 left/top，一帧只动样式、不惊动 React，126 个泡泡也跟得住 60fps
        if (isWeb) {
          const cells = cellRefs.current;
          for (let i = 0; i < n; i++) {
            const el: any = cells[i];
            if (!el?.style) continue;
            el.style.left = `${pos[i * 2] - rad[i]}px`;
            el.style.top = `${pos[i * 2 + 1] - rad[i]}px`;
          }
        } else {
          setPositions(pos.slice());
        }
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [worldW, worldH]);

  /** 把指针事件换算成画布内坐标 */
  const pointInField = (event: any) => {
    const native: any = event?.nativeEvent ?? {};
    const node: any = fieldRef.current;
    if (node?.getBoundingClientRect) {
      const rect = node.getBoundingClientRect();
      return {
        x: (native.clientX ?? native.pageX ?? 0) - rect.left,
        y: (native.clientY ?? native.pageY ?? 0) - rect.top,
      };
    }
    return { x: native.locationX ?? 0, y: native.locationY ?? 0 };
  };

  /**
   * 拖动搅动：指针扫过的地方把泡泡推开、并顺着拖动方向带一把，
   * 松手后速度慢慢回到基准，云就自然散开再飘回去。
   * 传进来的是「画布坐标」——用按下时的 pan 换算，指针才会在画布上真正走一条路径。
   */
  const stir = (wx: number, wy: number, vx: number, vy: number) => {
    const pos = posRef.current;
    const vel = velRef.current;
    const rad = radiiRef.current;
    const n = rad.length;
    if (!n || pos.length < n * 2) return;

    const REACH = 280;
    const speed = Math.min(2.6, Math.hypot(vx, vy));
    const power = 0.55 + speed * 0.4;

    for (let i = 0; i < n; i++) {
      const dx = pos[i * 2] - wx;
      const dy = pos[i * 2 + 1] - wy;
      const d = Math.hypot(dx, dy) || 1;
      const reach = REACH + rad[i];
      if (d > reach) continue;
      // 中心最强、边缘趋零，平方衰减让边界更柔和
      const f = (1 - d / reach) ** 2;
      const nx = dx / d;
      const ny = dy / d;
      vel[i * 2] += (nx * 0.95 + vx * 0.12) * f * power;
      vel[i * 2 + 1] += (ny * 0.95 + vy * 0.12) * f * power;
    }

    // 限速：连着划几下也不会把泡泡甩出画布
    const MAXV = 4.5;
    for (let i = 0; i < n * 2; i++) {
      if (vel[i] > MAXV) vel[i] = MAXV;
      else if (vel[i] < -MAXV) vel[i] = -MAXV;
    }
  };

  /**
   * 手势：按住拖动 = 手指划过的地方泡泡被推开散开（同时画布跟手平移）；轻点 = 选中命中的泡泡。
   */
  const fieldResponder = useMemo(
    () =>
      PanResponder.create({
        // 轻点交给泡泡的 Pressable.onPress 选中，只有拖动超过阈值才接管平移
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => {
          const dragging = Math.abs(gesture.dx) + Math.abs(gesture.dy) > 8;
          // 一旦开始拖动就封锁点击，避免松手时把落点上的泡泡选中
          if (dragging) dragGuard.until = Date.now() + DRAG_TAP_GUARD_MS;
          return dragging;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragGuard.until = Date.now() + DRAG_TAP_GUARD_MS;
          const cur = panRef.current;
          dragRef.current = { ox: cur.x, oy: cur.y, moved: false };
        },
        onPanResponderMove: (event, gesture) => {
          const start = dragRef.current;
          if (!start) return;
          dragGuard.until = Date.now() + DRAG_TAP_GUARD_MS;
          if (Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4) start.moved = true;

          // 画布跟手平移（云比视口大，要能拖到边缘）
          const next = clampOffset(start.ox + gesture.dx, start.oy + gesture.dy);
          panRef.current = next;
          applyPan(next);

          // 同时搅动泡泡：用按下时的 pan 换算，指针才会在画布上真正扫过一条路径
          const p = pointInField(event);
          stir(p.x - start.ox, p.y - start.oy, gesture.vx, gesture.vy);
        },
        onPanResponderRelease: () => {
          // 松手后仍要挡一小会儿：Pressable 的 onPress 通常排在 release 之后才派发
          dragGuard.until = Date.now() + DRAG_TAP_GUARD_MS;
          dragRef.current = null;
        },
        onPanResponderTerminate: () => {
          dragGuard.until = Date.now() + DRAG_TAP_GUARD_MS;
          dragRef.current = null;
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bubbles, worldW, worldH, box.w, box.h]
  );

  return (
    <View
      ref={fieldRef}
      testID="bubble-field"
      {...fieldResponder.panHandlers}
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
      <View
        ref={worldRef}
        testID="bubble-world"
        style={[
          styles.world,
          { width: worldW, height: worldH, left: pan.x, top: pan.y, opacity: fadeIn },
        ]}>
        {bubbles.map((b, i) => {
          const on = selected.includes(b.name);
          // 到上限后，未选中的泡泡变淡提示「选不下了」，但仍可点——操作了才提示原因
          const full = !on && selected.length >= max;
          return (
            <BubbleCell
              key={b.name}
              ref={cellSetters[i]}
              bubble={b}
              x={positions[i * 2] ?? b.x}
              y={positions[i * 2 + 1] ?? b.y}
              selected={on}
              full={full}
              hovered={hovered === b.name}
              onHover={setHovered}
              onToggle={handlersRef.current.onToggle}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, position: 'relative', overflow: 'hidden', userSelect: 'none' },
  /** 可拖动的放大画布：绝对定位在视口内，靠 left/top 平移 */
  world: { position: 'absolute' },
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
