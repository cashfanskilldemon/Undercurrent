import { useCallback, useEffect, useState } from 'react';

import { api } from './api';
import type { ThreadItem } from './types';

/**
 * 点赞 / 收藏：先改本地再发请求（乐观更新），失败回滚
 * 列表项和详情页共用，避免两处逻辑不一致
 */
export function useThreadActions(thread: ThreadItem) {
  const [liked, setLiked] = useState(thread.liked);
  const [likes, setLikes] = useState(thread.likes);
  const [saved, setSaved] = useState(thread.saved);

  useEffect(() => {
    setLiked(thread.liked);
    setLikes(thread.likes);
    setSaved(thread.saved);
  }, [thread.id, thread.liked, thread.likes, thread.saved]);

  const toggleLike = useCallback(async () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const res = await api.post<{ liked: boolean; likes: number }>(`/api/threads/${thread.id}/like`);
      setLiked(res.liked);
      setLikes(res.likes);
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    }
  }, [liked, thread.id]);

  const toggleSave = useCallback(async () => {
    const next = !saved;
    setSaved(next);
    try {
      const res = await api.post<{ saved: boolean }>(`/api/threads/${thread.id}/save`);
      setSaved(res.saved);
    } catch {
      setSaved(!next);
    }
  }, [saved, thread.id]);

  return { liked, likes, saved, toggleLike, toggleSave };
}
