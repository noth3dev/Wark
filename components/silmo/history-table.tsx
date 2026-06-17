import React, { useState } from 'react';
import { ExamRecord } from '@/types/silmo';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface HistoryTableProps {
  records: ExamRecord[];
}

type SortField = 'date' | 'type' | 'title' | 'korean' | 'math' | 'total';
type SortOrder = 'asc' | 'desc';

export function HistoryTable({ records }: HistoryTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc'); // default to descending
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-neutral-600 transition-colors group-hover:text-neutral-400" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-neutral-200" />
      : <ArrowDown className="w-3 h-3 text-neutral-200" />;
  };

  // Format creation date
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${date} ${hours}:${minutes}`;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'korean': return '국어';
      case 'math': return '수학';
      case 'both': return '국어 + 수학';
      default: return type;
    }
  };

  // Sort logic
  const sortedRecords = [...records].sort((a: any, b: any) => {
    let aVal: any = 0;
    let bVal: any = 0;

    switch (sortField) {
      case 'date':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      case 'type':
        aVal = a.type;
        bVal = b.type;
        break;
      case 'title':
        aVal = a.title || '';
        bVal = b.title || '';
        break;
      case 'korean':
        aVal = a.koreanScore ?? -1;
        bVal = b.koreanScore ?? -1;
        break;
      case 'math':
        aVal = a.mathScore ?? -1;
        bVal = b.mathScore ?? -1;
        break;
      case 'total':
        aVal = a.totalScore;
        bVal = b.totalScore;
        break;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="border border-neutral-800 bg-neutral-950/50 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/30 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold font-suit select-none">
              <th 
                className="py-3.5 px-4 cursor-pointer group hover:text-neutral-300 transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center gap-1">
                  날짜 {getSortIcon('date')}
                </div>
              </th>
              <th 
                className="py-3.5 px-4 cursor-pointer group hover:text-neutral-300 transition-colors"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-1">
                  유형 {getSortIcon('type')}
                </div>
              </th>
              <th 
                className="py-3.5 px-4 cursor-pointer group hover:text-neutral-300 transition-colors"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  시험명 {getSortIcon('title')}
                </div>
              </th>
              <th 
                className="py-3.5 px-4 text-right cursor-pointer group hover:text-neutral-300 transition-colors"
                onClick={() => handleSort('korean')}
              >
                <div className="flex items-center justify-end gap-1">
                  국어 {getSortIcon('korean')}
                </div>
              </th>
              <th 
                className="py-3.5 px-4 text-right cursor-pointer group hover:text-neutral-300 transition-colors"
                onClick={() => handleSort('math')}
              >
                <div className="flex items-center justify-end gap-1">
                  수학 {getSortIcon('math')}
                </div>
              </th>
              <th 
                className="py-3.5 px-4 text-left cursor-pointer group hover:text-neutral-300 transition-colors"
              >
                <div className="flex items-center gap-1">
                  오답 문항
                </div>
              </th>
              <th 
                className="py-3.5 px-4 text-right cursor-pointer group hover:text-neutral-300 transition-colors pr-6"
                onClick={() => handleSort('total')}
              >
                <div className="flex items-center justify-end gap-1">
                  총점 {getSortIcon('total')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900 text-xs font-suit font-medium text-neutral-300">
            {sortedRecords.map((record: any) => (
              <tr key={record.id} className="hover:bg-neutral-900/30 transition-colors duration-150">
                <td className="py-3.5 px-4 text-neutral-400 font-mono tabular-nums">
                  {formatDate(record.createdAt)}
                </td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    record.type === 'korean' 
                      ? 'bg-neutral-900 text-neutral-300 border-neutral-800'
                      : record.type === 'math'
                        ? 'bg-neutral-900 text-neutral-300 border-neutral-800'
                        : 'bg-neutral-900 text-neutral-200 border-neutral-700'
                  }`}>
                    {getTypeLabel(record.type)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-neutral-200 font-medium max-w-[150px]" title={record.title}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{record.title}</span>
                    {record.isPostTake && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-800 text-neutral-500 border border-neutral-700/60 shrink-0">
                        사후
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-neutral-300 tabular-nums">
                  {record.koreanScore !== null ? `${record.koreanScore}점` : '-'}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-neutral-300 tabular-nums">
                  {record.mathScore !== null ? `${record.mathScore}점` : '-'}
                </td>
                <td className="py-3.5 px-4 text-left text-[10px] text-neutral-500 font-mono">
                  {record.koreanWrongNumbers && <span className="block text-blue-400">국: {record.koreanWrongNumbers}</span>}
                  {record.mathWrongNumbers && <span className="block text-rose-400">수: {record.mathWrongNumbers}</span>}
                  {!record.koreanWrongNumbers && !record.mathWrongNumbers && '-'}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-100 tabular-nums pr-6">
                  {record.totalScore}점
                </td>
              </tr>
            ))}

            {records.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-neutral-600 font-suit font-medium">
                  아직 응시 기록이 없습니다. 위의 타이머로 모의고사를 보고 기록을 생성해보세요!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
