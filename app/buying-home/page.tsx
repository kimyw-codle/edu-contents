'use client';

import Link from 'next/link';
import { useSupabaseTable } from './_lib/store';
import { CATEGORY_LABELS, CATEGORY_COLORS, type Task, type TaskCategory, type BudgetExpense, type FundSource } from './_lib/types';
import { getDDay, formatMoneyWon, formatDateFull, daysUntil, isOverdue } from './_lib/utils';

export default function DashboardPage() {
  const { data: tasks, loaded: tasksLoaded } = useSupabaseTable<Task>('tasks', 'deadline');
  const { data: expenses } = useSupabaseTable<BudgetExpense>('expenses', 'sort_order');
  const { data: fundSources } = useSupabaseTable<FundSource>('fund_sources', 'sort_order');

  if (!tasksLoaded) return <div className="text-center py-20 text-gray-400">로딩 중...</div>;

  const dday = getDDay();
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFunds = fundSources.reduce((sum, f) => sum + f.amount, 0);
  const gap = totalFunds - totalExpenses;

  const urgentTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const categories = Object.keys(CATEGORY_LABELS) as TaskCategory[];
  const categoryStats = categories.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat);
    const done = catTasks.filter(t => t.completed).length;
    return { category: cat, total: catTasks.length, done };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              D{dday > 0 ? `-${dday}` : dday === 0 ? '-Day!' : `+${Math.abs(dday)}`}
            </h1>
            <p className="text-gray-500 mt-1">입주일 2026.10.27</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{progressPercent}%</div>
            <p className="text-gray-500">{completedCount}/{totalCount} 완료</p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-gray-900 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">예산 요약</h2>
            <Link href="/buying-home/budget" className="text-sm text-blue-600 hover:underline">상세보기</Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">총 필요 금액</span>
              <span className="font-semibold">{formatMoneyWon(totalExpenses)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">총 가용 자금</span>
              <span className="font-semibold">{formatMoneyWon(totalFunds)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-gray-500">차액</span>
                <span className={`font-bold ${gap >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatMoneyWon(gap)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">다가오는 할 일</h2>
            <Link href="/buying-home/tasks" className="text-sm text-blue-600 hover:underline">전체보기</Link>
          </div>
          <div className="space-y-2">
            {urgentTasks.map(task => {
              const days = daysUntil(task.deadline);
              const overdue = isOverdue(task.deadline);
              return (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[task.category]}`}>
                      {CATEGORY_LABELS[task.category]}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{task.title}</span>
                  </div>
                  <span className={`text-xs whitespace-nowrap ml-2 ${overdue ? 'text-red-600 font-bold' : days <= 7 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {overdue ? `${Math.abs(days)}일 지남` : days === 0 ? '오늘' : `${days}일 남음`}
                  </span>
                </div>
              );
            })}
            {urgentTasks.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">모든 할 일을 완료했습니다!</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">카테고리별 진행률</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categoryStats.map(({ category, total, done }) => {
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={category} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category]}`}>
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-xs text-gray-400">{done}/{total}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${CATEGORY_COLORS[category].split(' ')[0].replace('100', '500')}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
