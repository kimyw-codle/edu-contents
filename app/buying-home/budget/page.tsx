'use client';

import { useState, useRef } from 'react';
import { useSupabaseTable } from '../_lib/store';
import type { BudgetExpense, FundSource } from '../_lib/types';
import { formatMoneyWon, formatDateFull, generateId } from '../_lib/utils';

function DragHandle() {
  return <span className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 select-none px-1 hidden md:inline">&#x2630;</span>;
}

export default function BudgetPage() {
  const { data: expenses, loaded, upsertItem: upsertExpense, updateItem: updateExpense, removeItem: removeExpense, reorderItems: reorderExpenses } = useSupabaseTable<BudgetExpense>('expenses', 'sort_order');
  const { data: fundSources, upsertItem: upsertFund, updateItem: updateFund, removeItem: removeFund, reorderItems: reorderFunds } = useSupabaseTable<FundSource>('fund_sources', 'sort_order');
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editingFund, setEditingFund] = useState<string | null>(null);
  const dragItem = useRef<{ type: string; index: number } | null>(null);
  const dragOverItem = useRef<{ type: string; index: number } | null>(null);

  if (!loaded) return <div className="text-center py-20 text-gray-400">로딩 중...</div>;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalActual = expenses.reduce((sum, e) => sum + (e.actual ?? 0), 0);
  const totalFunds = fundSources.reduce((sum, f) => sum + f.amount, 0);
  const gap = totalFunds - totalExpenses;

  const juyoungFunds = fundSources.filter(f => f.owner === '주영');
  const yewonFunds = fundSources.filter(f => f.owner === '예원');
  const juyoungTotal = juyoungFunds.reduce((s, f) => s + f.amount, 0);
  const yewonTotal = yewonFunds.reduce((s, f) => s + f.amount, 0);

  const handleDragStart = (type: string, index: number) => { dragItem.current = { type, index }; };
  const handleDragOver = (e: React.DragEvent, type: string, index: number) => { e.preventDefault(); dragOverItem.current = { type, index }; };

  const handleDrop = async (type: string) => {
    if (!dragItem.current || !dragOverItem.current || dragItem.current.type !== type || dragOverItem.current.type !== type) return;
    const from = dragItem.current.index, to = dragOverItem.current.index;
    if (from === to) return;

    if (type === 'expense') {
      const items = [...expenses];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      await reorderExpenses(items);
    } else {
      const owner = type.replace('fund-', '');
      const ownerFunds = fundSources.filter(f => f.owner === owner);
      const [moved] = ownerFunds.splice(from, 1);
      ownerFunds.splice(to, 0, moved);
      const others = fundSources.filter(f => f.owner !== owner);
      await reorderFunds([...others, ...ownerFunds]);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const addExpense = async () => {
    await upsertExpense({ id: generateId(), item: '새 항목', amount: 0, sortOrder: expenses.length } as BudgetExpense);
  };
  const addFund = async (owner: string) => {
    const today = new Date().toISOString().split('T')[0];
    const count = fundSources.filter(f => f.owner === owner).length;
    await upsertFund({ id: generateId(), owner, source: '새 항목', amount: 0, lastUpdated: today, sortOrder: count } as FundSource);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">예산 관리</h1>

      {/* 요약 카드 - 모바일 1열, 데스크탑 3열 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs sm:text-sm text-gray-500">총 필요 금액</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{formatMoneyWon(totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs sm:text-sm text-gray-500">총 가용 자금</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{formatMoneyWon(totalFunds)}</p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${gap >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs sm:text-sm text-gray-500">차액</p>
          <p className={`text-lg sm:text-xl font-bold mt-1 ${gap >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatMoneyWon(gap)}</p>
        </div>
      </div>

      {/* 지출 항목 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">지출 항목</h2>
          <button onClick={addExpense} className="text-sm text-blue-600 hover:underline">+ 추가</button>
        </div>

        {/* 데스크탑: 테이블 */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="w-8"></th><th className="text-left py-2 font-medium">항목</th>
                <th className="text-right py-2 font-medium">예상 금액</th><th className="text-right py-2 font-medium">실제 금액</th><th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp, idx) => (
                <tr key={exp.id} draggable onDragStart={() => handleDragStart('expense', idx)} onDragOver={e => handleDragOver(e, 'expense', idx)} onDrop={() => handleDrop('expense')} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3"><DragHandle /></td>
                  <td className="py-3">
                    {editingExpense === exp.id ? (
                      <input value={exp.item} onChange={e => updateExpense(exp.id, { item: e.target.value })} onBlur={() => setEditingExpense(null)} onKeyDown={e => e.key === 'Enter' && setEditingExpense(null)} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" autoFocus />
                    ) : (
                      <span onClick={() => setEditingExpense(exp.id)} className="cursor-pointer hover:text-blue-600">{exp.item}</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <input type="number" value={exp.amount} onChange={e => updateExpense(exp.id, { amount: Number(e.target.value) })} className="border border-gray-200 rounded px-2 py-1 text-sm text-right w-28 hover:border-gray-400 focus:border-blue-500" />
                    <span className="text-xs text-gray-400 ml-1">만원</span>
                  </td>
                  <td className="py-3 text-right">
                    <input type="number" value={exp.actual ?? ''} onChange={e => updateExpense(exp.id, { actual: e.target.value ? Number(e.target.value) : null })} placeholder="-" className="border border-gray-200 rounded px-2 py-1 text-sm text-right w-28 hover:border-gray-400 focus:border-blue-500" />
                    <span className="text-xs text-gray-400 ml-1">만원</span>
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => removeExpense(exp.id)} className="text-xs text-gray-300 hover:text-red-500">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t border-gray-200">
                <td></td><td className="py-3">합계</td>
                <td className="py-3 text-right">{formatMoneyWon(totalExpenses)}</td>
                <td className="py-3 text-right">{totalActual > 0 ? formatMoneyWon(totalActual) : '-'}</td><td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 모바일: 카드 리스트 */}
        <div className="md:hidden space-y-3">
          {expenses.map(exp => (
            <div key={exp.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                {editingExpense === exp.id ? (
                  <input value={exp.item} onChange={e => updateExpense(exp.id, { item: e.target.value })} onBlur={() => setEditingExpense(null)} onKeyDown={e => e.key === 'Enter' && setEditingExpense(null)} className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 mr-2" autoFocus />
                ) : (
                  <span onClick={() => setEditingExpense(exp.id)} className="text-sm font-medium text-gray-800">{exp.item}</span>
                )}
                <button onClick={() => removeExpense(exp.id)} className="text-xs text-gray-300 hover:text-red-500 ml-2">삭제</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400">예상</label>
                  <div className="flex items-center">
                    <input type="number" value={exp.amount} onChange={e => updateExpense(exp.id, { amount: Number(e.target.value) })} className="border border-gray-200 rounded px-2 py-1.5 text-sm text-right w-full" />
                    <span className="text-[10px] text-gray-400 ml-1 shrink-0">만원</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">실제</label>
                  <div className="flex items-center">
                    <input type="number" value={exp.actual ?? ''} onChange={e => updateExpense(exp.id, { actual: e.target.value ? Number(e.target.value) : null })} placeholder="-" className="border border-gray-200 rounded px-2 py-1.5 text-sm text-right w-full" />
                    <span className="text-[10px] text-gray-400 ml-1 shrink-0">만원</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center px-1">
            <span className="text-sm font-bold text-gray-900">합계</span>
            <div className="text-right">
              <span className="text-sm font-bold">{formatMoneyWon(totalExpenses)}</span>
              {totalActual > 0 && <span className="text-xs text-gray-400 ml-2">실제: {formatMoneyWon(totalActual)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 자금 출처 */}
      {[
        { label: '주영', funds: juyoungFunds, total: juyoungTotal, owner: '주영' },
        { label: '예원', funds: yewonFunds, total: yewonTotal, owner: '예원' },
      ].map(({ label, funds, total, owner }) => (
        <div key={owner} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">자금 출처 - {label}</h2>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-500">소계: <strong>{formatMoneyWon(total)}</strong></span>
              <button onClick={() => addFund(owner)} className="text-sm text-blue-600 hover:underline">+ 추가</button>
            </div>
          </div>

          {/* 데스크탑: 테이블 */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="w-8"></th><th className="text-left py-2 font-medium">출처</th>
                  <th className="text-right py-2 font-medium">금액</th><th className="text-right py-2 font-medium">최종 수정일</th><th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {funds.map((fund, idx) => (
                  <tr key={fund.id} draggable onDragStart={() => handleDragStart(`fund-${owner}`, idx)} onDragOver={e => handleDragOver(e, `fund-${owner}`, idx)} onDrop={() => handleDrop(`fund-${owner}`)} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3"><DragHandle /></td>
                    <td className="py-3">
                      {editingFund === fund.id ? (
                        <input value={fund.source} onChange={e => updateFund(fund.id, { source: e.target.value })} onBlur={() => setEditingFund(null)} onKeyDown={e => e.key === 'Enter' && setEditingFund(null)} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" autoFocus />
                      ) : (
                        <span onClick={() => setEditingFund(fund.id)} className="cursor-pointer hover:text-blue-600">{fund.source}</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <input type="number" value={fund.amount} onChange={e => {
                        const today = new Date().toISOString().split('T')[0];
                        updateFund(fund.id, { amount: Number(e.target.value), lastUpdated: today });
                      }} className="border border-gray-200 rounded px-2 py-1 text-sm text-right w-28 hover:border-gray-400 focus:border-blue-500" />
                      <span className="text-xs text-gray-400 ml-1">만원</span>
                    </td>
                    <td className="py-3 text-right text-xs text-gray-400">{fund.lastUpdated ? formatDateFull(fund.lastUpdated) : '-'}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => removeFund(fund.id)} className="text-xs text-gray-300 hover:text-red-500">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일: 카드 리스트 */}
          <div className="md:hidden space-y-3">
            {funds.map(fund => (
              <div key={fund.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  {editingFund === fund.id ? (
                    <input value={fund.source} onChange={e => updateFund(fund.id, { source: e.target.value })} onBlur={() => setEditingFund(null)} onKeyDown={e => e.key === 'Enter' && setEditingFund(null)} className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 mr-2" autoFocus />
                  ) : (
                    <span onClick={() => setEditingFund(fund.id)} className="text-sm font-medium text-gray-800">{fund.source}</span>
                  )}
                  <button onClick={() => removeFund(fund.id)} className="text-xs text-gray-300 hover:text-red-500 ml-2">삭제</button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input type="number" value={fund.amount} onChange={e => {
                      const today = new Date().toISOString().split('T')[0];
                      updateFund(fund.id, { amount: Number(e.target.value), lastUpdated: today });
                    }} className="border border-gray-200 rounded px-2 py-1.5 text-sm text-right w-24" />
                    <span className="text-[10px] text-gray-400 ml-1">만원</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{fund.lastUpdated ? formatDateFull(fund.lastUpdated) : '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
