'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MOVE_IN_DATE } from './_lib/types';
import { getDDay } from './_lib/utils';

const NAV_ITEMS = [
  { href: '/buying-home', label: '대시보드' },
  { href: '/buying-home/tasks', label: '할 일' },
  { href: '/buying-home/budget', label: '예산' },
  { href: '/buying-home/calendar', label: '캘린더' },
  { href: '/buying-home/gallery', label: '갤러리' },
];

export default function BuyingHomeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dday = getDDay();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/buying-home" className="font-bold text-lg text-gray-900">
              입주 성공 기원 프로젝트
            </Link>
            <div className="text-sm text-gray-500">
              D{dday > 0 ? `-${dday}` : dday === 0 ? '-Day' : `+${Math.abs(dday)}`}
              <span className="ml-2 text-gray-400">{MOVE_IN_DATE.replace(/-/g, '.')}</span>
            </div>
          </div>
          <nav className="flex gap-1 -mb-px">
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
