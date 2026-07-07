'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertCircle, FileText, X } from 'lucide-react';
import type { ParsedCSV } from '@/types';
import { clsx } from 'clsx';

interface PreviewStepProps {
  data: ParsedCSV;
  onClear: () => void;
}

export function PreviewStep({ data, onClear }: PreviewStepProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  if (data.totalRows === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl dark:bg-white/5 bg-slate-100">
          <AlertCircle className="h-7 w-7 text-amber-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold dark:text-white/80 text-slate-700">No data rows found</p>
          <p className="mt-1 text-xs dark:text-white/40 text-slate-500">
            The file has headers but no data. Please upload a CSV with at least one data row.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      {/* File Info Box */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-brand-500/20 bg-brand-50/50 dark:bg-brand-500/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div className="absolute text-[8px] font-bold text-emerald-700 dark:text-emerald-300 mt-4 bg-emerald-100 dark:bg-surface-900 px-1 rounded-sm">CSV</div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[300px]">
              {data.filename}
            </p>
            <p className="text-xs text-slate-500 dark:text-white/50">
              {data.fileSize ? `${(data.fileSize / 1024).toFixed(2)} KB` : ''}
            </p>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          {data.warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Table container */}
      <div className="rounded-xl border dark:border-white/10 border-slate-200 overflow-hidden">
        {/* Sticky header */}
        <div className="overflow-x-auto">
          <table className="data-table" style={{ tableLayout: 'fixed', minWidth: `${data.headers.length * 160}px` }}>
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                {data.headers.map((h) => (
                  <th key={h} style={{ width: 160, maxWidth: 160 }}>
                    <div className="truncate" title={h}>{h}</div>
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Virtualized body */}
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ maxHeight: 400 }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = data.rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="overflow-x-auto">
                    <table className="data-table" style={{ tableLayout: 'fixed', minWidth: `${data.headers.length * 160 + 48}px` }}>
                      <tbody>
                        <tr>
                          <td className="w-12 text-center dark:text-white/30 text-slate-400 text-xs">
                            {virtualRow.index + 1}
                          </td>
                          {data.headers.map((h) => (
                            <td key={h} style={{ width: 160, maxWidth: 160 }}>
                              <div className="truncate dark:text-white/70 text-slate-600" title={row[h] || ''}>
                                {row[h] || <span className="dark:text-white/20 text-slate-300 italic text-xs">—</span>}
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


    </div>
  );
}
