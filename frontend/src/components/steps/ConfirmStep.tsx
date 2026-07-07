'use client';

import { FileText, Rows3, Columns3, Sparkles, AlertTriangle } from 'lucide-react';
import type { ParsedCSV } from '@/types';

interface ConfirmStepProps {
  data: ParsedCSV;
  onConfirm: () => void;
  isLoading: boolean;
}

export function ConfirmStep({ data, onConfirm, isLoading }: ConfirmStepProps) {
  const estimatedBatches = Math.ceil(data.totalRows / 20);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary card */}
      <div className="rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-white/5 bg-slate-50 p-6">
        <h3 className="text-sm font-semibold dark:text-white/80 text-slate-700 mb-4">Import Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl dark:bg-white/5 bg-white border dark:border-white/10 border-slate-200">
            <FileText className="h-5 w-5 dark:text-brand-400 text-brand-600" />
            <div className="text-center">
              <p className="text-xs dark:text-white/40 text-slate-500">File</p>
              <p className="text-xs font-semibold dark:text-white/80 text-slate-700 truncate max-w-[80px]" title={data.filename}>
                {data.filename}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl dark:bg-white/5 bg-white border dark:border-white/10 border-slate-200">
            <Rows3 className="h-5 w-5 text-emerald-400" />
            <div className="text-center">
              <p className="text-xs dark:text-white/40 text-slate-500">Rows</p>
              <p className="text-lg font-bold dark:text-emerald-400 text-emerald-600">{data.totalRows.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl dark:bg-white/5 bg-white border dark:border-white/10 border-slate-200">
            <Columns3 className="h-5 w-5 text-accent-400" />
            <div className="text-center">
              <p className="text-xs dark:text-white/40 text-slate-500">Columns</p>
              <p className="text-lg font-bold text-accent-400">{data.headers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="rounded-2xl border dark:border-brand-500/20 border-brand-200 dark:bg-brand-500/5 bg-brand-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <h3 className="text-sm font-semibold dark:text-brand-300 text-brand-700">What happens when you confirm</h3>
        </div>
        <ul className="space-y-2 text-xs dark:text-white/60 text-slate-600">
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-[10px] font-bold">1</span>
            Your CSV is sent to our backend for processing
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-[10px] font-bold">2</span>
            Rows are split into ~{estimatedBatches} batch{estimatedBatches !== 1 ? 'es' : ''} of 20 and sent to Gemini AI
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-[10px] font-bold">3</span>
            AI maps columns to CRM fields using semantic understanding
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-[10px] font-bold">4</span>
            Results stream back as each batch completes
          </li>
        </ul>
      </div>

      {/* Warning for large files */}
      {data.totalRows > 200 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs dark:text-white/60 text-slate-600">
            Large file detected ({data.totalRows.toLocaleString()} rows). Processing may take a few minutes.
            Results will appear progressively as batches complete.
          </p>
        </div>
      )}

      {/* Confirm button */}
      <button
        id="confirm-import-btn"
        onClick={onConfirm}
        disabled={isLoading || data.totalRows === 0}
        className="btn-primary w-full py-4 text-base"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Starting AI extraction...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Confirm Import — Let AI Do the Magic
          </>
        )}
      </button>
    </div>
  );
}
