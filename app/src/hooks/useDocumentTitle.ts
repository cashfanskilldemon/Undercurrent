import { useEffect } from 'react';

/** 每个页面设置自己的标题，便于多标签区分 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} · Undercurrent` : 'Undercurrent';
  }, [title]);
}
