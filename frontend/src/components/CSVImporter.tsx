'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UploadStep } from '@/components/steps/UploadStep';
import { PreviewStep } from '@/components/steps/PreviewStep';
import type { ParsedCSV, Step } from '@/types';
import { X, Loader2 } from 'lucide-react';
import { extractLeads } from '@/lib/api';

export function CSVImporter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  const handleParsed = useCallback((data: ParsedCSV, file: File) => {
    setParsedCSV(data);
    setSelectedFile(file);
    setStep('preview');
  }, []);

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setProgressPct(0);

    try {
      await extractLeads(selectedFile, (event) => {
        if (event.type === 'progress') {
          const pct = Math.round((event.batchIndex / event.totalBatches) * 100);
          setProgressPct(pct);
        } else if (event.type === 'error') {
          alert(`Extraction error: ${event.message}`);
          setIsUploading(false);
        } else if (event.type === 'complete') {
          // Navigate to manage leads after successful upload
          setIsOpen(false);
          setProgressPct(100);
          
          if (event.importId) {
            router.push(`/manage-leads?importId=${event.importId}`);
          } else {
            router.push('/manage-leads');
          }
          
          // Reset state after slight delay
          setTimeout(() => {
            setStep('upload');
            setParsedCSV(null);
            setSelectedFile(null);
            setIsUploading(false);
            setProgressPct(0);
          }, 500);
        }
      });
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep('upload');
    setParsedCSV(null);
    setSelectedFile(null);
    setIsUploading(false);
    setProgressPct(0);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Import Leads
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border dark:border-white/10 border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 md:p-6 border-b dark:border-white/10 border-slate-200 shrink-0">
              <div>
                <h2 className="text-xl font-bold dark:text-white text-slate-900">Import Leads via CSV</h2>
                <p className="text-sm dark:text-white/50 text-slate-500 mt-1">Upload a CSV file to bulk import leads into your system.</p>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 dark:text-slate-400 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 overflow-y-auto">
              {step === 'upload' && <UploadStep onParsed={handleParsed} />}
              
              {step === 'preview' && parsedCSV && (
                <div className="space-y-4">
                  <PreviewStep data={parsedCSV} onClear={() => { setStep('upload'); setParsedCSV(null); setSelectedFile(null); }} />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3 sm:gap-4 p-4 md:p-6 border-t dark:border-white/10 border-slate-200 shrink-0">
              <button
                onClick={handleClose}
                disabled={isUploading}
                className="flex-1 py-2.5 rounded-lg border dark:border-white/10 border-slate-200 font-semibold dark:text-white text-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadFile}
                disabled={step === 'upload' || !parsedCSV || isUploading}
                className={`relative flex-1 overflow-hidden py-2.5 px-4 rounded-lg bg-orange-500 text-white font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 ${
                  (step === 'upload' || !parsedCSV) && !isUploading
                    ? 'opacity-50 cursor-not-allowed'
                    : isUploading
                    ? 'cursor-wait'
                    : 'hover:bg-orange-600'
                }`}
              >
                {/* Progress bar background */}
                {isUploading && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-orange-700 transition-all duration-300 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                )}
                
                {/* Button Content */}
                <span className="relative z-10 flex items-center w-full">
                  {isUploading ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="w-10 text-left">{progressPct}%</span>
                      </div>
                      <span className="flex-1 text-center -ml-16">Uploading...</span>
                    </>
                  ) : (
                    <span className="flex-1 text-center">Upload File</span>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
