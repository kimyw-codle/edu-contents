import { MOVE_IN_DATE } from './types';

export function formatMoney(manwon: number): string {
  const abs = Math.abs(manwon);
  const sign = manwon < 0 ? '-' : manwon > 0 ? '+' : '';
  if (abs >= 10000) {
    const eok = Math.floor(abs / 10000);
    const remainder = abs % 10000;
    if (remainder === 0) return `${sign}${eok}억`;
    return `${sign}${eok}억 ${remainder.toLocaleString()}만`;
  }
  if (abs === 0) return '0';
  return `${sign}${abs.toLocaleString()}만`;
}

export function formatMoneyWon(manwon: number): string {
  return formatMoney(manwon) + '원';
}

export function getDDay(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(MOVE_IN_DATE);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function isOverdue(deadline: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

export function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
