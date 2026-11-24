import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from './api';
import type { Paged } from './types';

type Query = Record<string, string | number | boolean | null | undefined>;

/**
 * 分页列表：切筛选条件自动回到第 1 页，支持下拉刷新与触底加载
 * key 用 JSON 序列化，避免对象字面量每次浅比较不等造成死循环
 */
export function usePaged<T>(path: string, query: Query = {}, size = 10) {
  const key = JSON.stringify(query);
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alive = useRef(true);
  const seq = useRef(0);

  const fetchPage = useCallback(
    async (targetPage: number, mode: 'first' | 'more' | 'refresh') => {
      const mySeq = ++seq.current;
      if (mode === 'more') setLoadingMore(true);
      else if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);

      try {
        const data = await api.get<Paged<T>>(path, { ...JSON.parse(key), page: targetPage, size });
        if (!alive.current || mySeq !== seq.current) return;
        setItems((prev) => (mode === 'more' ? [...prev, ...data.list] : data.list));
        setPage(data.page ?? targetPage);
        setHasMore(Boolean(data.hasMore));
        setError(null);
      } catch (e) {
        if (!alive.current || mySeq !== seq.current) return;
        setError(e instanceof Error ? e.message : '加载失败');
        if (mode !== 'more') setItems([]);
      } finally {
        if (alive.current && mySeq === seq.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [path, key, size],
  );

  useEffect(() => {
    alive.current = true;
    setHasMore(true);
    fetchPage(1, 'first');
    return () => {
      alive.current = false;
    };
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || refreshing || !hasMore) return;
    fetchPage(page + 1, 'more');
  }, [fetchPage, page, hasMore, loading, loadingMore, refreshing]);

  const refresh = useCallback(() => fetchPage(1, 'refresh'), [fetchPage]);

  const patchItem = useCallback((id: number, updater: (item: T) => T) => {
    setItems((prev) => prev.map((it) => ((it as unknown as { id: number }).id === id ? updater(it) : it)));
  }, []);

  return useMemo(
    () => ({ items, loading, loadingMore, refreshing, error, hasMore, loadMore, refresh, patchItem, setItems }),
    [items, loading, loadingMore, refreshing, error, hasMore, loadMore, refresh, patchItem],
  );
}

/** 一次性资源（meta / 详情） */
export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      const res = await api.get<T>(path);
      if (alive.current) {
        setData(res);
        setError(null);
      }
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    reload();
    return () => {
      alive.current = false;
    };
  }, [reload]);

  return { data, loading, error, reload, setData };
}
