import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  type AIExtractedRow,
  type BatchResult,
  type CRMRecord,
  type RawRow,
  type SkippedRow,
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
} from '../types';
import { validateCrmStatus, validateDataSource, normalizeDateString, shouldSkipRow } from './validators.service';

const SYSTEM_PROMPT = `You are a data-mapping engine for a CRM system called GrowEasy. Your ONLY job is to receive raw CSV row objects with arbitrary, inconsistent, or messy column names and map each row's data onto a fixed CRM schema.

You must return ONLY a valid JSON array — no markdown fences, no prose, no explanation, no comments. The entire response must be parseable by JSON.parse().

## TARGET CRM SCHEMA

Each row must produce exactly one JSON object with these fields (use null for any field that cannot be confidently mapped):

{
  "created_at": string | null,              // Date/time of lead creation — ISO 8601 format ONLY (e.g. "2024-05-13T14:20:00.000Z"). Convert any date format you encounter to ISO 8601. If unparseable, return null.
  "name": string | null,                    // Full name of the contact
  "email": string | null,                   // Primary email address only
  "country_code": string | null,            // Phone country code with + prefix (e.g. "+91", "+1"). Split from combined phone numbers.
  "mobile_without_country_code": string | null, // Phone number WITHOUT country code (digits only, e.g. "9876543210")
  "company": string | null,                 // Company or organization name
  "city": string | null,                    // City name
  "state": string | null,                   // State or province
  "country": string | null,                 // Country name
  "lead_owner": string | null,              // Person responsible for this lead
  "crm_status": string | null,              // MUST be one of: GOOD_LEAD_FOLLOW_UP | DID_NOT_CONNECT | BAD_LEAD | SALE_DONE — or null if no clear signal
  "crm_note": string | null,               // Catch-all for remarks, follow-ups, comments, extra phones/emails, unmapped-but-useful info
  "data_source": string | null,             // MUST be one of: leads_on_demand | meridian_tower | eden_park | varah_swamy | sarjapur_plots — or null if not confidently identifiable
  "possession_time": string | null,         // Property possession timeline (e.g. "Ready to move", "Dec 2025")
  "description": string | null,             // General description or notes
  "skip": boolean,                          // Set to true ONLY if the row has NEITHER an email NOR any phone number
  "skipReason": string | null               // If skip=true, explain why (e.g. "No email or mobile number found")
}

## FIELD MAPPING RULES

### Name Mapping
Map ANY of these (and similar) column names to "name":
- "Full Name", "Contact Name", "Lead Name", "Customer Name", "Client Name", "Lead", "Contact", "Person", "First Name" + "Last Name" (concatenate with space)

### Email Mapping
- Map "Email", "Email Address", "contact_email", "E-mail", "Email ID" etc. to "email"
- If multiple email columns exist: put the FIRST/primary email in "email", append all others to "crm_note" with label "Additional email: [value]"

### Phone / Mobile Mapping
- Map "Phone", "Mobile", "Phone Number", "Contact Number", "Cell", "Mobile Number", "Telephone", "WhatsApp" etc. to phone fields
- If the phone includes a country code (starts with + or 00), SPLIT it:
  - country_code: the + prefix plus digits (e.g. "+91")
  - mobile_without_country_code: remaining digits only (e.g. "9876543210")
- If multiple phone columns exist: use the FIRST for the structured fields, append all others to "crm_note" with label "Additional phone: [value]"

### Location Mapping
- If a single "Location" or "Address" column exists containing city/state/country, decompose it:
  - Try to extract city, state, and country separately
  - Put any unparseable location info into "crm_note"
- Map "City", "Town" → city
- Map "State", "Province", "Region" → state
- Map "Country", "Nation" → country

### Status Mapping
- Map to crm_status ONLY if confident. Allowed values ONLY:
  - GOOD_LEAD_FOLLOW_UP → for: "Interested", "Hot Lead", "Follow Up", "Callback", "Warm", "Prospect"
  - DID_NOT_CONNECT → for: "No Answer", "Not Reachable", "Busy", "Switched Off", "Not Picked", "Not Contacted"
  - BAD_LEAD → for: "Not Interested", "Wrong Number", "Junk", "Spam", "Invalid", "Duplicate"
  - SALE_DONE → for: "Sold", "Booked", "Converted", "Closed", "Deal Done"
- If unsure, return null. NEVER invent a new status value.

### Data Source Mapping
- Map to data_source ONLY if you are HIGHLY confident the source name matches one of:
  - leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots
- If the source is ambiguous, unfamiliar, or not present, return null. DO NOT GUESS.

### crm_note (Catch-All)
Append the following to crm_note (concatenated, separated by " | "):
- Any remarks, follow-up notes, comments, or general notes from the source row
- Extra emails beyond the first (prefix: "Additional email: ")
- Extra phones beyond the first (prefix: "Additional phone: ")
- Any information present in the source that doesn't fit another field but is valuable
- Escape any newline characters in notes as \\n (a literal backslash-n), not an actual line break

### Skip Rule
- If a row has NO email AND NO mobile/phone number (all phone fields are empty/null):
  - Set skip: true
  - Set skipReason: "No email or mobile number found"
- Otherwise: skip: false, skipReason: null

### Date Normalization
- Convert ANY date format to ISO 8601 (e.g. "2024-05-13T14:20:00.000Z")
- Common formats to handle: "13th May 2024", "05/13/2024", "13-05-2024", "May 13, 2024", "2024-05-13 14:20", "13/05/24"
- If time is not available, use midnight UTC: "2024-05-13T00:00:00.000Z"
- If the date cannot be parsed at all, return null

## OUTPUT FORMAT

Return EXACTLY a JSON array of objects, one per input row, in the same order as the input. Example:

[
  { "created_at": "2024-05-13T00:00:00.000Z", "name": "Rahul Sharma", "email": "rahul@example.com", "country_code": "+91", "mobile_without_country_code": "9876543210", "company": null, "city": "Bangalore", "state": "Karnataka", "country": "India", "lead_owner": "Priya", "crm_status": "GOOD_LEAD_FOLLOW_UP", "crm_note": null, "data_source": null, "possession_time": null, "description": null, "skip": false, "skipReason": null }
]

CRITICAL: Return ONLY the JSON array. No markdown. No text before or after. No \`\`\`json fences.`;

