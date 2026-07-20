'use client';

import { useState, useRef } from 'react';
import ImageViewer from '../_components/ImageViewer';
import { useSupabaseTable, uploadToStorage, deleteFromStorage, getStorageUrl } from '../_lib/store';
import { GALLERY_CATEGORIES, INTERIOR_SUBCATEGORIES, type GalleryImage } from '../_lib/types';
import { formatDateFull, generateId } from '../_lib/utils';

// 인테리어 세부 카테고리 포함 전체 카테고리 목록 (카테고리 변경 드롭다운용)
function getAllCategoryOptions(): string[] {
  const options: string[] = [];
  for (const cat of GALLERY_CATEGORIES) {
    if (cat === '전체') continue;
    if (cat === '인테리어') {
      options.push('인테리어');
      for (const sub of INTERIOR_SUBCATEGORIES) {
        if (sub === '전체') continue;
        options.push(`인테리어/${sub}`);
      }
    } else {
      options.push(cat);
    }
  }
  return options;
}

function getCategoryDisplay(category: string): string {
  if (category.startsWith('인테리어/')) {
    return category; // "인테리어/부엌" 그대로
  }
  return category;
}

export default function GalleryPage() {
  const { data: images, loaded, upsertItem, removeItem } = useSupabaseTable<GalleryImage>('gallery_images', 'created_at');
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('전체');
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!loaded) return <div className="text-center py-20 text-gray-400">로딩 중...</div>;

  // 인테리어 관련 이미지 필터링 (인테리어 또는 인테리어/* 모두 포함)
  const isInteriorImage = (img: GalleryImage) => img.category === '인테리어' || img.category.startsWith('인테리어/');

  const filteredImages = (() => {
    if (activeCategory === '전체') return images;
    if (activeCategory === '인테리어') {
      const interiorImages = images.filter(isInteriorImage);
      if (activeSubCategory === '전체') return interiorImages;
      return interiorImages.filter(img => img.category === `인테리어/${activeSubCategory}`);
    }
    return images.filter(img => img.category === activeCategory);
  })();

  // 인테리어 세부 카테고리별 카운트
  const interiorSubCounts = (sub: string) => {
    if (sub === '전체') return images.filter(isInteriorImage).length;
    return images.filter(img => img.category === `인테리어/${sub}`).length;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const id = generateId();
      const ext = file.name.split('.').pop();
      const storagePath = `${id}.${ext}`;

      const publicUrl = await uploadToStorage(file, storagePath);
      if (publicUrl) {
        // 현재 선택된 카테고리/서브카테고리에 맞게 자동 설정
        let category: string;
        if (activeCategory === '인테리어' && activeSubCategory !== '전체') {
          category = `인테리어/${activeSubCategory}`;
        } else if (activeCategory === '전체') {
          category = '기타';
        } else {
          category = activeCategory;
        }

        const newImage: GalleryImage = {
          id,
          category,
          name: file.name.replace(/\.[^.]+$/, ''),
          storagePath,
          uploadDate: new Date().toISOString().split('T')[0],
        };
        await upsertItem(newImage);
      }
    }

    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm(`"${image.name}" 이미지를 삭제하시겠습니까?`)) return;
    if (image.storagePath) await deleteFromStorage(image.storagePath);
    await removeItem(image.id);
    setViewingIndex(null);
  };

  const handleCategoryChange = async (image: GalleryImage, newCategory: string) => {
    await upsertItem({ ...image, category: newCategory });
  };

  const getImageSrc = (image: GalleryImage): string => {
    if (image.storagePath) return getStorageUrl(image.storagePath);
    return '';
  };

  const allCategoryOptions = getAllCategoryOptions();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">갤러리</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {uploading ? '업로드 중...' : '+ 업로드'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
      </div>

      {/* 메인 카테고리 */}
      <div className="flex gap-1 flex-wrap">
        {GALLERY_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => { setActiveCategory(cat); setActiveSubCategory('전체'); }}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat} ({cat === '전체' ? images.length : cat === '인테리어' ? images.filter(isInteriorImage).length : images.filter(img => img.category === cat).length})
          </button>
        ))}
      </div>

      {/* 인테리어 세부 카테고리 */}
      {activeCategory === '인테리어' && (
        <div className="flex gap-1 flex-wrap pl-2 border-l-2 border-amber-300">
          {INTERIOR_SUBCATEGORIES.map(sub => (
            <button key={sub} onClick={() => setActiveSubCategory(sub)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${activeSubCategory === sub ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'}`}>
              {sub} ({interiorSubCounts(sub)})
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map((image, idx) => (
          <div key={image.id} onClick={() => setViewingIndex(idx)}
            className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-gray-400 transition-colors">
            <img src={getImageSrc(image)} alt={image.name} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-sm font-medium truncate">{image.name}</p>
              <p className="text-white/70 text-xs">{getCategoryDisplay(image.category)} / {formatDateFull(image.uploadDate)}</p>
            </div>
          </div>
        ))}
        {filteredImages.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">이미지가 없습니다. 업로드해보세요!</div>
        )}
      </div>

      {viewingIndex !== null && filteredImages[viewingIndex] && (
        <ImageViewer
          images={filteredImages.map(img => ({
            id: img.id,
            src: getImageSrc(img),
            name: img.name,
            subtitle: `${getCategoryDisplay(img.category)} / ${formatDateFull(img.uploadDate)}`,
          }))}
          initialIndex={viewingIndex}
          onClose={() => setViewingIndex(null)}
          toolbar={(index) => {
            const img = filteredImages[index];
            return (
              <>
                <select
                  value={img.category}
                  onChange={e => handleCategoryChange(img, e.target.value)}
                  className="text-xs bg-white/10 text-white border border-white/20 rounded px-2 py-1"
                >
                  {allCategoryOptions.map(cat => (
                    <option key={cat} value={cat} className="text-black">{cat}</option>
                  ))}
                </select>
                <button onClick={() => handleDelete(img)} className="text-xs text-red-400 hover:text-red-300">삭제</button>
              </>
            );
          }}
        />
      )}
    </div>
  );
}
