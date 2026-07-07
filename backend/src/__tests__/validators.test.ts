import {
  validateCrmStatus,
  validateDataSource,
  shouldSkipRow,
  parsePhoneNumber,
  normalizeDateString,
} from '../services/validators.service';

describe('validateCrmStatus', () => {
  it('accepts all valid enum values', () => {
    expect(validateCrmStatus('GOOD_LEAD_FOLLOW_UP')).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(validateCrmStatus('DID_NOT_CONNECT')).toBe('DID_NOT_CONNECT');
    expect(validateCrmStatus('BAD_LEAD')).toBe('BAD_LEAD');
    expect(validateCrmStatus('SALE_DONE')).toBe('SALE_DONE');
  });

  it('is case-insensitive', () => {
    expect(validateCrmStatus('good_lead_follow_up')).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(validateCrmStatus('bad_lead')).toBe('BAD_LEAD');
  });

  it('returns null for invalid values', () => {
    expect(validateCrmStatus('HOT_LEAD')).toBeNull();
    expect(validateCrmStatus('INTERESTED')).toBeNull();
    expect(validateCrmStatus('')).toBeNull();
    expect(validateCrmStatus(null)).toBeNull();
    expect(validateCrmStatus(undefined)).toBeNull();
  });
});

describe('validateDataSource', () => {
  it('accepts all valid enum values', () => {
    expect(validateDataSource('leads_on_demand')).toBe('leads_on_demand');
    expect(validateDataSource('meridian_tower')).toBe('meridian_tower');
    expect(validateDataSource('eden_park')).toBe('eden_park');
    expect(validateDataSource('varah_swamy')).toBe('varah_swamy');
    expect(validateDataSource('sarjapur_plots')).toBe('sarjapur_plots');
  });

  it('is case-insensitive', () => {
    expect(validateDataSource('Eden_Park')).toBe('eden_park');
    expect(validateDataSource('LEADS_ON_DEMAND')).toBe('leads_on_demand');
  });

  it('returns null for unknown or ambiguous sources', () => {
    expect(validateDataSource('facebook')).toBeNull();
    expect(validateDataSource('google ads')).toBeNull();
    expect(validateDataSource('')).toBeNull();
  });
});

describe('shouldSkipRow', () => {
  it('skips when both email and mobile are absent', () => {
    expect(shouldSkipRow(null, null)).toBe(true);
    expect(shouldSkipRow('', '')).toBe(true);
    expect(shouldSkipRow(undefined, undefined)).toBe(true);
    expect(shouldSkipRow('  ', '  ')).toBe(true);
  });

  it('does not skip when email is present', () => {
    expect(shouldSkipRow('john@example.com', null)).toBe(false);
  });

  it('does not skip when mobile is present', () => {
    expect(shouldSkipRow(null, '9876543210')).toBe(false);
  });

  it('does not skip when both are present', () => {
    expect(shouldSkipRow('john@example.com', '9876543210')).toBe(false);
  });
});

describe('parsePhoneNumber', () => {
  it('splits an international phone with + prefix', () => {
    const result = parsePhoneNumber('+91 9876543210');
    expect(result.countryCode).toBe('+91');
    expect(result.mobile).toBe('9876543210');
  });

  it('splits a phone with 00 prefix', () => {
    const result = parsePhoneNumber('0091 9876543210');
    expect(result.countryCode).toBe('+91');
    expect(result.mobile).toBe('9876543210');
  });

  it('handles local-only numbers without country code', () => {
    const result = parsePhoneNumber('9876543210');
    expect(result.countryCode).toBeNull();
    expect(result.mobile).toBe('9876543210');
  });

  it('strips spaces and dashes from numbers', () => {
    const result = parsePhoneNumber('+1-800-555-1234');
    expect(result.countryCode).toBe('+1');
    expect(result.mobile).toBe('8005551234');
  });

  it('handles empty input', () => {
    const result = parsePhoneNumber('');
    expect(result.countryCode).toBeNull();
    expect(result.mobile).toBe('');
  });
});

describe('normalizeDateString', () => {
  it('normalizes ISO date strings', () => {
    const result = normalizeDateString('2024-05-13');
    expect(result).toMatch(/2024-05-13/);
  });

  it('normalizes DD/MM/YYYY format', () => {
    const result = normalizeDateString('13/05/2024');
    expect(result).toMatch(/2024-05-13/);
  });

  it('normalizes DD-MM-YYYY format', () => {
    const result = normalizeDateString('13-05-2024');
    expect(result).toMatch(/2024-05-13/);
  });

  it('returns null for null input', () => {
    expect(normalizeDateString(null)).toBeNull();
    expect(normalizeDateString('')).toBeNull();
  });

  it('returns string as-is for unparseable dates', () => {
    const result = normalizeDateString('not-a-date');
    expect(result).toBe('not-a-date');
  });
});
