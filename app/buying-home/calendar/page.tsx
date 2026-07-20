'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSupabaseTable } from '../_lib/store';
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_BAR_COLORS, type Task, type TaskCategory } from '../_lib/types';
import { formatDate, formatDateFull, formatMoneyWon } from '../_lib/utils';

type ViewMode = 'timeline' | 'monthly' | 'weekly';

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
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function dateToPercent(dateStr: string): number {
  const d = new Date(dateStr).getTime();
  const clamped = Math.max(TIMELINE_START, Math.min(TIMELINE_END, d));
  return ((clamped - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 100;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ===== 타임라인 뷰 =====
function TimelineView({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPercent = dateToPercent(toDateStr(today));

  return (
    <>
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
                    <Link key={task.id} href={`/buying-home/tasks?taskId=${task.id}`} className="absolute top-0 bottom-0 flex items-center group z-[5]" style={{ left: `${dateToPercent(task.deadline)}%` }}>
                      <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm hover:scale-150 transition-transform ${task.completed ? 'bg-gray-400' : CATEGORY_BAR_COLORS[task.category]}`} />
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10">
                        <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap shadow-lg">
                          <div className="font-medium">{task.title}</div>
                          <div className="text-gray-300 mt-0.5">{formatDate(task.deadline)}{task.estimatedCost ? ` / ${formatMoneyWon(task.estimatedCost)}` : ''}{task.completed ? ' (완료)' : ''}</div>
                        </div>
                      </div>
                    </Link>
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
          const today = new Date();
          const isCurrentMonth = today.getMonth() + 1 === parseInt(month.label);
          return (
            <div key={month.label} className={`bg-white rounded-xl border p-4 ${isCurrentMonth ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'}`}>
              <h3 className="font-bold text-gray-900 mb-3">{month.label}{isCurrentMonth && <span className="text-xs ml-2 text-blue-600 font-normal">이번 달</span>}</h3>
              <div className="space-y-2">
                {monthTasks.map(task => (
                  <Link key={task.id} href={`/buying-home/tasks?taskId=${task.id}`} className="flex items-start gap-2 hover:bg-gray-50 rounded px-1 -mx-1 py-0.5 transition-colors">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${task.completed ? 'bg-gray-300' : CATEGORY_BAR_COLORS[task.category]}`} />
                    <div className="min-w-0">
                      <div className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{task.title}</div>
                      <div className="text-xs text-gray-400">{formatDate(task.deadline)}{task.estimatedCost ? ` / ${formatMoneyWon(task.estimatedCost)}` : ''}</div>
                    </div>
                  </Link>
                ))}
                {monthTasks.length === 0 && <p className="text-xs text-gray-300 text-center py-3">예정된 일정 없음</p>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// MonthlyCalendar는 공유 컴포넌트 사용
import MonthlyCalendar from '../_components/MonthlyCalendar';

// ===== 주별 달력 뷰 =====
function WeeklyCalendar({ tasks }: { tasks: Task[] }) {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getTasksForDate = (date: Date) => {
    const dateStr = toDateStr(date);
    return tasks.filter(t => t.deadline === dateStr);
  };

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };
  const goToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    setWeekStart(d);
  };

  const weekEnd = days[6];
  const weekLabel = `${days[0].getMonth() + 1}/${days[0].getDate()} ~ ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 text-sm">&larr; 이전 주</button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">{weekLabel}</h2>
          <button onClick={goToday} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">이번 주</button>
        </div>
        <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 text-sm">다음 주 &rarr;</button>
      </div>

      {/* 데스크탑: 7열 그리드 */}
      <div className="hidden md:grid grid-cols-7 gap-3">
        {days.map((date, i) => {
          const dayTasks = getTasksForDate(date).sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
          const isToday = date.getTime() === today.getTime();
          return (
            <div key={i} className={`border rounded-xl p-3 min-h-[180px] transition-colors ${isToday ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-100' : 'border-gray-200'}`}>
              <div className="text-center mb-3">
                <div className={`text-xs ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{DAY_NAMES[i]}</div>
                <div className={`text-xl font-bold mt-0.5 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{date.getDate()}</div>
              </div>
              <div className="space-y-1.5">
                {dayTasks.map(task => (
                  <Link key={task.id} href={`/buying-home/tasks?taskId=${task.id}`} className={`block text-xs p-2 rounded-lg border hover:opacity-80 transition-opacity ${CATEGORY_COLORS[task.category]} ${task.completed ? 'line-through opacity-50' : ''}`}>
                    <div className="font-medium truncate">{task.title}</div>
                    {task.estimatedCost != null && (
                      <div className="text-[10px] mt-0.5 opacity-70">{formatMoneyWon(task.estimatedCost)}</div>
                    )}
                  </Link>
                ))}
                {dayTasks.length === 0 && (
                  <p className="text-[10px] text-gray-300 text-center mt-4">일정 없음</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 모바일: 세로 리스트 */}
      <div className="md:hidden space-y-2">
        {days.map((date, i) => {
          const dayTasks = getTasksForDate(date);
          const isToday = date.getTime() === today.getTime();
          if (dayTasks.length === 0 && !isToday) return null;
          return (
            <div key={i} className={`border rounded-lg p-3 ${isToday ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{DAY_NAMES[i]}</span>
                <span className={`font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{date.getMonth() + 1}/{date.getDate()}</span>
                {isToday && <span className="text-xs text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded">오늘</span>}
              </div>
              {dayTasks.length > 0 ? (
                <div className="space-y-1.5">
                  {dayTasks.map(task => (
                    <Link key={task.id} href={`/buying-home/tasks?taskId=${task.id}`} className={`block text-sm p-2 rounded border hover:opacity-80 transition-opacity ${CATEGORY_COLORS[task.category]} ${task.completed ? 'line-through opacity-50' : ''}`}>
                      {task.title}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-300">일정 없음</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== 메인 캘린더 페이지 =====
export default function CalendarPage() {
  const { data: tasks, loaded } = useSupabaseTable<Task>('tasks', 'deadline');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  if (!loaded) return <div className="text-center py-20 text-gray-400">로딩 중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {viewMode === 'timeline' ? '타임라인' : viewMode === 'monthly' ? '월별 달력' : '주별 달력'}
        </h1>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {([
            { key: 'timeline', label: '타임라인' },
            { key: 'monthly', label: '월별' },
            { key: 'weekly', label: '주별' },
          ] as { key: ViewMode; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setViewMode(key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === key ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'timeline' && <TimelineView tasks={tasks} />}
      {viewMode === 'monthly' && <MonthlyCalendar tasks={tasks} />}
      {viewMode === 'weekly' && <WeeklyCalendar tasks={tasks} />}
    </div>
  );
}
