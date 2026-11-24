import raw from './mock-data.json';
import type { Artist, MockData, Notice } from '../types';

export const mockData = raw as MockData;

/** 当前登录用户（演示用，不发请求） */
export const me: Artist = {
  id: 'me',
  name: '潮汐线',
  handle: 'tideline',
  city: '上海',
  role: '音乐人',
  hue: 122,
  followers: 128,
  verified: false,
};

export const coverFiles = [
  'cover-1.png',
  'cover-2.png',
  'cover-3.png',
  'cover-4.png',
  'cover-5.png',
  'cover-6.png',
] as const;

export function coverUrl(file: string): string {
  return `/img/${file}`;
}

/** 通知示例数据：指向站内真实内容，便于点击跳转 */
export const baseNotices: Notice[] = [
  {
    id: 'n1',
    type: 'like',
    actorId: 'a5',
    text: '赞了你在「地铁末班」下的回复',
    time: '12 分钟前',
    href: '/threads/th1',
  },
  {
    id: 'n2',
    type: 'reply',
    actorId: 'a8',
    text: '回复了你：采样清版权这事，早点做比事后补救便宜',
    time: '48 分钟前',
    href: '/threads/th2',
  },
  {
    id: 'n3',
    type: 'follow',
    actorId: 'a3',
    text: '关注了你',
    time: '2 小时前',
    href: '/u/ashe.mp3',
  },
  {
    id: 'n4',
    type: 'system',
    text: '本周地下榜更新：8 首新作品进入榜单',
    time: '5 小时前',
    href: '/tracks',
  },
  {
    id: 'n5',
    type: 'like',
    actorId: 'a1',
    text: '赞了你的帖子',
    time: '昨天',
    href: '/threads',
  },
  {
    id: 'n6',
    type: 'system',
    text: 'Soot 1.4.2 已发布，插件区可直接下载',
    time: '2 天前',
    href: '/plugins',
  },
];
