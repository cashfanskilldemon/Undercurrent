import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from './store/app-store';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { ThreadsPage } from './pages/ThreadsPage';
import { ThreadDetailPage } from './pages/ThreadDetailPage';
import { TracksPage } from './pages/TracksPage';
import { PluginsPage } from './pages/PluginsPage';
import { SearchPage } from './pages/SearchPage';
import { TopicPage } from './pages/TopicPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { NotFoundPage } from './pages/NotFoundPage';

/** 路由切换回到顶部，避免从详情页返回时停在半空 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="threads" element={<ThreadsPage />} />
            <Route path="threads/:threadId" element={<ThreadDetailPage />} />
            <Route path="tracks" element={<TracksPage />} />
            <Route path="plugins" element={<PluginsPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="topics/:tag" element={<TopicPage />} />
            <Route path="u/:handle" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
