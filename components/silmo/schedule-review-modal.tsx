'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Loader2, Star } from 'lucide-react';

interface ScheduleReviewModalProps {
  scheduleTitle: string;
  existingReviewUrl?: string;
  onSave: (scheduleTitle: string, file: File) => Promise<void>;
  onClose: () => void;
}

export function ScheduleReviewModal({
  scheduleTitle,
  existingReviewUrl,
  onSave,
  onClose,
}: ScheduleReviewModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') setFile(dropped);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      await onSave(scheduleTitle, file);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 font-suit">총평 등록</h2>
              <p className="text-[10px] text-neutral-500 font-suit truncate max-w-[220px]">{scheduleTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {existingReviewUrl && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-amber-400 font-semibold font-suit">기존 총평이 있습니다</p>
                <a
                  href={existingReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-neutral-400 hover:text-neutral-200 underline underline-offset-2 font-suit"
                >
                  현재 총평 보기 →
                </a>
              </div>
              <span className="text-[9px] text-neutral-600 ml-auto font-suit">덮어쓰기 가능</span>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-500/50 bg-amber-500/5'
                : file
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-neutral-700 hover:border-neutral-600 hover:bg-neutral-900/40'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="space-y-2">
                <div className="mx-auto w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-emerald-400 font-suit">{file.name}</p>
                <p className="text-[10px] text-neutral-500 font-suit">
                  {(file.size / 1024 / 1024).toFixed(2)} MB — 클릭하여 변경
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-neutral-400" />
                </div>
                <p className="text-sm font-semibold text-neutral-300 font-suit">PDF 파일을 드래그하거나 클릭</p>
                <p className="text-[10px] text-neutral-600 font-suit">총평 / 풀이 등 PDF만 지원</p>
              </div>
            )}
          </div>

          <p className="text-[10px] text-neutral-600 font-suit text-center leading-relaxed">
            최고점자만 총평을 등록할 수 있습니다. 등록된 총평은 모든 응시자가 기록 페이지에서 열람할 수 있습니다.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-5 justify-end">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors font-suit"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || isSaving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-amber-950 hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-suit"
          >
            {isSaving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />업로드 중...</>
            ) : (
              <><Star className="w-3.5 h-3.5" />총평 등록</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
