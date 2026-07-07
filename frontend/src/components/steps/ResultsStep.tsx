'use client';

import { useRef, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import type { CRMRecord, SkippedRow, ImportProgress } from '@/types';
import { CRM_STATUS_LABELS, CRM_STATUS_COLORS, type CrmStatus } from '@/types';

const PAGE_SIZE = 50;

interface ResultsStepProps {
  records: CRMRecord[];
  skipped: SkippedRow[];
  progress: ImportProgress | null;
  isStreaming: boolean;
  error: string | null;
  onReset: () => void;
  onFinish?: () => void;
}

function StatusPill({ status }: { status: CrmStatus | null | undefined }) {
  if (!status || !(status in CRM_STATUS_LABELS)) {
    return <span className="text-xs dark:text-white/30 text-slate-400 italic">—</span>;
  }
  return (
    <span className={CRM_STATUS_COLORS[status]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {CRM_STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function ResultsStep({
  records,
  skipped,
  progress,
  isStreaming,
  error,
  onReset,
  onFinish,
}: ResultsStepProps) {
  const [search, setSearch] = useState('');
  const [showSkipped, setShowSkipped] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter records by search
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.mobile_without_country_code?.includes(q)
    );
  }, [records, search]);

  const visibleRecords = filteredRecords.slice(0, visibleCount);
  const hasMore = visibleCount < filteredRecords.length;

  const rowVirtualizer = useVirtualizer({
    count: visibleRecords.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  // Progress indicator
  const progressPct = progress
    ? Math.round((progress.batchIndex / progress.totalBatches) * 100)
    : records.length > 0 ? 100 : 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Progress bar (shown while streaming) */}
      {isStreaming && progress && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs dark:text-white/60 text-slate-500">
            <span className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border border-brand-500 border-t-transparent" />
              Processing batch {progress.batchIndex} of {progress.totalBatches}…
            </span>
            <span className="font-bold text-brand-400">{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full dark:bg-white/10 bg-slate-200 overflow-hidden">
            <div
              className="progress-bar-fill h-full rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Extraction failed</p>
            <p className="mt-1 text-xs dark:text-white/60 text-slate-500">{error}</p>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-xl border dark:border-emerald-500/20 border-emerald-200 dark:bg-emerald-500/10 bg-emerald-50 p-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          <div>
            <p className="text-2xl font-bold dark:text-emerald-400 text-emerald-600">
              {records.length.toLocaleString()}
            </p>
            <p className="text-xs dark:text-white/50 text-slate-500">Imported</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border dark:border-amber-500/20 border-amber-200 dark:bg-amber-500/10 bg-amber-50 p-4">
          <XCircle className="h-6 w-6 text-amber-400 shrink-0" />
          <div>
            <p className="text-2xl font-bold dark:text-amber-400 text-amber-600">
              {skipped.length.toLocaleString()}
            </p>
            <p className="text-xs dark:text-white/50 text-slate-500">Skipped</p>
          </div>
        </div>
      </div>

      {/* Records table */}
      {records.length > 0 && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 dark:text-white/30 text-slate-400" />
            <input
              id="results-search"
              type="text"
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {filteredRecords.length === 0 ? (
            <div className="py-8 text-center text-sm dark:text-white/40 text-slate-500">
              No records match your search.
            </div>
          ) : (
            <div className="rounded-xl border dark:border-white/10 border-slate-200 overflow-hidden">
              {/* Table header */}
              <div className="overflow-x-auto">
                <table className="data-table" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Date Created</th>
                      <th>Company</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Data Source</th>
                      <th>Lead Owner</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Virtualized rows */}
              <div
                ref={parentRef}
                className="overflow-auto"
                style={{ maxHeight: 480 }}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const r = visibleRecords[virtualRow.index];
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
                          <table className="data-table" style={{ minWidth: 900 }}>
                            <tbody>
                              <tr>
                                <td className="font-medium dark:text-white/90 text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400 shrink-0">
                                      {r.name ? r.name[0].toUpperCase() : '?'}
                                    </div>
                                    <span className="truncate max-w-[120px]" title={r.name || ''}>
                                      {r.name || <span className="italic dark:text-white/30 text-slate-400">—</span>}
                                    </span>
                                  </div>
                                </td>
                                <td className="dark:text-accent-400 text-accent-600 truncate max-w-[160px]" title={r.email || ''}>
                                  {r.email || '—'}
                                </td>
                                <td className="font-mono text-xs dark:text-white/70 text-slate-600">
                                  {r.country_code && r.mobile_without_country_code
                                    ? `${r.country_code} ${r.mobile_without_country_code}`
                                    : r.mobile_without_country_code || '—'}
                                </td>
                                <td className="dark:text-white/60 text-slate-500 text-xs">
                                  {formatDate(r.created_at)}
                                </td>
                                <td className="dark:text-white/70 text-slate-600 truncate max-w-[120px]">
                                  {r.company || '—'}
                                </td>
                                <td className="dark:text-white/60 text-slate-500 text-xs">
                                  {[r.city, r.state, r.country].filter(Boolean).join(', ') || '—'}
                                </td>
                                <td>
                                  <StatusPill status={r.crm_status as CrmStatus | null} />
                                </td>
                                <td className="dark:text-white/50 text-slate-500 text-xs">
                                  {r.data_source || '—'}
                                </td>
                                <td className="dark:text-white/60 text-slate-500">
                                  {r.lead_owner || '—'}
                                </td>
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
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center">
              <button
                id="load-more-btn"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="btn-secondary text-sm py-2.5 px-6"
              >
                Load more ({filteredRecords.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Skipped records accordion */}
      {skipped.length > 0 && (
        <div className="rounded-xl border dark:border-amber-500/20 border-amber-200 overflow-hidden">
          <button
            id="skipped-accordion-btn"
            onClick={() => setShowSkipped((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-sm font-semibold dark:text-amber-400 text-amber-600 dark:hover:bg-amber-500/10 hover:bg-amber-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              {skipped.length} Skipped {skipped.length === 1 ? 'Row' : 'Rows'}
            </div>
            <ChevronDown className={clsx('h-4 w-4 transition-transform', showSkipped && 'rotate-180')} />
          </button>

          {showSkipped && (
            <div className="border-t dark:border-amber-500/20 border-amber-200 divide-y dark:divide-white/5 divide-slate-100">
              {skipped.map((s, i) => (
                <div key={i} className="p-3 dark:bg-amber-500/5 bg-amber-50">
                  <p className="text-xs font-medium text-amber-400 mb-1.5">{s.reason}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(s.row).slice(0, 4).map(([k, v]) => (
                      <span key={k} className="inline-block px-2 py-0.5 rounded text-xs dark:bg-white/5 bg-white dark:text-white/50 text-slate-500">
                        <span className="font-mono dark:text-white/30 text-slate-400">{k}:</span>{' '}
                        {String(v).slice(0, 30) || '—'}
                      </span>
                    ))}
                    {Object.keys(s.row).length > 4 && (
                      <span className="text-xs dark:text-white/30 text-slate-400">+{Object.keys(s.row).length - 4} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          id="start-new-import-btn"
          onClick={onReset}
          className="btn-primary flex-1"
        >
          <RefreshCw className="h-4 w-4" />
          Start New Import
        </button>
        {records.length > 0 && (
          <button
            id="view-analytics-btn"
            className="btn-secondary flex-1"
            onClick={onFinish}
          >
            <TrendingUp className="h-4 w-4" />
            View Leads
          </button>
        )}
      </div>
    </div>
  );
}
