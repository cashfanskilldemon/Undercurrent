import { router } from 'expo-router';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { useSession } from '@/lib/session';

export type ComposerMode = 'post' | 'upload';
export type ComposerPreset = { channel?: string; tag?: string };

type ComposerState = {
  open: boolean;
  mode: ComposerMode;
  preset: ComposerPreset;
  /** 每次打开自增，供弹窗内部重置表单 */
  seq: number;
};

type ComposerContextValue = ComposerState & {
  openComposer: (mode?: ComposerMode, preset?: ComposerPreset) => void;
  closeComposer: () => void;
};

const initial: ComposerState = { open: false, mode: 'post', preset: {}, seq: 0 };

const ComposerContext = createContext<ComposerContextValue>({
  ...initial,
  openComposer: () => {},
  closeComposer: () => {},
});

/** 全局发帖/上传弹窗的状态源，挂一次即可，所有入口靠 openComposer 唤起 */
export function ComposerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ComposerState>(initial);
  const { userId } = useSession();

  const value = useMemo<ComposerContextValue>(
    () => ({
      ...state,
      /** 未登录时先跳登录页，不打开弹窗（发帖/上传都需要身份） */
      openComposer: (mode = 'post', preset = {}) => {
        if (userId == null) {
          router.push('/login');
          return;
        }
        setState((s) => ({ open: true, mode, preset, seq: s.seq + 1 }));
      },
      closeComposer: () => setState((s) => ({ ...s, open: false })),
    }),
    [state, userId],
  );

  return <ComposerContext.Provider value={value}>{children}</ComposerContext.Provider>;
}

export function useComposer() {
  return useContext(ComposerContext);
}
