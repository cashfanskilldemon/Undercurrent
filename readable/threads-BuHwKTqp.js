import {
  E as e,
  F as t,
  P as n,
  R as r,
  U as i,
  b as a,
  ht as o,
  k as s,
  n as c,
  pt as l,
  t as u,
  x as d,
  y as f,
} from "./bits-CX_ZQ6ey.js";
import { t as p } from "./search-DTyTdjq8.js";
import { f as m, i as h, n as g } from "./index-D8H8Au6A.js";
import { i as _ } from "./thread-card-BiVhtaO2.js";
var v = {
  name: `flame`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4`,
        key: `1slcih`,
      },
    ],
  ],
};
v.node;
var y = s(v),
  b = {
    name: `hash`,
    size: 24,
    node: [
      [`line`, { x1: `4`, x2: `20`, y1: `9`, y2: `9`, key: `4lhtct` }],
      [`line`, { x1: `4`, x2: `20`, y1: `15`, y2: `15`, key: `vyu0kd` }],
      [`line`, { x1: `10`, x2: `8`, y1: `3`, y2: `21`, key: `1ggp8o` }],
      [`line`, { x1: `16`, x2: `14`, y1: `3`, y2: `21`, key: `weycgp` }],
    ],
  };
b.node;
var x = s(b),
  S = {
    name: `sparkles`,
    size: 24,
    node: [
      [
        `path`,
        {
          d: `M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z`,
          key: `1s2grr`,
        },
      ],
      [`path`, { d: `M20 2v4`, key: `1rf3ol` }],
      [`path`, { d: `M22 4h-4`, key: `gwowj6` }],
      [`circle`, { cx: `4`, cy: `20`, r: `2`, key: `6kqj1y` }],
    ],
    aliases: [`stars`],
  };
S.node;
var C = s(S),
  w = o(l()),
  T = i();
function E() {
  let { c: i = `全部`, tag: o } = g.useSearch(),
    s = f((e) => e.threads),
    [l, v] = (0, w.useState)(`new`),
    [b, S] = (0, w.useState)(``),
    E = (0, w.useMemo)(() => {
      let e = s.filter(
        (e) =>
          (i === `全部` || e.channel === i) &&
          (!o || e.tags.includes(o)) &&
          (!b.trim() ||
            e.body.includes(b.trim()) ||
            e.tags.some((e) => e.includes(b.trim()))),
      );
      return (
        (e =
          l === `hot`
            ? [...e].sort(
                (e, t) =>
                  t.likes +
                  t.replies.length * 5 -
                  (e.likes + e.replies.length * 5),
              )
            : [...e].sort((e, t) => Number(!!t.pinned) - Number(!!e.pinned))),
        e
      );
    }, [s, i, o, b, l]);
  return (0, T.jsxs)(`div`, {
    className: `mx-auto grid max-w-content gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)_17rem]`,
    children: [
      (0, T.jsxs)(`aside`, {
        className: `lg:sticky lg:top-24 lg:self-start`,
        children: [
          (0, T.jsx)(`h1`, {
            className: `font-cn text-4xl`,
            children: `讨论区`,
          }),
          (0, T.jsx)(`p`, {
            className: `mt-1 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground`,
            children: `Threads`,
          }),
          (0, T.jsx)(`nav`, {
            "aria-label": `频道`,
            className: `scrollbar-none -mx-4 mt-6 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0`,
            children: d.map((e) =>
              (0, T.jsx)(
                r,
                {
                  to: `/threads`,
                  search: e === `全部` ? {} : { c: e },
                  className: n(
                    `shrink-0 border-l-2 px-3 py-2 text-sm transition-colors`,
                    i === e
                      ? `border-primary bg-card text-foreground`
                      : `border-transparent text-muted-foreground hover:text-foreground`,
                  ),
                  children: e,
                },
                e,
              ),
            ),
          }),
        ],
      }),
      (0, T.jsxs)(`section`, {
        "aria-label": `讨论列表`,
        className: `min-w-0 border-x-0 border-border sm:border-x`,
        children: [
          (0, T.jsx)(`div`, {
            className: `border-b border-border p-4 sm:p-5`,
            children: (0, T.jsx)(h, {
              defaultChannel: i === `全部` ? `闲聊` : i,
            }),
          }),
          (0, T.jsxs)(`div`, {
            className: `sticky top-16 z-20 flex items-center gap-2 border-b border-border bg-background/90 px-4 py-2 backdrop-blur sm:px-5`,
            children: [
              [
                [`new`, `最新`, C],
                [`hot`, `最热`, y],
              ].map(([e, t, r]) =>
                (0, T.jsxs)(
                  `button`,
                  {
                    type: `button`,
                    onClick: () => v(e),
                    "aria-pressed": l === e,
                    className: n(
                      `inline-flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors`,
                      l === e
                        ? `bg-primary text-primary-foreground`
                        : `text-muted-foreground hover:text-foreground`,
                    ),
                    children: [(0, T.jsx)(r, { className: `size-4` }), ` `, t],
                  },
                  e,
                ),
              ),
              o &&
                (0, T.jsxs)(r, {
                  to: `/threads`,
                  search: i === `全部` ? {} : { c: i },
                  className: `ml-2 border border-primary px-2 py-1 font-mono text-xs text-primary`,
                  children: [`#`, o, ` ✕`],
                }),
              (0, T.jsxs)(`label`, {
                className: `relative ml-auto hidden sm:block`,
                children: [
                  (0, T.jsx)(`span`, {
                    className: `sr-only`,
                    children: `搜索讨论`,
                  }),
                  (0, T.jsx)(p, {
                    className: `pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground`,
                  }),
                  (0, T.jsx)(m, {
                    value: b,
                    onChange: (e) => S(e.target.value),
                    placeholder: `搜索`,
                    className: `h-8 w-44 pl-8`,
                  }),
                ],
              }),
            ],
          }),
          E.length === 0
            ? (0, T.jsxs)(`div`, {
                className: `grid place-items-center px-6 py-24 text-center`,
                children: [
                  (0, T.jsx)(x, { className: `size-10 text-muted-foreground` }),
                  (0, T.jsx)(`p`, {
                    className: `mt-4 font-cn text-2xl`,
                    children: `这里还没人说话`,
                  }),
                  (0, T.jsxs)(`p`, {
                    className: `mt-2 max-w-xs text-sm text-muted-foreground`,
                    children: [
                      b ? `换个关键词试试，` : ``,
                      `在上面写下第一条，带上你的作品更容易收到回复。`,
                    ],
                  }),
                ],
              })
            : E.map((e) => (0, T.jsx)(_, { thread: e }, e.id)),
        ],
      }),
      (0, T.jsxs)(`aside`, {
        className: `space-y-8 lg:sticky lg:top-24 lg:self-start`,
        children: [
          (0, T.jsxs)(`div`, {
            children: [
              (0, T.jsx)(`h2`, {
                className: `font-mono text-xs uppercase tracking-[0.25em] text-primary`,
                children: `热门话题`,
              }),
              (0, T.jsx)(`ul`, {
                className: `mt-3`,
                children: e.map((e, n) =>
                  (0, T.jsx)(
                    `li`,
                    {
                      children: (0, T.jsxs)(r, {
                        to: `/threads`,
                        search: {
                          ...(i === `全部` ? {} : { c: i }),
                          tag: e.tag,
                        },
                        className: `flex items-baseline gap-3 border-b border-border py-2.5 hover:text-primary`,
                        children: [
                          (0, T.jsx)(`span`, {
                            className: `w-5 font-mono text-xs text-muted-foreground`,
                            children: n + 1,
                          }),
                          (0, T.jsxs)(`span`, {
                            className: `flex-1`,
                            children: [`#`, e.tag],
                          }),
                          (0, T.jsx)(`span`, {
                            className: `font-mono text-xs text-muted-foreground`,
                            children: t(e.posts),
                          }),
                        ],
                      }),
                    },
                    e.tag,
                  ),
                ),
              }),
            ],
          }),
          (0, T.jsxs)(`div`, {
            children: [
              (0, T.jsx)(`h2`, {
                className: `font-mono text-xs uppercase tracking-[0.25em] text-primary`,
                children: `活跃音乐人`,
              }),
              (0, T.jsx)(`ul`, {
                className: `mt-3 space-y-3`,
                children: a
                  .filter((e) => e.role !== `听众`)
                  .slice(0, 5)
                  .map((e) =>
                    (0, T.jsxs)(
                      `li`,
                      {
                        className: `flex items-center gap-3`,
                        children: [
                          (0, T.jsx)(c, { artist: e, size: `sm` }),
                          (0, T.jsxs)(`div`, {
                            className: `min-w-0 flex-1 text-sm`,
                            children: [
                              (0, T.jsx)(u, { artist: e }),
                              (0, T.jsxs)(`p`, {
                                className: `text-xs text-muted-foreground`,
                                children: [
                                  e.city,
                                  ` · `,
                                  e.role,
                                  ` · `,
                                  t(e.followers),
                                  ` 关注`,
                                ],
                              }),
                            ],
                          }),
                        ],
                      },
                      e.id,
                    ),
                  ),
              }),
            ],
          }),
          (0, T.jsxs)(`div`, {
            className: `border border-dashed border-border p-4 text-sm text-muted-foreground`,
            children: [
              (0, T.jsx)(`p`, {
                className: `font-semibold text-foreground`,
                children: `社区守则`,
              }),
              (0, T.jsx)(`p`, {
                className: `mt-1`,
                children: `对事不对人。批评作品可以狠，但要具体。发采样请注明来源。`,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
export { E as component };
