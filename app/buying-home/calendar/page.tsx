'use client';

import { useSupabaseTable } from '../_lib/store';
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_BAR_COLORS, type Task, type TaskCategory } from '../_lib/types';
import { formatDate, formatMoneyWon } from '../_lib/utils';

const MONTHS = [
  { label: '7월', start: '2026-07-01', end: '2026-07-31' },
  { label: '8월', start: '2026-08-01', end: '2026-08-31' },
  { label: '9월', start: '2026-09-01', end: '2026-09-30' },
  { label: '10월', start: '2026-10-01', end: '2026-10-31' },
  { label: '11월', start: '2026-11-01', end: '2026-11-30' },
];
const CATEGORIES = Object.keys(CATEGORY_LABELS) as TaskCategory[];
const TIMELINE_START = new Date('2026-07-01').getTime();
const TIMELINE_END = new Date('2026-11-30').getTime();

function dateToPercent(dateStr: string): number {
  const d = new Date(dateStr).getTime();
  const clamped = Math.max(TIMELINE_START, Math.min(TIMELINE_END, d));
  return ((clamped - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 100;
}

export default function CalendarPage() {
  const { data: tasks, loaded } = useSupabaseTable<Task>('tasks', 'deadline');

  if (!loaded) return <div className="text-center py-20 text-gray-400">로딩 중...</div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPercent = dateToPercent(today.toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">타임라인</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
        <div className="relative ml-28 mb-2">
          <div className="flex">
            {MONTHS.map(month => {
              const w = dateToPercent(month.end) - dateToPercent(month.start);
              return <div key={month.label} className="text-center text-sm font-medium text-gray-500 border-l border-gray-200" style={{ width: `${w}%` }}>{month.label}</div>;
            })}
          </div>
        </div>
        <div className="space-y-3">
          {CATEGORIES.map(cat => {
            const catTasks = tasks.filter(t => t.category === cat).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
            if (catTasks.length === 0) return null;
            const barStart = dateToPercent(catTasks[0].deadline);
            const barEnd = dateToPercent(catTasks[catTasks.length - 1].deadline);
            return (
              <div key={cat} className="flex items-center">
                <div className="w-28 shrink-0"><span className={`text-xs px-2 py-1 rounded-full ${CATEGORY_COLORS[cat]}`}>{CATEGORY_LABELS[cat]}</span></div>
                <div className="flex-1 relative h-8 bg-gray-50 rounded border border-gray-100">
                  <div className={`absolute top-1 bottom-1 rounded ${CATEGORY_BAR_COLORS[cat]} opacity-20`} style={{ left: `${barStart}%`, width: `${Math.max(barEnd - barStart, 1)}%` }} />
                  {catTasks.map(task => (
                    <div key={task.id} className="absolute top-0 bottom-0 flex items-center group" style={{ left: `${dateToPercent(task.deadline)}%` }}>
                      <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${task.completed ? 'bg-gray-400' : CATEGORY_BAR_COLORS[task.category]}`} />
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10">
                        <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
                          <div className="font-medium">{task.title}</div>
                          <div className="text-gray-300 mt-0.5">{formatDate(task.deadline)}{task.estimatedCost ? ` / ${formatMoneyWon(task.estimatedCost)}` : ''}{task.completed ? ' (완료)' : ''}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="absolute top-0 bottom-0 w-px bg-red-500 z-10" style={{ left: `${todayPercent}%` }}>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-medium">오늘</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MONTHS.slice(0, 4).map(month => {
          const monthTasks = tasks.filter(t => t.deadline >= month.start && t.deadline <= month.end).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
          const isCurrentMonth = today.getMonth() + 1 === parseInt(month.label);
          return (
            <div key={month.label} className={`bg-white rounded-xl border p-4 ${isCurrentMonth ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'}`}>
              <h3 className="font-bold text-gray-900 mb-3">{month.label}{isCurrentMonth && <span className="text-xs ml-2 text-blue-600 font-normal">이번 달</span>}</h3>
              <div className="space-y-2">
                {monthTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${task.completed ? 'bg-gray-300' : CATEGORY_BAR_COLORS[task.category]}`} />
                    <div className="min-w-0">
                      <div className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{task.title}</div>
                      <div className="text-xs text-gray-400">{formatDate(task.deadline)}{task.estimatedCost ? ` / ${formatMoneyWon(task.estimatedCost)}` : ''}</div>
                    </div>
                  </div>
                ))}
                {monthTasks.length === 0 && <p className="text-xs text-gray-300 text-center py-3">예정된 일정 없음</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
