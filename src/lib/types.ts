/** 与后端 VO 一一对应的类型（undercurrent-api） */

export interface UserBrief {
  id: number;
  name: string;
  handle: string;
  hue: number;
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

export interface ThreadItem {
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

export interface ThreadDetail extends ThreadItem {
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

/** 发现页艺人卡片 / 用户资料 */
export interface UserProfile extends UserBrief {
  bio?: string | null;
  following?: number;
  followed?: boolean;
  tracks?: number;
  threads?: number;
}

/** /api/search 聚合结果 */
export interface SearchResult {
  q: string;
  users: UserProfile[];
  tracks: TrackItem[];
  threads: ThreadItem[];
  plugins: PluginItem[];
  total: number;
}

/** 发帖入参 */
export interface CreateThreadPayload {
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
