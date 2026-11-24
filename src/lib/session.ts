import { createContext, useContext } from 'react';

export type Session = {
  /** 当前登录用户 id，null 表示未登录（游客） */
  userId: number | null;
  setUserId: (id: number | null) => void;
};

export const SessionContext = createContext<Session>({
  userId: null,
  setUserId: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}
