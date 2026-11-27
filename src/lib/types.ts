/** 与后端 VO 一一对应的类型（undercurrent-api） */

export interface UserBrief {
  id: number;
  name: string;
  handle: string;
  hue: number;
  /** 头像图片路径 /avatars/{id}.jpg?t=xxx；null 表示色块占位 */
  avatar?: string | null;
  city?: string;
  role?: string;
  verified?: boolean;
  followers?: number;
}

export interface TrackBrief {
  id: number;
  title: string;
  cover?: string | null;
  durationSec: number;
  bpm?: number | null;
}

export interface Attachment {
  kind: 'track' | 'plugin';
  trackId?: number;
  track?: TrackBrief | null;
}

export interface PostItem {
  id: number;
  author: UserBrief;
  channel: string;
  body: string;
  tags: string[];
  likes: number;
  reposts: number;
  repliesCount: number;
  pinned: boolean;
  attachment?: Attachment | null;
  /** 配图文件名，对应 api 模块拼出的 /img/xxx */
  image?: string | null;
  createdAt: string;
  liked: boolean;
  saved: boolean;
}

export interface Reply {
  id: number;
  author: UserBrief;
  body: string;
  likes: number;
  createdAt: string;
  liked?: boolean;
  parentId?: number | null;
}

export interface PostDetail extends PostItem {
  replies: Reply[];
}

export interface TrackItem {
  id: number;
  title: string;
  artist: UserBrief;
  genre?: string | null;
  bpm?: number | null;
  musicalKey?: string | null;
  duration: number;
  plays: number;
  likes: number;
  comments: number;
  cover?: string | null;
  blurb?: string | null;
  tags: string[];
  spec?: Record<string, unknown> | null;
  createdAt?: string;
  releasedAt?: string;
  liked?: boolean;
}

export interface PluginItem {
  id: number;
  name: string;
  maker: UserBrief;
  category?: string | null;
  price: number;
  rating: number;
  reviews: number;
  downloads: number;
  formats: string[];
  os: string[];
  version?: string | null;
  size?: string | null;
  hue: number;
  knobs: number;
  tagline?: string | null;
  description?: string | null;
}

export interface Channel {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

/** /api/meta 的 tags 是带发帖数的统计对象，不是字符串数组 */
export interface TagStat {
  tag: string;
  posts: number;
}

export interface Meta {
  genres: string[];
  channels: Channel[];
  categories: string[];
  tags: TagStat[];
}

export interface Paged<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

/** 通知：type = like / reply / follow / system */
export interface NotificationItem {
  id: number;
  type: 'like' | 'reply' | 'follow' | 'system';
  actor?: UserBrief | null;
  body: string;
  href?: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  list: NotificationItem[];
  total: number;
  unreadCount: number;
}

/** 个人主页外部链接 */
export interface UserLink {
  id: number;
  url: string;
  title?: string | null;
}

/** 发现页艺人卡片 / 用户资料 */
export interface UserProfile extends UserBrief {
  bio?: string | null;
  following?: number;
  followed?: boolean;
  tracks?: number;
  posts?: number;
  links?: UserLink[];
}

/** 引导第二步的艺人（来自 artist 表，带网易云抓的头像） */
export interface Artist {
  id: number;
  neteaseId?: number;
  name: string;
  alias?: string | null;
  /** 头像相对路径：/artists/2116.jpg，用 API_BASE 拼成完整地址 */
  avatar?: string | null;
  bio?: string | null;
  /** 所属流派分类，如 嘻哈 / 说唱 */
  category?: string | null;
  musicSize?: number;
  albumSize?: number;
}

/** POST /api/auth/login 出参 */
export interface LoginResult {
  token: string;
  expiresIn: number;
  user: UserProfile;
  /** true 表示还没走过注册引导，前端先跳 /onboarding */
  needsOnboarding?: boolean;
}

/** GET /api/onboarding 出参：可选项 + 已选内容 + 是否还需要引导 */
export interface GenreGroup {
  /** 分类名：嘻哈 / 说唱、低音 / 俱乐部 … */
  category: string;
  genres: string[];
}

export interface OnboardingData {
  needsOnboarding: boolean;
  genres: string[];
  /** 按分类分组的流派（宽屏泡泡云用） */
  genreGroups?: GenreGroup[];
  artists: Artist[];
  roles: string[];
  ageGroups: string[];
  genders?: string[];
  cities: string[];
  selectedGenres: string[];
  selectedArtistIds: number[];
  currentRole?: string | null;
  currentAgeGroup?: string | null;
  currentAge?: number | null;
  currentGender?: string | null;
  currentCity?: string | null;
}

/** POST /api/onboarding 入参 */
export interface OnboardingPayload {
  genres: string[];
  artistIds: number[];
  role?: string | null;
  age?: number | null;
  ageGroup?: string | null;
  gender?: string | null;
  city?: string | null;
  skipped?: boolean;
}

/** POST /api/auth/email-code、/sms-code 出参（devCode 仅开发环境返回） */
export interface CodeResult {
  sent: boolean;
  ttlMinutes: number;
  devCode?: string;
}

/** /api/search 聚合结果 */
export interface SearchResult {
  q: string;
  users: UserProfile[];
  tracks: TrackItem[];
  posts: PostItem[];
  plugins: PluginItem[];
  total: number;
}

/** 发帖入参 */
export interface CreatePostPayload {
  channel: string;
  body: string;
  tags?: string[];
  image?: string;
  attachmentKind?: 'track' | 'plugin';
  attachmentTrackId?: number;
}

/** 上传作品入参 */
export interface CreateTrackPayload {
  title: string;
  genre?: string;
  bpm?: number;
  musicalKey?: string;
  blurb?: string;
  cover?: string;
  tags?: string[];
}
