# Undercurrent App

地下嘻哈 / 电子音乐社区客户端：讨论、作品、插件、通知与个人主页。一套 Expo 代码同时运行在 Web、iOS 和 Android，后端对接 [Undercurrent-api](https://github.com/cashfanskilldemon/Undercurrent-api)（Spring Boot 3）。

![Undercurrent](./public/img/hero.png)

## 技术栈

| 分类 | 选型 |
|---|---|
| 框架 | Expo SDK 58 · React Native 0.88 · React 19 |
| 路由 | expo-router（文件即路由） |
| 语言 | TypeScript |
| 样式 | React Native StyleSheet + Web 端 CSS 变量 |
| 图标 / 图形 | lucide-react-native · react-native-svg |
| 状态 | React Context + 自定义 hooks，不引入额外状态库 |

## 功能

| 模块 | 说明 |
|---|---|
| 首页 `/home` | 推荐 / 关注双流、日常动态头像条、内联发帖入口 |
| 讨论 `/` | 频道筛选、分页加载、下拉刷新、帖子详情与回复、点赞 / 收藏（乐观更新，失败回滚） |
| 作品 `/tracks` | 流派筛选、最新 / 播放 / 点赞排序、播放计数、上传作品 |
| 插件 `/plugins` | 分类筛选、两列网格 |
| 发现 `/discover` | 艺人 / 作品 / 帖子 / 插件四类聚合搜索、热门话题 |
| 通知 `/notifications` | 未读高亮、单条已读、全部已读、导航未读角标 |
| 我的 `/me` | Ins 式个人主页：资料卡 + 统计、精选、帖子/作品/收藏三栏网格、编辑资料、退出登录 |
| 注册引导 `/onboarding` | 流派泡泡云（126 个流派，最多选 12 个）→ 艺人 → 身份 → 年龄段 → 城市；可跳过，刷新后回填上次选择 |
| 账号 | 邮箱注册（6 位验证码）、登录、找回密码 |
| 外观 | 深色 / 浅色 / 跟随系统，选择写入 `localStorage` |

## 快速开始

要求 Node **22.13+**（Expo SDK 58 的最低版本），后端已启动。

```bash
npm install        # 首次
npm run web        # 浏览器预览，http://localhost:8081
npm run android    # Android 模拟器 / 真机
npm run ios        # 需要 macOS
```

### 连接后端

默认地址按平台自动选择，无需配置：

| 运行环境 | 地址 |
|---|---|
| Web / iOS 模拟器 | `http://localhost:8080` |
| Android 模拟器 | `http://10.0.2.2:8080`（模拟器里的 localhost 指向设备自身） |
| 真机 | 必须指向电脑的局域网 IP |

真机调试时复制 `.env.example` 为 `.env`，填入后端所在机器的地址（手机与电脑需在同一网段）：

```
EXPO_PUBLIC_API_BASE=http://192.168.1.20:8080
```

`EXPO_PUBLIC_*` 在打包时注入，改完需要重启 dev server。

### 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `EXPO_PUBLIC_API_BASE` | 否 | 后端地址，未设置时按上表回退 |

## 路由

路由由 `src/app/` 下的文件决定，`_layout.tsx` 定义导航结构。

| 路由 | 文件 | 说明 |
|---|---|---|
| `/login` | `login.tsx` | 账号或邮箱 + 密码登录 |
| `/register` | `register.tsx` | 邮箱 / 账号两种注册方式，邮箱模式带验证码倒计时 |
| `/forgot-password` | `forgot-password.tsx` | 邮箱 + 验证码重置密码 |
| `/onboarding` | `onboarding.tsx` | 注册后五步引导，整屏展示，不显示导航 |
| `/home` | `(tabs)/home.tsx` | 首页 |
| `/` | `(tabs)/index.tsx` | 讨论列表 |
| `/tracks` | `(tabs)/tracks.tsx` | 作品列表 |
| `/plugins` | `(tabs)/plugins.tsx` | 插件列表 |
| `/discover` | `(tabs)/discover.tsx` | 聚合搜索 |
| `/notifications` | `(tabs)/notifications.tsx` | 通知 |
| `/me` | `(tabs)/me.tsx` | 我的 |
| `/post/[id]` | `post/[id].tsx` | 帖子详情 + 回复列表 |

底部 tab 在宽屏 Web 下隐藏，改用左侧导航（见「响应式」）。

## 目录结构

```
src/
├── app/                          路由（expo-router）
│   ├── _layout.tsx               登录门禁 + 三栏框架 + 主题恢复
│   ├── (tabs)/_layout.tsx        底部 tab（宽屏隐藏）
│   ├── (tabs)/home.tsx           首页
│   ├── (tabs)/index.tsx          讨论
│   ├── (tabs)/tracks.tsx         作品
│   ├── (tabs)/plugins.tsx        插件
│   ├── (tabs)/discover.tsx       发现
│   ├── (tabs)/notifications.tsx  通知
│   ├── (tabs)/me.tsx             我的
│   ├── login.tsx / register.tsx / forgot-password.tsx
│   ├── onboarding.tsx            注册引导（泡泡云 + 四步表单）
│   └── post/[id].tsx           帖子详情
├── components/
│   ├── bubble-cloud.tsx          流派泡泡云（rAF 物理：漂浮 / 碰撞 / 边界反弹 / 拖拽平移）
│   ├── side-nav.tsx              宽屏左侧导航（悬停展开，底部发帖 / 菜单）
│   ├── side-menu.tsx             LOGO 旁菜单：外观 / 声音 / 设置 / 退出
│   ├── right-rail.tsx            宽屏右栏：搜索、推荐关注、热门作品、标签
│   ├── advanced-search.tsx       高级搜索面板（日期 / 精确匹配 / 类型 / 来源）
│   ├── composer-dialog.tsx       发帖 / 上传作品弹窗（双 tab）
│   ├── post-card.tsx           帖子卡
│   ├── action-bar.tsx            点赞 / 评论 / 转发 / 分享 / 收藏
│   ├── track-row.tsx             作品行（播放入口）
│   ├── plugin-card.tsx           插件卡
│   ├── auth-shell.tsx            登录 / 注册 / 找回密码共用外壳
│   ├── avatar.tsx                hue → 色块 + 首字
│   └── chips.tsx / feedback.tsx / logo.tsx
├── constants/theme.ts            颜色、圆角、字号、间距令牌
├── lib/
│   ├── api.ts                    fetch 封装（Bearer token、统一 code 判断、401 回调）
│   ├── auth.ts                   token 持久化与恢复
│   ├── session.ts                当前用户 Context
│   ├── types.ts                  与后端 VO 对齐的类型
│   ├── use-paged.ts              分页 / 一次性资源 hook
│   ├── use-post-actions.ts     点赞 / 收藏乐观更新
│   ├── use-breakpoint.ts         响应式断点（仅 Web 生效）
│   ├── theme-mode.ts             主题选择与 <html data-theme>
│   ├── composer.tsx              发帖弹窗全局状态
│   ├── unread.ts / refresh.ts    未读数、写后刷新信号
│   └── format.ts                 相对时间、1.8万、3:27
└── global.css                    Web 端 CSS 变量（深色 / 浅色两套）
```

## 登录与门禁

`src/lib/auth.ts` 负责凭证持久化，Web 存在 `localStorage` 的 `undercurrent.auth`。

| 状态 | 行为 |
|---|---|
| 无 token | 除登录 / 注册 / 找回密码外，全部重定向到 `/login` |
| 有 token | 直接进入应用；访问登录页会被送回 `/home` |
| 登录成功 | `needsOnboarding` 为 true 时进 `/onboarding`，否则进 `/home` |
| 刷新页面 | 启动时同步恢复 token，不会闪回登录页 |
| 退出 / 401 | 清除本地凭证，界面切回登录态 |

请求统一带 `Authorization: Bearer <token>`；`api.ts` 收到 401 时清空凭证并通知根布局切回登录页。

## 响应式

`useBreakpoint()` 只在 Web 上按窗口宽度切换，iOS / Android 始终是单列布局。

| 窗口宽度 | 形态 | 导航 | 右栏 |
|---|---|---|---|
| < 768px | 单列 | 底部 tab | 无 |
| ≥ 768px | 两栏 | 左侧 80px 导航栏 | 无 |
| ≥ 1120px | 三栏 | 左侧 80px 导航栏 | 右侧 300px |

中列最大宽度 680px，相对整个视口居中（左右两侧宽度不同，用补偿内边距抵消差值）。

## 主题

设计令牌以 oklch 定义，React Native 不支持 oklch，已换算成 sRGB 写入 `constants/theme.ts`；Web 端另有一套 CSS 变量（`global.css`），通过 `<html data-theme="dark|light">` 切换，避免刷新时闪烁。

| 令牌 | oklch | hex |
|---|---|---|
| background | `oklch(10% 0 0)` | `#030303` |
| foreground | `oklch(94% .014 95)` | `#eeebe1` |
| primary | `oklch(88% .17 122)` | `#c5e95c` |
| destructive | `oklch(63% .17 36)` | `#dc5b37` |

## 常用命令

```bash
npm run web           # Web 开发
npm run android       # Android
npm run ios           # iOS（macOS）
npm run lint          # ESLint
npx tsc --noEmit      # 类型检查
```

新增依赖统一用 `npx expo install <package>`，由 Expo 解析与当前 SDK 匹配的版本。

## 相关仓库

- [Undercurrent-api](https://github.com/cashfanskilldemon/Undercurrent-api) —— Spring Boot 后端，提供本文涉及的全部接口

## License

MIT