type ModelType = ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

let genAI: GoogleGenerativeAI | null = null;
let model: ModelType | null = null;

function getModel(): ModelType {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temperature for consistent, deterministic mapping
      },
      systemInstruction: SYSTEM_PROMPT,
    });
  }
  return model;
}

/**
 * Strips markdown code fences from a response string.
 */
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

/**
 * Sanitizes and parses an AI JSON response into an array of AIExtractedRow objects.
 */
function parseAIResponse(rawText: string, batchSize: number): AIExtractedRow[] {
  const cleaned = stripMarkdownFences(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Attempt to extract JSON array from response
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      throw new Error(`AI response is not valid JSON: ${cleaned.slice(0, 200)}`);
    }
    parsed = JSON.parse(arrayMatch[0]);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AI response is not a JSON array');
  }

  // Ensure we have the right number of records
  if (parsed.length !== batchSize) {
    console.warn(`AI returned ${parsed.length} records for batch of ${batchSize}`);
  }

  return parsed as AIExtractedRow[];
}

/**
 * Post-processes a single AI-extracted row to enforce enum constraints
 * and clean up any invalid values that slipped through.
 */
function postProcessRow(row: AIExtractedRow): AIExtractedRow {
  return {
    ...row,
    created_at: row.created_at ? normalizeDateString(row.created_at) : null,
    crm_status: validateCrmStatus(row.crm_status),
    data_source: validateDataSource(row.data_source),
  };
}

/**
 * Sends a single batch of raw rows to Gemini for field extraction.
 * Throws on unrecoverable error (caller handles retry).
 */
export async function extractBatch(rawRows: RawRow[]): Promise<BatchResult> {
  const m = getModel();

  const prompt = `Here are ${rawRows.length} CSV rows to map onto the CRM schema. Return a JSON array with exactly ${rawRows.length} objects.\n\nInput:\n${JSON.stringify(rawRows, null, 2)}`;

  const result = await m.generateContent(prompt);
  const responseText = result.response.text();

  const extracted = parseAIResponse(responseText, rawRows.length);

  const records: CRMRecord[] = [];
  const skipped: SkippedRow[] = [];

  extracted.forEach((row, index) => {
    const processed = postProcessRow(row);

    // Enforce skip rule server-side as a safety net
    const emailEmpty = !processed.email?.trim();
    const mobileEmpty = !processed.mobile_without_country_code?.trim();
    const aiSaysSkip = processed.skip === true;

    if (aiSaysSkip || (emailEmpty && mobileEmpty)) {
      skipped.push({
        row: rawRows[index] ?? {},
        reason: processed.skipReason || 'No email or mobile number found',
      });
    } else {
      // Strip the skip fields before adding to records
      const { skip: _skip, skipReason: _skipReason, ...crmRecord } = processed;
      records.push(crmRecord as CRMRecord);
    }
  });

  return { records, skipped };
}

/**
 * Retries a function with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;

      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`Batch attempt ${attempt} failed. Retrying in ${delay}ms...`, err);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
