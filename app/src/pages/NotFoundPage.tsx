import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

export function NotFoundPage() {
  useDocumentTitle('页面不存在');

  return (
    <>
      <PageHeader title="页面不存在" backTo="/" />
      <EmptyState
        title="这里什么都没有"
        description="链接可能失效了，回首页继续逛。"
        action={
          <Link to="/" className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-fg">
            回到首页
          </Link>
        }
      />
    </>
  );
}
