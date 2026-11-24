import { Platform } from 'react-native';

import { setAuthToken } from '@/lib/api';

export type PersistedAuth = {
  token: string;
  userId: number;
  /** 用户名，用于登录后直接显示，可选 */
  account?: string;
};

const KEY = 'undercurrent.auth';

/** Web 用 localStorage 持久化；原生端暂不落地（需 expo-secure-store） */
function storage() {
  if (Platform.OS !== 'web') return null;
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

/** 启动时读回上次的登录态，并把 token 写进 api 模块 */
export function restoreAuth(): PersistedAuth | null {
  const ls = storage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedAuth> | null;
    if (!parsed || typeof parsed.token !== 'string' || typeof parsed.userId !== 'number') {
      return null;
    }
    setAuthToken(parsed.token);
    return { token: parsed.token, userId: parsed.userId, account: parsed.account };
  } catch {
    return null;
  }
}

/** 登录成功：写 token + 持久化 */
export function signIn(token: string, userId: number, account?: string) {
  setAuthToken(token);
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(KEY, JSON.stringify({ token, userId, account } satisfies PersistedAuth));
  } catch {
    // 隐私模式 / 容量满：忽略，退回内存态
  }
}

/** 退出登录 / token 失效：清 token 与本地记录 */
export function signOut() {
  setAuthToken(null);
  const ls = storage();
  try {
    ls?.removeItem(KEY);
  } catch {
    // 忽略
  }
}
