'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CATEGORY_COLORS, type Task } from '../_lib/types';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export default function MonthlyCalendar({ tasks, compact = false }: { tasks: Task[]; compact?: boolean }) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = new Array(startDayOfWeek).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isTodayCell = (day: number) =>
    year === today.getFullYear() && month === today.getMonth() && day === today.getDate();

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.deadline === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const maxShow = compact ? 2 : 3;
  const cellHeight = compact ? 'min-h-[60px] md:min-h-[70px]' : 'min-h-[80px] md:min-h-[100px]';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 text-sm">&larr;</button>
        <div className="flex items-center gap-3">
          <h2 className={`${compact ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>{year}년 {month + 1}월</h2>
          <button onClick={goToday} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">오늘</button>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 text-sm">&rarr;</button>
      </div>

      <div className="grid grid-cols-7 gap-px mb-1">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {weeks.flat().map((day, i) => {
          const dayOfWeek = i % 7;
          const dayTasks = day ? getTasksForDay(day) : [];
          return (
            <div key={i} className={`${cellHeight} p-1 ${day ? 'bg-white' : 'bg-gray-50'}`}>
              {day && (
                <>
                  <div className="flex justify-center mb-0.5">
                    <span className={`text-[10px] md:text-xs w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full ${
                      isTodayCell(day)
                        ? 'bg-blue-600 text-white font-bold'
                        : dayOfWeek === 0
                        ? 'text-red-500'
                        : dayOfWeek === 6
                        ? 'text-blue-500'
                        : 'text-gray-700'
                    }`}>
                      {day}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, maxShow).map(task => (
                      <Link key={task.id} href={`/buying-home/tasks?taskId=${task.id}`} className={`block text-[9px] md:text-[10px] truncate px-0.5 py-0.5 rounded hover:opacity-80 ${CATEGORY_COLORS[task.category]} ${task.completed ? 'line-through opacity-50' : ''}`}>
                        {task.title}
                      </Link>
                    ))}
                    {dayTasks.length > maxShow && (
                      <div className="text-[9px] text-gray-400 text-center">+{dayTasks.length - maxShow}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
