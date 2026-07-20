'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

// snake_case ↔ camelCase 변환
function toCamel<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result as T;
}

function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const snakeKey = key.replace(/[A-Z]/g, (c: string) => `_${c.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

export function useSupabaseTable<T extends { id: string }>(
  tableName: string,
  orderBy: string = 'created_at',
) {
  const [data, setData] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 초기 데이터 로드
    supabase
      .from(tableName)
      .select('*')
      .order(orderBy)
      .then(({ data: rows, error }) => {
        if (rows && !error) setData(rows.map(r => toCamel<T>(r)));
        setLoaded(true);
      });

    // 실시간 구독
    const channel = supabase
      .channel(`${tableName}-realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => {
              const newItem = toCamel<T>(payload.new);
              if (prev.some(item => item.id === newItem.id)) return prev;
              return [...prev, newItem];
            });
          } else if (payload.eventType === 'UPDATE') {
            setData(prev =>
              prev.map(item =>
                item.id === (payload.new as { id: string }).id
                  ? toCamel<T>(payload.new)
                  : item,
              ),
            );
          } else if (payload.eventType === 'DELETE') {
            setData(prev =>
              prev.filter(item => item.id !== (payload.old as { id: string }).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, orderBy]);

  const upsertItem = useCallback(
    async (item: T) => {
      const snake = toSnake(item as unknown as Record<string, unknown>);
      const { error } = await supabase.from(tableName).upsert(snake);
      if (!error) {
        setData(prev => {
          const exists = prev.find(i => i.id === item.id);
          if (exists) return prev.map(i => (i.id === item.id ? item : i));
          return [...prev, item];
        });
      }
    },
    [tableName],
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>) => {
      const snake = toSnake(updates as Record<string, unknown>);
      const { error } = await supabase.from(tableName).update(snake).eq('id', id);
      if (!error) {
        setData(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
      }
    },
    [tableName],
  );

  const removeItem = useCallback(
    async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (!error) {
        setData(prev => prev.filter(item => item.id !== id));
      }
    },
    [tableName],
  );

  const reorderItems = useCallback(
    async (items: T[]) => {
      const updates = items.map((item, i) => ({
        ...toSnake(item as unknown as Record<string, unknown>),
        sort_order: i,
      }));
      await supabase.from(tableName).upsert(updates);
      setData(items);
    },
    [tableName],
  );

  return { data, loaded, upsertItem, updateItem, removeItem, reorderItems, setData };
}

// Gallery Storage helpers
export async function uploadToStorage(file: File, path: string): Promise<string | null> {
  const { error } = await supabase.storage.from('gallery').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.error('Storage upload error:', error.message);
    alert(`업로드 실패: ${error.message}`);
    return null;
  }
  const { data } = supabase.storage.from('gallery').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFromStorage(path: string): Promise<void> {
  await supabase.storage.from('gallery').remove([path]);
}

export function getStorageUrl(path: string): string {
  return supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl;
}
