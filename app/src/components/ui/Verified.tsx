import { BadgeCheck } from 'lucide-react';

/** 认证徽章：官方认证的艺人/插件作者 */
export function Verified({ size = 15 }: { size?: number }) {
  return (
    <span className="inline-flex text-primary" title="已认证" aria-label="已认证">
      <BadgeCheck size={size} strokeWidth={2.4} />
    </span>
  );
}
