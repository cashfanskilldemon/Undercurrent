import { Link } from 'react-router-dom';
import { useApp } from '../../store/app-store';
import { Avatar } from '../ui/Avatar';

/** Ins 式故事条：头像渐变环 + 横向滚动，点击进主页 */
export function StoryStrip() {
  const { artists } = useApp();
  const picks = [...artists].filter((a) => a.id !== 'me').sort((a, b) => b.followers - a.followers).slice(0, 8);

  return (
    <section className="uc-line px-4 py-3 sm:px-6" aria-label="推荐艺人">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-cn text-lg tracking-wide">地下现场</h2>
        <Link to="/search?tab=artists" className="text-xs text-muted hover:text-fg">
          查看全部
        </Link>
      </div>
      <div className="uc-scroll-x">
        {picks.map((artist) => (
          <Link
            key={artist.id}
            to={`/u/${artist.handle}`}
            className="flex w-[68px] shrink-0 flex-col items-center gap-1.5 text-center"
          >
            <Avatar artist={artist} size={56} ring linked={false} />
            <span className="w-full truncate text-[11px] text-muted">{artist.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
