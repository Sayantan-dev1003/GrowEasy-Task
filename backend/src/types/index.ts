// Shared TypeScript types for the GrowEasy CSV Importer

export type RawRow = Record<string, string>;

export const CRM_STATUS_VALUES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
] as const;

export type CrmStatus = (typeof CRM_STATUS_VALUES)[number];

export const DATA_SOURCE_VALUES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
] as const;

export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

export interface CRMRecord {
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: CrmStatus | null;
  crm_note: string | null;
  data_source: DataSource | null;
  possession_time: string | null;
  description: string | null;
}

export interface AIExtractedRow extends CRMRecord {
  skip?: boolean;
  skipReason?: string;
}

export interface SkippedRow {
  row: RawRow;
  reason: string;
}

export interface BatchResult {
  records: CRMRecord[];
  skipped: SkippedRow[];
}

export interface ImportResult {
  importId?: string;
  records: CRMRecord[];
  skipped: SkippedRow[];
  totalImported: number;
  totalSkipped: number;
}

export interface SSEProgressEvent {
  type: 'progress';
  batchIndex: number;
  totalBatches: number;
  batchRecords: CRMRecord[];
  batchSkipped: SkippedRow[];
}

export interface SSECompleteEvent {
  type: 'complete';
  totalImported: number;
  totalSkipped: number;
  importId?: string;
}

export interface SSEErrorEvent {
  type: 'error';
  message: string;
}

export type SSEEvent = SSEProgressEvent | SSECompleteEvent | SSEErrorEvent;

export interface ParseCSVResult {
  rows: RawRow[];
  headers: string[];
  totalRows: number;
  warnings: string[];
}
