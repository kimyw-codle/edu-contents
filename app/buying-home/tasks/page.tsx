'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { useSupabaseTable, uploadToStorage, deleteFromStorage, getStorageUrl } from '../_lib/store';
import { CATEGORY_LABELS, CATEGORY_COLORS, type Task, type TaskCategory, type GalleryImage } from '../_lib/types';
import { formatMoneyWon, formatDateFull, daysUntil, isOverdue, generateId } from '../_lib/utils';

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as TaskCategory[];

const TASK_TO_GALLERY_CATEGORY: Record<string, string> = {
  contract: '계약',
  interior: '인테리어',
  appliance: '가전',
};

// 간단한 마크다운 렌더링
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm text-gray-600 leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        const isList = line.trim().startsWith('- ');
        const content = isList ? line.trim().slice(2) : line;
        const rendered = renderInline(content);
        if (isList) {
          return (
            <div key={i} className="flex items-start gap-2 ml-1">
              <span className="text-gray-400 mt-0.5">&#8226;</span>
              <span>{rendered}</span>
            </div>
          );
        }
        return <p key={i}>{rendered}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  // **bold**, *italic*, [link](url) 처리
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
    // Link
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    const matches = [
      boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index! } : null,
      italicMatch ? { type: 'italic', match: italicMatch, index: italicMatch.index! } : null,
      linkMatch ? { type: 'link', match: linkMatch, index: linkMatch.index! } : null,
    ].filter(Boolean).sort((a, b) => a!.index - b!.index);

    if (matches.length === 0) {
      parts.push(<Fragment key={key++}>{remaining}</Fragment>);
      break;
    }

    const first = matches[0]!;
    if (first.index > 0) {
      parts.push(<Fragment key={key++}>{remaining.slice(0, first.index)}</Fragment>);
    }

    if (first.type === 'bold') {
      parts.push(<strong key={key++} className="font-semibold text-gray-800">{first.match[1]}</strong>);
    } else if (first.type === 'italic') {
      parts.push(<em key={key++}>{first.match[1]}</em>);
    } else if (first.type === 'link') {
      parts.push(
        <a key={key++} href={first.match[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
          {first.match[1]}
        </a>
      );
    }

    remaining = remaining.slice(first.index + first.match[0].length);
  }

  return parts;
}

