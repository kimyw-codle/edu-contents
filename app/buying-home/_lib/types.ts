export type TaskCategory = 'finance' | 'contract' | 'tax' | 'interior' | 'appliance' | 'moving';

export interface Task {
  id: string;
  category: TaskCategory;
  title: string;
  description?: string;
  deadline: string;
  completed: boolean;
  estimatedCost?: number; // 만원 단위
  actualCost?: number;
  relatedImages?: string[]; // 이미지 경로 또는 gallery ID
}

export interface BudgetExpense {
  id: string;
  item: string;
  amount: number; // 만원
  actual?: number | null;
  sortOrder?: number;
}

export interface FundSource {
  id: string;
  owner: string;
  source: string;
  amount: number; // 만원
  lastUpdated: string;
  sortOrder?: number;
}

export interface GalleryImage {
  id: string;
  category: string;
  name: string;
  storagePath?: string; // Supabase Storage 경로
  uploadDate: string;
  relatedTaskIds?: string[];
}

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  finance: '금융/대출',
  contract: '계약/행정',
  tax: '세금/비용',
  interior: '인테리어',
  appliance: '가전 구입',
  moving: '이사/입주',
};

export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  finance: 'bg-blue-100 text-blue-800 border-blue-200',
  contract: 'bg-purple-100 text-purple-800 border-purple-200',
  tax: 'bg-red-100 text-red-800 border-red-200',
  interior: 'bg-amber-100 text-amber-800 border-amber-200',
  appliance: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  moving: 'bg-pink-100 text-pink-800 border-pink-200',
};

export const CATEGORY_BAR_COLORS: Record<TaskCategory, string> = {
  finance: 'bg-blue-500',
  contract: 'bg-purple-500',
  tax: 'bg-red-500',
  interior: 'bg-amber-500',
  appliance: 'bg-emerald-500',
  moving: 'bg-pink-500',
};

export const GALLERY_CATEGORIES = ['전체', '계약', '인테리어', '가전', '기타'] as const;

export const INTERIOR_SUBCATEGORIES = ['전체', '부엌', '욕실', '현관', '거실', '방'] as const;

export const MOVE_IN_DATE = '2026-10-27';
