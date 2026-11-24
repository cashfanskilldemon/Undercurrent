import { useSyncExternalStore } from 'react';

/** 全局刷新计数：发帖/上传/已读成功后 +1，列表页订阅它重新拉第一页 */
let seq = 0;
const listeners = new Set<() => void>();

export function bumpRefresh() {
  seq += 1;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot() {
  return seq;
}

export function useRefreshSeq() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
