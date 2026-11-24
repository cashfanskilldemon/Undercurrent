import { useSyncExternalStore } from 'react';

/** 通知未读数：通知页拉取后写入，左导航角标订阅，避免两层组件互相传参 */
let count = 0;
const listeners = new Set<() => void>();

export function setUnreadCount(n: number) {
  if (count === n) return;
  count = n;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot() {
  return count;
}

export function useUnreadCount() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
