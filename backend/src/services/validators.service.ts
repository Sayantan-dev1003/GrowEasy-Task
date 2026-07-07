import {
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
  type CrmStatus,
  type DataSource,
  type RawRow,
} from '../types';

/**
 * Validates and normalizes a crm_status value.
 * Returns null if the value is not in the allowed enum.
 */
export function validateCrmStatus(value: unknown): CrmStatus | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.trim().toUpperCase() as CrmStatus;
  return (CRM_STATUS_VALUES as readonly string[]).includes(normalized) ? normalized : null;
}

/**
 * Validates and normalizes a data_source value.
 * Returns null if the value is not in the allowed enum.
 */
export function validateDataSource(value: unknown): DataSource | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const normalized = value.trim().toLowerCase() as DataSource;
  return (DATA_SOURCE_VALUES as readonly string[]).includes(normalized) ? normalized : null;
}

/**
 * Determines whether a row should be skipped.
 * A row is skipped if it has neither an email nor a mobile number.
 */
export function shouldSkipRow(email: string | null | undefined, mobile: string | null | undefined): boolean {
  const hasEmail = typeof email === 'string' && email.trim().length > 0;
  const hasMobile = typeof mobile === 'string' && mobile.trim().length > 0;
  return !hasEmail && !hasMobile;
}

/**
 * Parses a combined phone number string into country_code and local number.
 * Examples:
 *   "+91 9876543210" → { countryCode: "+91", mobile: "9876543210" }
 *   "0091-9876543210" → { countryCode: "+91", mobile: "9876543210" }
 *   "9876543210"      → { countryCode: null,  mobile: "9876543210" }
 */
export function parsePhoneNumber(phone: string): { countryCode: string | null; mobile: string } {
  if (!phone || !phone.trim()) return { countryCode: null, mobile: '' };

  const raw = phone.trim();

  // Pattern 1: starts with + — find the + prefix and the first separator (space, dash, dot)
  // e.g. "+91 9876543210", "+91-9876543210", "+1-800-555-1234"
  const plusSepMatch = raw.match(/^(\+\d{1,3})[\s\-.](.+)$/);
  if (plusSepMatch) {
    const countryCode = plusSepMatch[1];
    const mobile = plusSepMatch[2].replace(/[\s\-.()\+]/g, '').replace(/\D/g, '');
    return { countryCode, mobile };
  }

  // Pattern 2: starts with + but no separator — ambiguous, try common country code lengths
  const plusNoSepMatch = raw.match(/^(\+\d{1,3})(\d{7,12})$/);
  if (plusNoSepMatch) {
    const countryCode = plusNoSepMatch[1];
    const mobile = plusNoSepMatch[2];
    return { countryCode, mobile };
  }

  // Pattern 3: starts with 00 — international dialing prefix
  const cleanedForZero = raw.replace(/[\s\-]/g, '');
  const doubleZeroSepMatch = raw.match(/^00(\d{1,3})[\s\-.](.+)$/);
  if (doubleZeroSepMatch) {
    const countryCode = `+${doubleZeroSepMatch[1]}`;
    const mobile = doubleZeroSepMatch[2].replace(/[\s\-.()\+]/g, '').replace(/\D/g, '');
    return { countryCode, mobile };
  }

  const doubleZeroMatch = cleanedForZero.match(/^00(\d{1,3})(\d{7,12})$/);
  if (doubleZeroMatch) {
    return { countryCode: `+${doubleZeroMatch[1]}`, mobile: doubleZeroMatch[2] };
  }

  // Pattern 4: No country code identifiable — return the full number as mobile
  const digitsOnly = raw.replace(/\D/g, '');
  return { countryCode: null, mobile: digitsOnly };
}


/**
 * Normalizes a date string to ISO 8601, parseable by new Date().
 * Returns the original string if it cannot be normalized.
 */
export function normalizeDateString(dateStr: string | null | undefined): string | null {
  if (!dateStr || !dateStr.trim()) return null;

  // Already ISO-ish
  const attempt = new Date(dateStr);
  if (!isNaN(attempt.getTime())) {
    return attempt.toISOString();
  }

  // Try common Indian date formats: DD/MM/YYYY, DD-MM-YYYY
  const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const attempt2 = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(attempt2.getTime())) {
      return attempt2.toISOString();
    }
  }

  return dateStr; // Return as-is if we can't parse it
}

/**
 * Checks if a raw row has any meaningful content (not just empty cells).
 */
export function hasContent(row: RawRow): boolean {
  return Object.values(row).some((v) => v && v.trim() !== '');
}
