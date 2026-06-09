import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ExamType } from '@/types/silmo';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  examType: ExamType | null;
  prefilledTitle?: string;
  suggestions?: string[];
  onSave: (title: string, koreanScore: number | null, mathScore: number | null) => void;
}

export function ScoreModal({ isOpen, onClose, examType, prefilledTitle, suggestions = [], onSave }: ScoreModalProps) {
  const [titleVal, setTitleVal] = useState<string>('');
  const [koreanVal, setKoreanVal] = useState<string>('');
  const [mathVal, setMathVal] = useState<string>('');
  const [errors, setErrors] = useState<{ title?: string; korean?: string; math?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setTitleVal(prefilledTitle || '');
      setKoreanVal('');
      setMathVal('');
      setErrors({});
    }
  }, [isOpen, prefilledTitle]);

  if (!examType) return null;

  const showKorean = examType === 'korean' || examType === 'both';
  const showMath = examType === 'math' || examType === 'both';

  const validate = (): boolean => {
    const newErrors: { title?: string; korean?: string; math?: string } = {};

    if (titleVal.trim() === '') {
      newErrors.title = '실모 이름을 입력해주세요.';
    }

    if (showKorean) {
      const kNum = Number(koreanVal);
      if (koreanVal.trim() === '') {
        newErrors.korean = '국어 점수를 입력해주세요.';
      } else if (isNaN(kNum) || kNum < 0 || kNum > 100) {
        newErrors.korean = '0점부터 100점 사이의 숫자를 입력해주세요.';
      }
    }

    if (showMath) {
      const mNum = Number(mathVal);
      if (mathVal.trim() === '') {
        newErrors.math = '수학 점수를 입력해주세요.';
      } else if (isNaN(mNum) || mNum < 0 || mNum > 100) {
        newErrors.math = '0점부터 100점 사이의 숫자를 입력해주세요.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const koreanScore = showKorean ? Number(koreanVal) : null;
    const mathScore = showMath ? Number(mathVal) : null;

    onSave(titleVal.trim(), koreanScore, mathScore);
    onClose();
  };

  const getTitle = () => {
    if (examType === 'korean') return '국어 모의고사 점수 입력';
    if (examType === 'math') return '수학 모의고사 점수 입력';
    return '국어 + 수학 모의고사 점수 입력';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[400px] border-neutral-800 bg-neutral-950 text-neutral-100 rounded-xl p-6">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight font-suit">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500 font-suit">
            시험 종료 후 획득한 점수를 정확히 기입해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4 font-suit text-xs">
          {/* Exam Name Input */}
          {prefilledTitle ? (
            <div className="space-y-1 p-3 rounded-lg bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider font-suit">실모 이름</span>
              <span className="text-xs font-semibold text-neutral-200 font-suit">{prefilledTitle}</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="exam-title" className="text-xs font-medium text-neutral-300">
                실모 이름
              </label>
              <Input
                id="exam-title"
                type="text"
                list="exam-titles"
                placeholder="예: 시대인재 2회, 한수 모의고사"
                value={titleVal}
                onChange={(e) => setTitleVal(e.target.value)}
                className="bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:ring-neutral-800"
              />
              <datalist id="exam-titles">
                {suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              {errors.title && (
                <p className="text-[11px] text-red-500 font-medium">{errors.title}</p>
              )}
            </div>
          )}

          {showKorean && (
            <div className="space-y-1.5">
              <label htmlFor="korean-score" className="text-xs font-medium text-neutral-300">
                국어 점수
              </label>
              <Input
                id="korean-score"
                type="number"
                min="0"
                max="100"
                placeholder="예: 92"
                value={koreanVal}
                onChange={(e) => setKoreanVal(e.target.value)}
                className="bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:ring-neutral-800 font-mono"
              />
              {errors.korean && (
                <p className="text-[11px] text-red-500 font-medium">{errors.korean}</p>
              )}
            </div>
          )}

          {showMath && (
            <div className="space-y-1.5">
              <label htmlFor="math-score" className="text-xs font-medium text-neutral-300">
                수학 점수
              </label>
              <Input
                id="math-score"
                type="number"
                min="0"
                max="100"
                placeholder="예: 88"
                value={mathVal}
                onChange={(e) => setMathVal(e.target.value)}
                className="bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:ring-neutral-800 font-mono"
              />
              {errors.math && (
                <p className="text-[11px] text-red-500 font-medium">{errors.math}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 text-xs py-1.5"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 font-medium text-xs py-1.5"
          >
            저장하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
