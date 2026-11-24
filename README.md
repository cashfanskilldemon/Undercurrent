# Undercurrent App

地下嘻哈 / 电子音乐社区，一套代码出 iOS / Android / Web。
对接 `undercurrent-api`（Spring Boot），颜色 / 圆角 / 字号令牌统一维护在 `src/constants/theme.ts`。
手机是主战场，宽屏 Web 自动切到桌面三栏（见「三、响应式布局」）。

**技术栈**：Expo SDK 58 · React Native 0.88 · expo-router · TypeScript · lucide 图标

---

## 一、启动

```bash
npm install                 # 首次
npm run web                 # 浏览器预览，最快
npm run android             # Android 模拟器 / 真机
npm run ios                 # 需要 macOS
```

浏览器默认打开 `http://localhost:8081`。

## 二、连后端

后端要先起着（`undercurrent-api`）：

```bash
cd ../undercurrent-api
java -jar target/undercurrent-api-1.0.0.jar      # 或 mvn spring-boot:run
```

接口地址按平台自动选择，无需配置：

| 运行环境 | 默认地址 |
|---|---|
| Web / iOS 模拟器 | `http://localhost:8080` |
| Android 模拟器 | `http://10.0.2.2:8080`（安卓里 localhost 指向手机自己） |
| 真机 | **必须手改**，见下 |

真机调试：复制 `.env.example` 为 `.env`，填电脑的局域网 IP（手机和电脑同一 Wi-Fi）：

```
EXPO_PUBLIC_API_BASE=http://192.168.1.20:8080
```

改完要重启 `npm run web` / `npm start` 才生效（`EXPO_PUBLIC_*` 是打包时注入的）。

## 三、响应式布局（Web 三栏 / App 单列）

`useBreakpoint()` 只在 **Web** 上按窗口宽度切换，iOS / Android 永远单列手机布局，不受影响。
断点按内容宽度设定：

| 窗口宽度 | 形态 | 导航 | 右栏 |
|---|---|---|---|
| < 768px（含全部原生 App） | 单列 + 底部 tab | 底部 4 个 tab | 无 |
| ≥ 768px | 两栏 | 左侧 80px 图标栏（底部 tab 隐藏） | 无 |
| ≥ 1120px | 三栏 | 左侧 80px 图标栏 | 右侧 340px 搜索 / 推荐关注 / 热门作品 / 标签 |

中列内容最大 680px，相对**整个视口**水平居中（左右两侧宽度不对称时用补偿内边距抵掉差值）；三栏之间不加分隔线，靠留白区分。侧栏导航用 `router.push` 跳 tab，帖子详情路由会高亮「讨论」。

右栏搜索框回车后跳 `/?q=关键词`，讨论页按正文 / 作者 / 频道 / 标签过滤**已加载**的帖子（后端暂无搜索接口），页头有结果数与「清除」；列表滚到底才会加载下一页，所以搜索范围是当前已拉取的页。

搜索框右端的筛选图标可展开 **高级搜索** 面板（`components/advanced-search.tsx`），支持发布日期（今天 / 7 天 / 30 天 / 一年）、精确匹配（只在正文匹配完整关键词）、帖子类型（纯文字 / 带作品 / 带插件）、来自主页、社群或标签，点「应用」拼成 URL 参数跳讨论页，例如 `/?q=采样&exact=1&tag=版权`。筛选条件可叠加，清除按钮回到 `/`。**过滤都在客户端对已加载的帖子生效**，不会向后端发额外请求。

推荐关注取帖子流前 5 位不同作者，「关注 / 已关注」点击直接调 `POST /api/users/{id}/follow` 落库（乐观更新，失败回滚）；刷新后暂不回显已关注状态。

> 改动集中在 `app/_layout.tsx`（三栏框架）、`(tabs)/_layout.tsx`（隐藏 tab 栏）、
> `components/side-nav.tsx`、`components/right-rail.tsx`、`components/advanced-search.tsx`、`lib/use-breakpoint.ts`。
> 除关注按钮外右栏只读；数据来自 `/api/tracks?sort=plays` 与 `/api/meta`。