function TaskForm({ task, onSave, onCancel }: {
  task?: Task;
  onSave: (t: Task) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Task>(task ?? {
    id: generateId(), category: 'contract', title: '', description: '', deadline: '', completed: false,
  });
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">카테고리</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as TaskCategory })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
            {ALL_CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">데드라인</label>
          <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">제목</label>
        <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="할 일 제목" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">설명 (마크다운 지원: **굵게**, *기울임*, - 목록, [링크](URL))</label>
        <textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="상세 설명을 입력하세요&#10;줄바꿈이 그대로 적용됩니다" rows={5} className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-y font-mono" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">예상 비용 (만원)</label>
          <input type="number" value={form.estimatedCost ?? ''} onChange={e => setForm({ ...form, estimatedCost: e.target.value ? Number(e.target.value) : undefined })} placeholder="0" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">실제 비용 (만원)</label>
          <input type="number" value={form.actualCost ?? ''} onChange={e => setForm({ ...form, actualCost: e.target.value ? Number(e.target.value) : undefined })} placeholder="0" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">취소</button>
        <button onClick={() => form.title && form.deadline && onSave(form)} className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50" disabled={!form.title || !form.deadline}>
          {task ? '수정' : '추가'}
        </button>
      </div>
    </div>
  );
}

function TaskDetail({ task, taskImages, onToggle, onEdit, onDelete, onClose, onImageUpload, onImageRemove }: {
  task: Task;
  taskImages: GalleryImage[];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onImageUpload: (files: FileList) => void;
  onImageRemove: (imageId: string) => void;
}) {
  const days = daysUntil(task.deadline);
  const overdue = isOverdue(task.deadline) && !task.completed;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingImage, setViewingImage] = useState<GalleryImage | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <span className={`text-xs px-2.5 py-1 rounded-full ${CATEGORY_COLORS[task.category]}`}>{CATEGORY_LABELS[task.category]}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none md:hidden">x</button>
      </div>
      <div>
        <h2 className={`text-xl font-bold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</h2>
        {task.description && (
          <div className="mt-3">
            <MarkdownText text={task.description} />
          </div>
        )}
      </div>

      {/* 첨부 이미지 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">첨부 이미지 ({taskImages.length})</span>
          <button onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-600 hover:text-blue-800">+ 이미지 첨부</button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={e => e.target.files && onImageUpload(e.target.files)} className="hidden" />
        </div>
        {taskImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {taskImages.map(img => (
              <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer" onClick={() => setViewingImage(img)}>
                <img src={getStorageUrl(img.storagePath!)} alt={img.name} className="w-full h-full object-cover" />
                <button
                  onClick={e => { e.stopPropagation(); onImageRemove(img.id); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >x</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm text-gray-500">상태</span>
          <button onClick={onToggle} className={`text-sm font-medium px-3 py-1 rounded-full ${task.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {task.completed ? '완료' : '미완료'}
          </button>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-sm text-gray-500">데드라인</span>
          <span className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
            {formatDateFull(task.deadline)}
            {!task.completed && (
              <span className={`ml-2 text-xs ${overdue ? 'text-red-500' : days <= 7 ? 'text-amber-500' : 'text-gray-400'}`}>
                {overdue ? `${Math.abs(days)}일 지남` : days === 0 ? '오늘' : `D-${days}`}
              </span>
            )}
          </span>
        </div>
        {task.estimatedCost != null && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">예상 비용</span>
            <span className="text-sm font-medium text-gray-900">{formatMoneyWon(task.estimatedCost)}</span>
          </div>
        )}
        {task.actualCost != null && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">실제 비용</span>
            <span className="text-sm font-medium text-gray-900">{formatMoneyWon(task.actualCost)}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onEdit} className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">수정</button>
        <button onClick={onDelete} className="px-4 py-2.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">삭제</button>
      </div>

      {/* 이미지 전체보기 모달 */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white text-sm">{viewingImage.name}</span>
              <button onClick={() => setViewingImage(null)} className="text-white/70 hover:text-white text-2xl">x</button>
            </div>
            <img src={getStorageUrl(viewingImage.storagePath!)} alt={viewingImage.name} className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const { data: tasks, loaded, upsertItem, updateItem, removeItem } = useSupabaseTable<Task>('tasks', 'deadline');
  const { data: galleryImages, upsertItem: upsertGalleryImage, removeItem: removeGalleryImage } = useSupabaseTable<GalleryImage>('gallery_images', 'created_at');
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // URL에서 taskId 파라미터 읽어서 자동 선택
  useEffect(() => {
    if (!loaded) return;
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    if (taskId) {
      setSelectedTaskId(taskId);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [loaded]);

  if (!loaded) return <div className="text-center py-20 text-gray-400">로딩 중...</div>;

  const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null;
  const filteredTasks = activeCategory === 'all' ? tasks : tasks.filter(t => t.category === activeCategory);
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) await updateItem(id, { completed: !task.completed });
  };

  const saveTask = async (t: Task) => {
    await upsertItem(t);
    setEditingId(null);
    setShowAddForm(false);
  };

  const deleteTask = async (id: string) => {
    if (confirm('이 할 일을 삭제하시겠습니까?')) {
      await removeItem(id);
      if (selectedTaskId === id) setSelectedTaskId(null);
    }
  };

  const getTaskImages = (taskId: string) => {
    return galleryImages.filter(img => img.relatedTaskIds?.includes(taskId));
  };

  const handleImageUpload = async (files: FileList, taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    for (const file of Array.from(files)) {
      const id = generateId();
      const ext = file.name.split('.').pop();
      const storagePath = `${id}.${ext}`;
      const publicUrl = await uploadToStorage(file, storagePath);
      if (publicUrl) {
        const galleryCat = TASK_TO_GALLERY_CATEGORY[task?.category ?? ''] ?? '기타';
        const newImage: GalleryImage = {
          id,
          category: galleryCat,
          name: file.name.replace(/\.[^.]+$/, ''),
          storagePath,
          uploadDate: new Date().toISOString().split('T')[0],
          relatedTaskIds: [taskId],
        };
        await upsertGalleryImage(newImage);
      }
    }
  };

  const handleImageRemove = async (imageId: string) => {
    if (!confirm('이 이미지를 삭제하시겠습니까?')) return;
    const img = galleryImages.find(i => i.id === imageId);
    if (img?.storagePath) await deleteFromStorage(img.storagePath);
    await removeGalleryImage(imageId);
  };

  const detailProps = selectedTask ? {
    task: selectedTask,
    taskImages: getTaskImages(selectedTask.id),
    onToggle: () => toggleComplete(selectedTask.id),
    onEdit: () => { setEditingId(selectedTask.id); setSelectedTaskId(null); },
    onDelete: () => deleteTask(selectedTask.id),
    onClose: () => setSelectedTaskId(null),
    onImageUpload: (files: FileList) => handleImageUpload(files, selectedTask.id),
    onImageRemove: handleImageRemove,
  } : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">할 일 관리</h1>
        <button onClick={() => { setShowAddForm(true); setEditingId(null); setSelectedTaskId(null); }} className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">+ 추가</button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        <button onClick={() => setActiveCategory('all')} className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap shrink-0 ${activeCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          전체 ({tasks.length})
        </button>
        {ALL_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap shrink-0 ${activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {CATEGORY_LABELS[cat]} ({tasks.filter(t => t.category === cat).length})
          </button>
        ))}
      </div>

      {showAddForm && <TaskForm onSave={saveTask} onCancel={() => setShowAddForm(false)} />}

      <div className="flex gap-6">
        <div className={`w-full ${selectedTask ? 'hidden md:block md:w-2/5' : ''} space-y-2`}>
          {sortedTasks.map(task => {
            if (editingId === task.id) return <TaskForm key={task.id} task={task} onSave={saveTask} onCancel={() => setEditingId(null)} />;
            const days = daysUntil(task.deadline);
            const overdue = isOverdue(task.deadline) && !task.completed;
            const isSelected = selectedTaskId === task.id;
            return (
              <div key={task.id} onClick={() => { setSelectedTaskId(task.id); setEditingId(null); setShowAddForm(false); }}
                className={`border rounded-lg p-3 bg-white transition-all cursor-pointer ${isSelected ? 'border-gray-900 ring-1 ring-gray-900' : overdue ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'} ${task.completed ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={task.completed} onChange={e => { e.stopPropagation(); toggleComplete(task.id); }} onClick={e => e.stopPropagation()} className="mt-1 h-4 w-4 rounded accent-gray-900" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[task.category]}`}>{CATEGORY_LABELS[task.category]}</span>
                      <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className={overdue ? 'text-red-600 font-semibold' : ''}>
                        {formatDateFull(task.deadline)}
                        {!task.completed && (overdue ? ` (${Math.abs(days)}일 지남)` : days === 0 ? ' (오늘)' : ` (${days}일 남음)`)}
                      </span>
                      {task.estimatedCost != null && <span>{formatMoneyWon(task.estimatedCost)}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {sortedTasks.length === 0 && <p className="text-center py-10 text-gray-400">할 일이 없습니다.</p>}
        </div>

        {detailProps && (
          <div className="hidden md:block md:w-3/5">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <TaskDetail {...detailProps} />
            </div>
          </div>
        )}
      </div>

      {detailProps && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setSelectedTaskId(null)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <TaskDetail {...detailProps} />
          </div>
        </div>
      )}
    </div>
  );
}
