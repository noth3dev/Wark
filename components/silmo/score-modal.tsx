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
import { Calculator } from 'lucide-react';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  examType: ExamType | null;
  prefilledTitle?: string;
  suggestions?: string[];
  onSave: (title: string, koreanScore: number | null, mathScore: number | null, koreanWrongNumbers?: string | null, mathWrongNumbers?: string | null) => void;
}

// 수학 점수 차감 로직
const getMathQuestionScore = (num: number): number => {
  if (num >= 1 && num <= 2) return 2;
  if (num >= 3 && num <= 8) return 3;
  if (num >= 9 && num <= 15) return 4;
  if (num >= 16 && num <= 19) return 3;
  if (num >= 20 && num <= 22) return 4;
  if (num === 23) return 2;
  if (num >= 24 && num <= 27) return 3;
  if (num === 28) return 4;
  if (num >= 29 && num <= 30) return 4;
  return 0; // 유효하지 않은 번호
};

export function ScoreModal({ isOpen, onClose, examType, prefilledTitle, suggestions = [], onSave }: ScoreModalProps) {
  const [titleVal, setTitleVal] = useState<string>('');
  
  // 국어 입력
  const [koreanScoreVal, setKoreanScoreVal] = useState<string>('');
  const [koreanWrongVal, setKoreanWrongVal] = useState<string>('');
  
  // 수학 입력 (오답 번호)
  const [mathWrongVal, setMathWrongVal] = useState<string>('');
  
  const [errors, setErrors] = useState<{ title?: string; korean?: string; math?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setTitleVal(prefilledTitle || '');
      setKoreanScoreVal('');
      setKoreanWrongVal('');
      setMathWrongVal('');
      setErrors({});
    }
  }, [isOpen, prefilledTitle]);

  if (!examType) return null;

  const showKorean = examType === 'korean' || examType === 'both' || examType === 'explore';
  const showMath = examType === 'math' || examType === 'both';
  const isExplore = examType === 'explore';

  // 수학 계산 파생 상태
  const mathWrongNumbers = Array.from(new Set(
    mathWrongVal.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n >= 1 && n <= 30)
  ));
  const mathDeduction = mathWrongNumbers.reduce((sum, n) => sum + getMathQuestionScore(n), 0);
  const mathCalculatedScore = Math.max(0, 100 - mathDeduction);

  const validate = (): boolean => {
    const newErrors: { title?: string; korean?: string; math?: string } = {};

    if (titleVal.trim() === '') {
      newErrors.title = '실모 이름을 입력해주세요.';
    }

    if (showKorean) {
      const kNum = Number(koreanScoreVal);
      const maxLimit = isExplore ? 50 : 100;
      if (koreanScoreVal.trim() === '') {
        newErrors.korean = isExplore ? '탐구 점수를 입력해주세요.' : '국어 점수를 입력해주세요.';
      } else if (isNaN(kNum) || kNum < 0 || kNum > maxLimit) {
        newErrors.korean = `0점부터 ${maxLimit}점 사이의 숫자를 입력해주세요.`;
      }
    }

    // 수학은 오답 번호로 계산하므로 범위 초과 번호 정도만 경고 (필수 입력은 아님, 다 맞으면 빈칸)
    if (showMath) {
      const invalidNumbers = mathWrongVal.split(',').map(n => n.trim()).filter(n => {
        if (n === '') return false;
        const num = parseInt(n, 10);
        return isNaN(num) || num < 1 || num > 30;
      });
      if (invalidNumbers.length > 0) {
        newErrors.math = `유효하지 않은 번호가 포함되어 있습니다: ${invalidNumbers.join(', ')}`;
      } else {
        const rawNums = mathWrongVal.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
        const uniqueNums = new Set(rawNums);
        if (rawNums.length !== uniqueNums.size) {
          const seen = new Set<number>();
          const dupes = rawNums.filter(n => seen.has(n) || !seen.add(n));
          newErrors.math = `중복된 번호가 있습니다: ${Array.from(new Set(dupes)).join(', ')}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const finalKoreanScore = showKorean ? Number(koreanScoreVal) : null;
    const finalMathScore = showMath ? mathCalculatedScore : null;
    
    // 정규화 (빈 문자열이면 null로 처리)
    const finalKoreanWrong = koreanWrongVal.trim() === '' ? null : koreanWrongVal.trim();
    const finalMathWrong = mathWrongVal.trim() === '' ? null : mathWrongNumbers.sort((a,b)=>a-b).join(', ');

    onSave(titleVal.trim(), finalKoreanScore, finalMathScore, finalKoreanWrong, finalMathWrong);
    onClose();
  };

  const getTitle = () => {
    if (examType === 'korean') return '국어 모의고사 점수 기록';
    if (examType === 'math') return '수학 모의고사 점수 기록';
    if (examType === 'explore') return '탐구 모의고사 점수 기록';
    return '국어 + 수학 모의고사 점수 기록';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[400px] border-neutral-800 bg-neutral-950 text-neutral-100 rounded-xl p-6">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-semibold tracking-tight font-suit">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-neutral-500 font-suit">
            시험 종료 후 획득한 점수와 오답 문항을 정확히 기입해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4 font-suit text-xs">
          {/* Exam Name Input */}
          {prefilledTitle ? (
            <div className="space-y-1 p-3 rounded-lg bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 block uppercase font-bold tracking-wider font-suit">실모 이름</span>
              <span className="text-sm font-semibold text-neutral-200 font-suit">{prefilledTitle}</span>
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
            <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/50 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isExplore ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                <h4 className="font-semibold text-neutral-200">{isExplore ? '탐구 입력' : '국어 입력'}</h4>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-neutral-400 font-medium">점수 직접 입력 (필수)</label>
                <Input
                  type="number"
                  min="0"
                  max={isExplore ? "50" : "100"}
                  placeholder={isExplore ? "예: 47" : "예: 92"}
                  value={koreanScoreVal}
                  onChange={(e) => setKoreanScoreVal(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 font-mono text-sm h-9"
                />
                {errors.korean && <p className="text-[11px] text-red-500 font-medium">{errors.korean}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-neutral-400 font-medium">틀린 문항 번호 (선택)</label>
                <Input
                  type="text"
                  placeholder="예: 14, 25, 34"
                  value={koreanWrongVal}
                  onChange={(e) => setKoreanWrongVal(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 font-mono text-xs h-9"
                />
              </div>
            </div>
          )}

          {showMath && (
            <div className="p-3 rounded-lg border border-neutral-800 bg-neutral-900/50 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  <h4 className="font-semibold text-neutral-200">수학 오답 입력</h4>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-300">
                  <Calculator className="w-3 h-3 text-neutral-500" />
                  <span className="font-mono font-bold text-sm">{mathCalculatedScore}점</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-neutral-400 font-medium">틀린 문항 번호 (쉼표로 구분)</label>
                <Input
                  type="text"
                  placeholder="예: 15, 22, 28"
                  value={mathWrongVal}
                  onChange={(e) => setMathWrongVal(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 focus:border-rose-500/50 focus:ring-rose-500/20 font-mono text-sm h-10"
                />
                {errors.math && <p className="text-[11px] text-red-500 font-medium">{errors.math}</p>}
                <p className="text-[9px] text-neutral-500 mt-1 leading-relaxed">
                  ※ 입력한 오답 번호에 따라 수능 배점표를 기준으로 점수가 100점에서 자동 차감됩니다. 만점인 경우 비워두세요.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 text-xs py-1.5 h-9"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 font-medium text-xs py-1.5 h-9"
          >
            기록 저장하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
