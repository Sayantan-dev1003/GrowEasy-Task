// Shared types for the GrowEasy frontend

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

export interface SkippedRow {
  row: RawRow;
  reason: string;
}

export interface ParsedCSV {
  rows: RawRow[];
  headers: string[];
  totalRows: number;
  warnings: string[];
  filename: string;
  fileSize?: number;
}

export interface ImportProgress {
  batchIndex: number;
  totalBatches: number;
  records: CRMRecord[];
  skipped: SkippedRow[];
}

export interface ImportResult {
  records: CRMRecord[];
  skipped: SkippedRow[];
  totalImported: number;
  totalSkipped: number;
  importId?: string;
}

export type Step = 'upload' | 'preview' | 'confirm' | 'results';

export const CRM_STATUS_LABELS: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: 'Good Lead',
  DID_NOT_CONNECT: 'Not Dialed',
  BAD_LEAD: 'Bad Lead',
  SALE_DONE: 'Sale Done',
};

export const CRM_STATUS_COLORS: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: 'pill-good-lead',
  DID_NOT_CONNECT: 'pill-did-not-connect',
  BAD_LEAD: 'pill-bad-lead',
  SALE_DONE: 'pill-sale-done',
};

export const CRM_FIELDS = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
] as const;

export type CRMField = (typeof CRM_FIELDS)[number];
