import { Platform } from 'react-native';

/**
 * 后端地址
 * - Web / iOS 模拟器：localhost 直连
 * - Android 模拟器：10.0.2.2 才是宿主机
 * - 真机：必须换成本机局域网 IP，用 .env 覆盖：
 *     EXPO_PUBLIC_API_BASE=http://192.168.1.20:8080
 */
const fallback = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE ?? fallback).replace(/\/$/, '');

/**
 * 登录凭证：内存保存，刷新即失效。
 * 有 token 时请求带 Authorization: Bearer，后端以 token 为准，不再依赖 X-User-Id。
 */
let authToken: string | null = null;
/** 兼容字段：没有 token 时才会带上（后端默认不信任该头，仅本地联调用） */
let currentUserId: number | null = null;

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

/** token 失效（401）时回调，用于把界面切回游客态 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export function setCurrentUserId(id: number | null) {
  currentUserId = id;
}

export function getCurrentUserId() {
  return currentUserId;
}

export class ApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query) {
  // 不用 URL/URLSearchParams：RN 的 polyfill 对 searchParams 支持不全，手拼更稳
  if (!query) return API_BASE + path;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '' || v === '全部') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `${API_BASE}${path}?${parts.join('&')}` : API_BASE + path;
}

async function request<T>(path: string, init?: RequestInit, query?: Query): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(!authToken && currentUserId ? { 'X-User-Id': String(currentUserId) } : {}),
  };

  const controller = new AbortController();
  // 后端首次建连数据库可能十几秒（Hikari 懒加载），15 秒会误判超时；后端已加启动预热，这里留足余量
  const timer = setTimeout(() => controller.abort(), 30000);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), { ...init, headers, signal: controller.signal });
  } catch {
    throw new ApiError(
      controller.signal.aborted ? '请求超时，后端没响应' : `连不上后端 ${API_BASE}`,
      -1,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let json: { code?: number; message?: string; data?: unknown } | null = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(`返回不是 JSON（HTTP ${res.status}）`, res.status);
  }

  // 后端约定：业务失败也走 HTTP 200，靠 code 区分，所以先判 code 再判 status
  if (!json || typeof json.code !== 'number') {
    throw new ApiError(`响应格式异常（HTTP ${res.status}）`, res.status);
  }
  if (json.code !== 0) {
    // token 过期 / 签名不对：清掉本地凭证并通知上层回到游客态
    if (json.code === 401 && authToken) {
      authToken = null;
      onUnauthorized?.();
    }
    throw new ApiError(json.message || '请求失败', json.code);
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>(path, undefined, query),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
};
