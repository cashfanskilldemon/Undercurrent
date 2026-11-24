import { Outlet } from 'react-router-dom';
import { LeftRail } from './LeftRail';
import { RightRail } from './RightRail';
import { MobileTabBar } from './MobileTabBar';
import { ComposerDialog } from '../ComposerDialog';
import { MiniPlayer } from '../MiniPlayer';
import { ToastViewport } from '../ToastViewport';

/** 全站骨架：左导航 + 中列 + 右栏，移动端底部导航 */
export function AppShell() {
  return (
    <div className="min-h-screen bg-bg">
      <LeftRail />

      <div className="md:pl-[84px] xl:pl-[260px]">
        <div className="mx-auto flex w-full max-w-shell justify-center">
          <main className="min-h-screen w-full max-w-feed border-border pb-28 md:border-x md:pb-32">
            <Outlet />
          </main>
          <RightRail />
        </div>
      </div>

      <MobileTabBar />
      <MiniPlayer />
      <ComposerDialog />
      <ToastViewport />
    </div>
  );
}
