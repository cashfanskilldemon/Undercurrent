import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  Artist,
  ComposerMode,
  Notice,
  Plugin,
  Reply,
  TagStat,
  Thread,
  Track,
} from '../types';
import { baseNotices, me, mockData } from '../data/site';
import { createId } from '../lib/format';

const STORAGE_KEY = 'undercurrent:app-state:v1';
const THEME_KEY = 'undercurrent:theme';

interface PersistedState {
  likedPosts: Record<string, boolean>;
  bookmarkedPosts: Record<string, boolean>;
  repostedPosts: Record<string, boolean>;
  likedReplies: Record<string, boolean>;
  followed: Record<string, boolean>;
  userThreads: Thread[];
  userTracks: Track[];
  extraReplies: Record<string, Reply[]>;
  readNotices: Record<string, boolean>;
}

type Action =
  | { type: 'togglePostLike'; id: string }
  | { type: 'togglePostBookmark'; id: string }
  | { type: 'togglePostRepost'; id: string }
  | { type: 'toggleReplyLike'; id: string }
  | { type: 'toggleFollow'; id: string }
  | { type: 'addThread'; thread: Thread }
  | { type: 'addTrack'; track: Track }
  | { type: 'addReply'; threadId: string; reply: Reply }
  | { type: 'markRead'; id: string }
  | { type: 'markAllRead'; ids: string[] };

const EMPTY_STATE: PersistedState = {
  likedPosts: {},
  bookmarkedPosts: {},
  repostedPosts: {},
  likedReplies: {},
  followed: {},
  userThreads: [],
  userTracks: [],
  extraReplies: {},
  readNotices: {},
};

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return { ...EMPTY_STATE, ...parsed };
  } catch {
    return EMPTY_STATE;
  }
}

/** 切换布尔标记并返回新对象，避免直接改状态 */
function toggleFlag(map: Record<string, boolean>, key: string): Record<string, boolean> {
  const next = { ...map };
  if (next[key]) {
    delete next[key];
  } else {
    next[key] = true;
  }
  return next;
}

function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case 'togglePostLike':
      return { ...state, likedPosts: toggleFlag(state.likedPosts, action.id) };
    case 'togglePostBookmark':
      return { ...state, bookmarkedPosts: toggleFlag(state.bookmarkedPosts, action.id) };
    case 'togglePostRepost':
      return { ...state, repostedPosts: toggleFlag(state.repostedPosts, action.id) };
    case 'toggleReplyLike':
      return { ...state, likedReplies: toggleFlag(state.likedReplies, action.id) };
    case 'toggleFollow':
      return { ...state, followed: toggleFlag(state.followed, action.id) };
    case 'addThread':
      return { ...state, userThreads: [action.thread, ...state.userThreads] };
    case 'addTrack':
      return { ...state, userTracks: [action.track, ...state.userTracks] };
    case 'addReply': {
      const list = state.extraReplies[action.threadId] ?? [];
      return {
        ...state,
        extraReplies: { ...state.extraReplies, [action.threadId]: [action.reply, ...list] },
      };
    }
    case 'markRead':
      if (state.readNotices[action.id]) return state;
      return { ...state, readNotices: { ...state.readNotices, [action.id]: true } };
    case 'markAllRead': {
      const next = { ...state.readNotices };
      for (const id of action.ids) next[id] = true;
      return { ...state, readNotices: next };
    }
    default:
      return state;
  }
}

interface PlayerState {
  trackId: string | null;
  isPlaying: boolean;
  progress: number;
}

interface ComposerState {
  isOpen: boolean;
  mode: ComposerMode;
  preset: { channel?: string; tag?: string };
}

interface Toast {
  id: string;
  message: string;
}

