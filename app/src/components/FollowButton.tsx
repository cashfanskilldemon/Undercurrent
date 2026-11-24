import { useApp } from '../store/app-store';
import { cn } from '../lib/format';

interface FollowButtonProps {
  artistId: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** 关注按钮：状态存本地，按钮文案与计数联动 */
export function FollowButton({ artistId, size = 'md', className }: FollowButtonProps) {
  const { artistById, isFollowing, toggleFollow, notify } = useApp();
  const artist = artistById(artistId);
  const following = isFollowing(artistId);

  if (!artist || artistId === 'me') return null;

  const handleClick = () => {
    toggleFollow(artistId);
    notify(following ? `已取消关注 ${artist.name}` : `已关注 ${artist.name}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={following}
      className={cn(
        'rounded-full border font-bold transition-colors',
        size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
        following
          ? 'border-border-strong text-muted hover:border-rust/60 hover:text-rust'
          : 'border-transparent bg-primary text-primary-fg hover:brightness-105',
        className,
      )}
    >
      {following ? '已关注' : '关注'}
    </button>
  );
}
