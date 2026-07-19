'use client';

import { useState, useRef } from 'react';
import { useSupabaseTable, uploadToStorage, deleteFromStorage, getStorageUrl } from '../_lib/store';
import { GALLERY_CATEGORIES, type GalleryImage } from '../_lib/types';
import { formatDateFull, generateId } from '../_lib/utils';

export default function GalleryPage() {
  const { data: images, loaded, upsertItem, removeItem } = useSupabaseTable<GalleryImage>('gallery_images', 'created_at');
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [viewingImage, setViewingImage] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!loaded) return <div className="text-center py-20 text-gray-400">로딩 중...</div>;

  const filteredImages = activeCategory === '전체' ? images : images.filter(img => img.category === activeCategory);

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
        const newImage: GalleryImage = {
          id,
          category: activeCategory === '전체' ? '기타' : activeCategory,
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
    setViewingImage(null);
  };

  const handleCategoryChange = async (image: GalleryImage, newCategory: string) => {
    await upsertItem({ ...image, category: newCategory });
    setViewingImage({ ...image, category: newCategory });
  };

  const getImageSrc = (image: GalleryImage): string => {
    if (image.storagePath) return getStorageUrl(image.storagePath);
    return '';
  };

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

      <div className="flex gap-1 flex-wrap">
        {GALLERY_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat} ({cat === '전체' ? images.length : images.filter(img => img.category === cat).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map(image => (
          <div key={image.id} onClick={() => setViewingImage(image)}
            className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-gray-400 transition-colors">
            <img src={getImageSrc(image)} alt={image.name} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-sm font-medium truncate">{image.name}</p>
              <p className="text-white/70 text-xs">{image.category} / {formatDateFull(image.uploadDate)}</p>
            </div>
          </div>
        ))}
        {filteredImages.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">이미지가 없습니다. 업로드해보세요!</div>
        )}
      </div>

      {viewingImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-medium">{viewingImage.name}</h3>
                <p className="text-white/50 text-sm">{viewingImage.category} / {formatDateFull(viewingImage.uploadDate)}</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={viewingImage.category}
                  onChange={e => handleCategoryChange(viewingImage, e.target.value)}
                  className="text-sm bg-white/10 text-white border border-white/20 rounded px-2 py-1">
                  {GALLERY_CATEGORIES.filter(c => c !== '전체').map(cat => (
                    <option key={cat} value={cat} className="text-black">{cat}</option>
                  ))}
                </select>
                <button onClick={() => handleDelete(viewingImage)} className="text-sm text-red-400 hover:text-red-300">삭제</button>
                <button onClick={() => setViewingImage(null)} className="text-white/70 hover:text-white text-2xl leading-none">x</button>
              </div>
            </div>
            <div className="overflow-auto rounded-lg">
              <img src={getImageSrc(viewingImage)} alt={viewingImage.name} className="w-full rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
