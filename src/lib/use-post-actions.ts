import { useCallback, useEffect, useState } from 'react';

import { api } from './api';
import type { PostItem } from './types';

/**
 * 点赞 / 收藏：先改本地再发请求（乐观更新），失败回滚
 * 列表项和详情页共用，避免两处逻辑不一致
 */
export function usePostActions(post: PostItem) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [saved, setSaved] = useState(post.saved);

  useEffect(() => {
    setLiked(post.liked);
    setLikes(post.likes);
    setSaved(post.saved);
  }, [post.id, post.liked, post.likes, post.saved]);

  const toggleLike = useCallback(async () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const res = await api.post<{ liked: boolean; likes: number }>(`/api/posts/${post.id}/like`);
      setLiked(res.liked);
      setLikes(res.likes);
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    }
  }, [liked, post.id]);

  const toggleSave = useCallback(async () => {
    const next = !saved;
    setSaved(next);
    try {
      const res = await api.post<{ saved: boolean }>(`/api/posts/${post.id}/save`);
      setSaved(res.saved);
    } catch {
      setSaved(!next);
    }
  }, [saved, post.id]);

  return { liked, likes, saved, toggleLike, toggleSave };
}