interface AppContextValue {
  state: PersistedState;
  artists: Artist[];
  tracks: Track[];
  threads: Thread[];
  plugins: Plugin[];
  genres: string[];
  channels: string[];
  categories: string[];
  tagStats: TagStat[];
  notices: Notice[];
  unreadCount: number;
  artistById: (id: string) => Artist | undefined;
  trackById: (id: string) => Track | undefined;
  pluginById: (id: string) => Plugin | undefined;
  isLikedPost: (id: string) => boolean;
  isBookmarkedPost: (id: string) => boolean;
  isRepostedPost: (id: string) => boolean;
  isLikedReply: (id: string) => boolean;
  isFollowing: (artistId: string) => boolean;
  likeCount: (thread: Thread) => number;
  replyCount: (thread: Thread) => number;
  repostCount: (thread: Thread) => number;
  togglePostLike: (id: string) => void;
  togglePostBookmark: (id: string) => void;
  togglePostRepost: (id: string) => void;
  toggleReplyLike: (id: string) => void;
  toggleFollow: (artistId: string) => void;
  addThread: (input: { body: string; channel: string; tags: string[]; image?: string }) => void;
  addTrack: (input: {
    title: string;
    genre: string;
    bpm: number;
    musicalKey: string;
    blurb: string;
    cover: string;
  }) => void;
  addReply: (threadId: string, body: string) => void;
  markNoticeRead: (id: string) => void;
  markAllRead: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  player: PlayerState;
  currentTrack: Track | undefined;
  playTrack: (id: string) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  closePlayer: () => void;
  composer: ComposerState;
  openComposer: (mode?: ComposerMode, preset?: { channel?: string; tag?: string }) => void;
  closeComposer: () => void;
  toasts: Toast[];
  notify: (message: string) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function readTheme(): 'dark' | 'light' {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [theme, setTheme] = useState<'dark' | 'light'>(readTheme);
  const [player, setPlayer] = useState<PlayerState>({ trackId: null, isPlaying: false, progress: 0 });
  const [composer, setComposer] = useState<ComposerState>({ isOpen: false, mode: 'post', preset: {} });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  // 持久化互动状态（不含播放器与主题）
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 存储不可用时静默降级为内存态
    }
  }, [state]);

  // 主题同步到 <html> 与 theme-color
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f5f1' : '#0b0b0a');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // 忽略存储失败
    }
  }, [theme]);

  const artists = useMemo(() => [me, ...mockData.artists], []);
  const tracks = useMemo(() => [...state.userTracks, ...mockData.tracks], [state.userTracks]);
  const threads = useMemo(
    () =>
      [...state.userThreads, ...mockData.threads].map((thread) => ({
        ...thread,
        replies: [...(state.extraReplies[thread.id] ?? []), ...thread.replies],
      })),
    [state.userThreads, state.extraReplies],
  );

  const artistById = useCallback((id: string) => artists.find((a) => a.id === id), [artists]);
  const trackById = useCallback((id: string) => tracks.find((t) => t.id === id), [tracks]);
  const pluginById = useCallback((id: string) => mockData.plugins.find((p) => p.id === id), []);

  const isLikedPost = useCallback((id: string) => Boolean(state.likedPosts[id]), [state.likedPosts]);
  const isBookmarkedPost = useCallback(
    (id: string) => Boolean(state.bookmarkedPosts[id]),
    [state.bookmarkedPosts],
  );
  const isRepostedPost = useCallback(
    (id: string) => Boolean(state.repostedPosts[id]),
    [state.repostedPosts],
  );
  const isLikedReply = useCallback((id: string) => Boolean(state.likedReplies[id]), [state.likedReplies]);
  const isFollowing = useCallback((id: string) => Boolean(state.followed[id]), [state.followed]);

  const likeCount = useCallback(
    (thread: Thread) => thread.likes + (state.likedPosts[thread.id] ? 1 : 0),
    [state.likedPosts],
  );
  const replyCount = useCallback((thread: Thread) => thread.replies.length, []);
  const repostCount = useCallback(
    (thread: Thread) => thread.reposts + (state.repostedPosts[thread.id] ? 1 : 0),
    [state.repostedPosts],
  );

  const notify = useCallback((message: string) => {
    toastSeq.current += 1;
    const toast: Toast = { id: `toast-${toastSeq.current}`, message };
    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addThread = useCallback<AppContextValue['addThread']>(
    ({ body, channel, tags, image }) => {
      const thread: Thread = {
        id: createId('up'),
        authorId: me.id,
        channel,
        time: '刚刚',
        body,
        tags,
        likes: 0,
        reposts: 0,
        replies: [],
        image,
      };
      dispatch({ type: 'addThread', thread });
      notify('已发布到讨论区');
    },
    [notify],
  );

  const addTrack = useCallback<AppContextValue['addTrack']>(
    ({ title, genre, bpm, musicalKey, blurb, cover }) => {
      const track: Track = {
        id: createId('ut'),
        title,
        artistId: me.id,
        genre,
        bpm,
        musicalKey,
        duration: 180,
        plays: 0,
        likes: 0,
        comments: 0,
        cover,
        released: '刚刚',
        blurb,
        tags: [genre, `${bpm} BPM`],
      };
      dispatch({ type: 'addTrack', track });
      notify('作品已提交，等待审核后上架');
    },
    [notify],
  );

  const addReply = useCallback<AppContextValue['addReply']>(
    (threadId, body) => {
      const reply: Reply = {
        id: createId('ur'),
        authorId: me.id,
        time: '刚刚',
        body,
        likes: 0,
      };
      dispatch({ type: 'addReply', threadId, reply });
      notify('回复已发布');
    },
    [notify],
  );

  const markNoticeRead = useCallback((id: string) => {
    dispatch({ type: 'markRead', id });
  }, []);

  const markAllRead = useCallback(() => {
    dispatch({ type: 'markAllRead', ids: baseNotices.map((n) => n.id) });
  }, []);

  const notices = baseNotices;
  const unreadCount = useMemo(
    () => notices.filter((n) => !state.readNotices[n.id]).length,
    [notices, state.readNotices],
  );

  const playTrack = useCallback((id: string) => {
    setPlayer((prev) =>
      prev.trackId === id ? { ...prev, isPlaying: !prev.isPlaying } : { trackId: id, isPlaying: true, progress: 0 },
    );
  }, []);

  const togglePlay = useCallback(() => {
    setPlayer((prev) => (prev.trackId ? { ...prev, isPlaying: !prev.isPlaying } : prev));
  }, []);

  const stepTrack = useCallback(
    (delta: number) => {
      setPlayer((prev) => {
        if (!prev.trackId) return prev;
        const index = tracks.findIndex((t) => t.id === prev.trackId);
        if (index < 0) return prev;
        const next = tracks[(index + delta + tracks.length) % tracks.length];
        return { trackId: next.id, isPlaying: true, progress: 0 };
      });
    },
    [tracks],
  );

  const nextTrack = useCallback(() => stepTrack(1), [stepTrack]);
  const prevTrack = useCallback(() => stepTrack(-1), [stepTrack]);
  const closePlayer = useCallback(() => setPlayer({ trackId: null, isPlaying: false, progress: 0 }), []);

  // 播放进度模拟：没有音频文件，用计时器推进（切歌、进度循环都在这里处理）
  useEffect(() => {
    if (!player.isPlaying || !player.trackId) return;
    const timer = window.setInterval(() => {
      setPlayer((prev) => {
        if (!prev.isPlaying || !prev.trackId) return prev;
        const current = tracks.find((t) => t.id === prev.trackId);
        if (!current) return prev;
        const progress = prev.progress + 1;
        if (progress < current.duration) return { ...prev, progress };
        const index = tracks.findIndex((t) => t.id === current.id);
        const next = tracks[(index + 1) % tracks.length];
        return { trackId: next.id, isPlaying: true, progress: 0 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [player.isPlaying, player.trackId, tracks]);

  const openComposer = useCallback<AppContextValue['openComposer']>((mode = 'post', preset = {}) => {
    setComposer({ isOpen: true, mode, preset });
  }, []);

  const closeComposer = useCallback(() => {
    setComposer((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const currentTrack = useMemo(
    () => (player.trackId ? tracks.find((t) => t.id === player.trackId) : undefined),
    [player.trackId, tracks],
  );

  const value: AppContextValue = {
    state,
    artists,
    tracks,
    threads,
    plugins: mockData.plugins,
    genres: mockData.genres,
    channels: mockData.channels,
    categories: mockData.categories,
    tagStats: mockData.tags,
    notices,
    unreadCount,
    artistById,
    trackById,
    pluginById,
    isLikedPost,
    isBookmarkedPost,
    isRepostedPost,
    isLikedReply,
    isFollowing,
    likeCount,
    replyCount,
    repostCount,
    togglePostLike: (id) => dispatch({ type: 'togglePostLike', id }),
    togglePostBookmark: (id) => dispatch({ type: 'togglePostBookmark', id }),
    togglePostRepost: (id) => dispatch({ type: 'togglePostRepost', id }),
    toggleReplyLike: (id) => dispatch({ type: 'toggleReplyLike', id }),
    toggleFollow: (id) => dispatch({ type: 'toggleFollow', id }),
    addThread,
    addTrack,
    addReply,
    markNoticeRead,
    markAllRead,
    theme,
    toggleTheme,
    player,
    currentTrack,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    closePlayer,
    composer,
    openComposer,
    closeComposer,
    toasts,
    notify,
    dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内使用');
  return ctx;
}
