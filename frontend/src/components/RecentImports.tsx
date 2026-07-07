'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Database, ArrowRight } from 'lucide-react';

interface ImportJob {
  id: string;
  filename: string;
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
  createdAt: string;
}

export function RecentImports() {
  const router = useRouter();
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImports = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/imports');
        if (res.ok) {
          const data = await res.json();
          setImports(data.imports || []);
        }
      } catch (error) {
        console.error('Failed to fetch imports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImports();
  }, []);

  if (isLoading) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold dark:text-white text-slate-900 mb-4">Recent Imports</h3>
        <div className="text-slate-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (imports.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold dark:text-white text-slate-900 mb-4">Recent Imports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {imports.map((job) => (
          <div
            key={job.id}
            onClick={() => router.push(`/manage-leads?importId=${job.id}`)}
            className="cursor-pointer border dark:border-white/10 border-slate-200 rounded-xl p-5 dark:bg-surface-800 bg-white hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all hover:shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
              <h4 className="font-semibold text-sm dark:text-white text-slate-900 truncate mb-1" title={job.filename}>
                {job.filename}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {job.totalRows} rows processed
              </p>
            </div>
            
            <div className="flex items-center justify-between border-t dark:border-white/10 border-slate-100 pt-3">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {job.totalImported} leads imported
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
