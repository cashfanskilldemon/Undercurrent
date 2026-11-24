export interface Artist {
  id: string;
  name: string;
  handle: string;
  city: string;
  role: string;
  hue: number;
  followers: number;
  verified?: boolean;
}

export interface Reply {
  id: string;
  authorId: string;
  time: string;
  body: string;
  likes: number;
}

export type Attachment =
  | { kind: 'track'; trackId: string }
  | { kind: 'plugin'; pluginId: string };

export interface Thread {
  id: string;
  authorId: string;
  channel: string;
  time: string;
  body: string;
  tags: string[];
  likes: number;
  reposts: number;
  attachment?: Attachment;
  pinned?: boolean;
  replies: Reply[];
  /** 用户发帖时可附带一张封面图（文件名，位于 /img/ 下） */
  image?: string;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  genre: string;
  bpm: number;
  musicalKey: string;
  duration: number;
  plays: number;
  likes: number;
  comments: number;
  cover: string;
  released: string;
  blurb: string;
  tags: string[];
}

export interface Plugin {
  id: string;
  name: string;
  makerId: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  downloads: number;
  formats: string[];
  os: string[];
  version: string;
  size: string;
  hue: number;
  knobs: number;
  tagline: string;
  description: string;
  updated: string;
}

export interface TagStat {
  tag: string;
  posts: number;
}

export interface MockData {
  genres: string[];
  channels: string[];
  categories: string[];
  artists: Artist[];
  tracks: Track[];
  plugins: Plugin[];
  threads: Thread[];
  tags: TagStat[];
}

export type NoticeType = 'like' | 'reply' | 'follow' | 'system';

export interface Notice {
  id: string;
  type: NoticeType;
  actorId?: string;
  text: string;
  time: string;
  href?: string;
}

export type ComposerMode = 'post' | 'upload';
