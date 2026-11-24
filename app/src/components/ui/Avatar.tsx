import { Link } from 'react-router-dom';
import type { Artist } from '../../types';
import { cn, hueGradient } from '../../lib/format';

interface AvatarProps {
  artist?: Artist;
  size?: number;
  ring?: boolean;
  linked?: boolean;
  className?: string;
}

/** 站点没有真实头像，用艺人首字 + 色相渐变替代，保持每个艺人可辨识 */
export function Avatar({ artist, size = 40, ring = false, linked = true, className }: AvatarProps) {
  const initial = artist?.name.slice(0, 1) ?? '?';
  const face = (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-cn text-white/90',
        ring ? 'border-[3px] border-bg' : '',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: hueGradient(artist?.hue ?? 122),
      }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );

  const wrapped = ring ? (
    <span className="uc-story-ring inline-grid place-items-center rounded-full p-[2px]">
      {face}
    </span>
  ) : (
    face
  );

  if (!linked || !artist) return wrapped;
  return (
    <Link
      to={`/u/${artist.handle}`}
      aria-label={`查看 ${artist.name} 的主页`}
      className="inline-flex rounded-full transition-transform hover:scale-[1.04]"
      onClick={(event) => event.stopPropagation()}
    >
      {wrapped}
    </Link>
  );
}
