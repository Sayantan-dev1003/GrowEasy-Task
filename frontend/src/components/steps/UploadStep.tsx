'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Download, X, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { ParsedCSV } from '@/types';
import Papa from 'papaparse';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CRM_FIELDS_HINT = [
  'created_at', 'name', 'email', 'country_code',
  'mobile_without_country_code', 'company', 'city', 'state',
  'country', 'lead_owner', 'crm_status', 'crm_note',
  'data_source', 'possession_time', 'description',
];

interface UploadStepProps {
  onParsed: (data: ParsedCSV, file: File) => void;
}

export function UploadStep({ onParsed }: UploadStepProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const parseFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsParsing(true);

      // Client-side file type validation
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        setError('Only CSV files (.csv) are accepted.');
        setIsParsing(false);
        return;
      }

      // Client-side size validation
      if (file.size > MAX_FILE_SIZE) {
        setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 5 MB.`);
        setIsParsing(false);
        return;
      }

      try {
        const text = await file.text();

        Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
          complete: (results) => {
            const warnings: string[] = [];

            if (results.errors.length > 0) {
              const criticalErrors = results.errors.filter((e) => e.type === 'Delimiter');
              if (criticalErrors.length > 0) {
                setError('The CSV file appears to be malformed. Please check for unescaped commas or quotes.');
                setIsParsing(false);
                return;
              }
              warnings.push(`${results.errors.length} rows had minor parse issues and were skipped.`);
            }

            const headers = results.meta.fields ?? [];
            const rows = results.data as Record<string, string>[];

            if (headers.length === 0) {
              setError('No column headers found in the CSV file.');
              setIsParsing(false);
              return;
            }

            setSelectedFile(file);
            onParsed({
              rows,
              headers,
              totalRows: rows.length,
              warnings,
              filename: file.name,
              fileSize: file.size,
            }, file);
            setIsParsing(false);
          },
          error: (err: { message: string }) => {
            setError(`CSV parse error: ${err.message}`);
            setIsParsing(false);
          },
        });
      } catch (_err: unknown) {
        setError('Failed to read file. Please try again.');
        setIsParsing(false);
      }
    },
    [onParsed]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      if (rejectedFiles && (rejectedFiles as { errors: { message: string }[] }[]).length > 0) {
        const rejection = (rejectedFiles as { errors: { message: string }[] }[])[0];
        const msg = rejection.errors[0]?.message || 'File rejected';
        setError(msg.includes('too large') ? 'File exceeds 5MB limit.' : msg);
        return;
      }
      if (acceptedFiles[0]) {
        parseFile(acceptedFiles[0]);
      }
    },
    [parseFile]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isParsing,
  });

  const handleDownloadSample = () => {
    const link = document.createElement('a');
    link.href = '/samples/sample_groweasy.csv';
    link.download = 'sample_groweasy.csv';
    link.click();
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        id="csv-dropzone"
        className={clsx(
          'relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300',
          'dark:bg-white/5 bg-slate-50',
          isDragActive && !isDragReject && 'dropzone-active border-brand-500 dark:bg-brand-500/10',
          isDragReject && 'border-red-500 bg-red-500/5',
          !isDragActive && !isDragReject && 'dark:border-white/20 border-slate-300 hover:dark:border-brand-500/60 hover:border-brand-400',
          isParsing && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} id="csv-file-input" />

        {/* Upload icon */}
        <div className={clsx(
          'flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300',
          isDragActive ? 'bg-brand-500/20 scale-110' : 'dark:bg-white/10 bg-slate-200'
        )}>
          {isParsing ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          ) : selectedFile ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          ) : (
            <Upload className={clsx('h-8 w-8 transition-colors', isDragActive ? 'text-brand-400' : 'dark:text-white/40 text-slate-400')} />
          )}
        </div>

        {/* Text */}
        <div className="text-center">
          {isParsing ? (
            <p className="text-sm dark:text-white/70 text-slate-500">Parsing CSV...</p>
          ) : selectedFile ? (
            <>
              <p className="text-sm font-semibold dark:text-emerald-400 text-emerald-600">{selectedFile.name}</p>
              <p className="mt-1 text-xs dark:text-white/40 text-slate-500">
                {(selectedFile.size / 1024).toFixed(1)} KB — Click or drop to replace
              </p>
            </>
          ) : isDragActive ? (
            <p className="text-sm font-semibold text-brand-400">Drop it here!</p>
          ) : (
            <>
              <p className="text-sm font-semibold dark:text-white/80 text-slate-700">
                Drop your CSV file here
              </p>
              <p className="mt-1 text-xs dark:text-white/40 text-slate-500">
                or <span className="text-brand-400 font-medium">click to browse files</span>
              </p>
            </>
          )}
        </div>

        {/* File constraints */}
        <div className="flex items-center gap-2 text-xs dark:text-white/30 text-slate-400">
          <FileText className="h-3.5 w-3.5" />
          <span>CSV files only · Max 5 MB</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-red-300">{error}</div>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4 text-red-400 hover:text-red-300" />
          </button>
        </div>
      )}

      {/* Download sample */}
      <div className="flex justify-center">
        <button
          id="download-sample-csv"
          onClick={handleDownloadSample}
          className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download Sample CSV Template
        </button>
      </div>
    </div>
  );
}