## 四、目录

```
src/
├── app/                          路由（expo-router，文件即路由）
│   ├── _layout.tsx               根 Stack + 三栏框架 + 登录态 Provider
│   ├── (tabs)/
│   │   ├── _layout.tsx           底部 4 个 tab（宽屏隐藏）
│   │   ├── index.tsx             讨论：频道筛选 + 帖子流
│   │   ├── tracks.tsx            作品：流派 + 排序（最新/播放/点赞）
│   │   ├── plugins.tsx           插件：分类 + 两列网格
│   │   └── me.tsx                我的：登录入口 / 身份、后端连通性、退出登录
│   ├── thread/[id].tsx           帖子详情 + 回复列表
│   └── login.tsx                 演示登录页（选账号写入会话）
├── components/                   展示组件
│   ├── thread-card.tsx           帖子卡（含五动作栏）
│   ├── action-bar.tsx            点赞/评论/转发/分享/收藏
│   ├── track-row.tsx             作品行（cover + 播放入口）
│   ├── plugin-card.tsx           插件卡（色相块 + 旋钮）
│   ├── avatar.tsx                hue → 色块 + 首字
│   ├── chips.tsx                 横向筛选胶囊
│   ├── logo.tsx                  三条波纹，纯描边
│   ├── feedback.tsx              空态 / 错误 / 触底加载
│   ├── side-nav.tsx              80px 窄图标栏（≥768，竖向居中 + 底部发帖/头像，悬停展开文字）
│   ├── right-rail.tsx            宽屏右栏（≥1120，搜索/推荐关注/热门作品/标签）
│   └── advanced-search.tsx       搜索框内的高级搜索面板（五项筛选 + 应用）
├── constants/theme.ts            颜色、圆角、字号、间距令牌
└── lib/
    ├── api.ts                    fetch 封装（统一 code 判断 + X-User-Id）
    ├── types.ts                  与后端 VO 对齐的类型
    ├── use-paged.ts              分页 / 一次性资源两个 hook
    ├── use-thread-actions.ts     点赞收藏乐观更新
    ├── use-breakpoint.ts         响应式断点（仅 Web 生效）
    ├── format.ts                 相对时间、1.8万、3:27
    └── session.ts                当前用户 Context
```

## 四·五、首页 / 发现 / 通知 / 发帖

首页、发现、通知、发帖、上传作品五个功能全部走**真实后端 API**（不是前端 mock），左导航在原有三项之外补了入口，80px 栏宽保持不变。

| 功能 | 路由 | 依赖的后端接口 |
|---|---|---|
| 首页 | `/home` | `GET /api/threads?following=`（推荐/关注流）、`GET /api/users/suggested`（日常动态头像条） |
| 发现 | `/discover?q=` | `GET /api/search?q=`（艺人/作品/帖子/插件四组结果）、热门话题来自 `meta.tags` |
| 通知 | `/notifications` | `GET /api/notifications`、`POST /api/notifications/{id}/read`、`POST /api/notifications/read-all`；未读数驱动左导航角标 |
| 发帖 | 全局弹窗 | `POST /api/threads`（支持 channel/body/tags/image） |
| 上传作品 | 全局弹窗 | `POST /api/tracks`（作品名/流派/BPM/调性/简介/封面） |

相关文件：

- `app/(tabs)/home.tsx` 首页：推荐/关注双 tab、内联发帖入口、日常动态头像条（彩色渐变圆环）、帖子流
- `app/(tabs)/discover.tsx` 发现：搜索框 + 热门话题 + 四类结果分区
- `app/(tabs)/notifications.tsx` 通知：未读高亮、类型图标、全部已读
- `components/composer-dialog.tsx` 发帖/上传双 tab 弹窗，由 `lib/composer.tsx` 全局状态唤起
- `lib/unread.ts` 未读数、`lib/refresh.ts` 写后刷新信号
- `public/img/` 封面图（后端只存文件名，前端拼 `/img/xxx`）

