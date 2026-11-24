import { createContext, useContext } from 'react';

type Session = {
  userId: number;
  setUserId: (id: number) => void;
};

export const SessionContext = createContext<Session>({
  userId: 2,
  setUserId: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}
