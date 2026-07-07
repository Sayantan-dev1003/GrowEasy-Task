import { CSVImporter } from '@/components/CSVImporter';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { RecentImports } from '@/components/RecentImports';


export default function LeadSourcesPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900">Lead Sources</h2>
          <p className="text-sm dark:text-white/50 text-slate-500 mt-1">
            Connect, manage, and control all your lead channels from one dashboard.
          </p>
        </div>
        <div className="hidden sm:block">
          <DarkModeToggle />
        </div>
      </div>

      <div className="space-y-8">
        {/* Import Leads via CSV section */}
        <div className="border border-dashed dark:border-white/20 border-slate-300 rounded-xl p-4 md:p-6 dark:bg-surface-800/50 bg-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 rounded-full shrink-0 dark:bg-surface-700 bg-slate-200 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold dark:text-white text-slate-900">Import Leads via CSV</h3>
              <p className="text-sm dark:text-white/50 text-slate-500">
                Upload a CSV file to bulk import leads into your system.
              </p>
            </div>
          </div>
          <div className="w-full flex justify-end md:w-auto">
            <CSVImporter />
          </div>
        </div>

        <RecentImports />
      </div>
    </main>
  );
}