后端新增表/接口见 `undercurrent-api/src/main/resources/db/schema.sql` 与 `migration-20261124.sql`：
`notification` 表、`thread.image` 字段、`user_follow` 假数据，以及 `/api/notifications`、`/api/users/{id}/follow`、`/api/search`、`POST /api/tracks`、`GET /api/threads?following=true`。

### 登录与门禁

`lib/session.ts` 存 `userId`，`lib/auth.ts` 负责 token 持久化（Web 用 `localStorage` 的 `undercurrent.auth`）：

| 状态 | 行为 |
|---|---|
| 没有 token | 除了 `/login`、`/register`、`/forgot-password` 之外的所有路由都会被 `_layout.tsx` 重定向到登录页，**看不到应用内部界面**（`<Redirect href="/login" />`） |
| 有 token | 直接进应用；访问 `/login` 会被送回 `/home` |
| 登录 | `POST /api/auth/login` → `signIn(token, userId)` 写入内存 + localStorage → 跳 `/home` |
| 刷新页面 | 启动时 `restoreAuth()` 同步读回 token，不会闪回登录页 |
| 退出 / token 失效 | `signOut()` 清 token 与本地记录，`userId` 置空，立刻回到登录页 |

请求带 `Authorization: Bearer <token>`，后端验签取用户；任何接口返回 401 时 `api.ts` 会清凭证并通知布局层切回登录页。发帖、上传等入口仍保留一层拦截（`ComposerProvider`），未登录会先跳 `/login`。

三个页面共用 `components/auth-shell.tsx`（背景水印 + 品牌区 + 居中卡片），视觉完全一致：

| 页面 | 路由 | 说明 |
|---|---|---|
| 登录 | `/login` | 账号 + 密码，底部有「注册新账号」与「忘记密码？」入口 |
| 注册 | `/register` | 账号 / 昵称（选填）/ 密码 / 确认密码，注册成功直接登录 |
| 忘记密码 | `/forgot-password` | 提交账号 → 给管理员发站内通知；不暴露账号是否存在 |

演示账号：`admin` / `cashfans03`。
## 五、已完成 / 未做

**能用**：首页推荐/关注流、发现聚合搜索、通知列表与已读、发帖与上传作品（真实落库）、帖子流（分页 + 下拉刷新 + 触底加载）、频道筛选、作品列表与排序、播放计数、插件分类与网格、帖子详情与回复展示、点赞 / 收藏（乐观更新，失败回滚）、系统分享、宽屏 Web 三栏自适应。

**没做**：

| 功能 | 缺什么 |
|---|---|
| 发回复 | 后端没有 `POST /api/threads/{id}/replies`，底部输入框是占位 |
| 登录 | 账号密码 + BCrypt + HMAC token 已接，未登录无法进入应用；**注册、找回密码、token 刷新未做** |
| 音频播放 | 只有播放计数，没接音频文件，需要 `expo-audio` + 真实音频源 |
| 转发 | 后端无转发接口，点击仅提示 |
| 亮色主题 | 现在是纯暗色，Web 的亮色变量还没搬 |
| 关注状态回显 | 右栏关注按钮已接 `POST /api/users/{id}/follow` 并落库，但刷新后未回显已关注列表（接口已具备，待接入初始化） |

## 六、主题令牌

设计令牌以 oklch 定义，React Native 不支持 oklch，已按 OKLab 公式换算成 sRGB 写进 `constants/theme.ts`：

| 令牌 | oklch | hex |
|---|---|---|
| background | `oklch(10% 0 0)` | `#030303` |
| foreground | `oklch(94% .014 95)` | `#eeebe1` |
| primary | `oklch(88% .17 122)` | `#c5e95c` |
| destructive | `oklch(63% .17 36)` | `#dc5b37` |

圆角 `0.625rem` → `radius.lg = 10`，互动图标统一 18px / 1.7 描边。
