/**
 * Input sanitization utilities for user-provided context.
 * Provides multi-layered defense against prompt injection attacks.
 */

/**
 * Result of sanitization with flagging information
 */
export interface SanitizationResult {
  sanitized: string;
  flagged: boolean;
  flags: string[];
}

/**
 * Patterns that indicate potential prompt injection attempts.
 * These are logged for monitoring but don't block requests.
 */
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(previous|all|earlier)\s+(instructions|rules|prompts)/i,
  /you\s+are\s+now\s+(?:a|an)\s+\w+/i,
  /forget\s+(everything|all|previous)/i,
  /system\s*:\s*override/i,
  /new\s+(instructions|rules|prompt)/i,
  /disregard\s+(previous|all|earlier)/i,
  /instead\s+of\s+analyzing/i,
  /don't\s+(analyze|detect|identify)/i,
  /pretend\s+(you|to)\s+(?:are|be)/i,
  /act\s+as\s+(?:a|an)\s+\w+/i,
  /roleplay\s+as/i,
  /you\s+must\s+now/i,
  /new\s+role/i,
  /override\s+your/i,
];

/**
 * Maximum allowed length for user context input
 */
const MAX_CONTEXT_LENGTH = 500;

/**
 * Sanitizes user-provided context and detects potential prompt injection.
 *
 * @param input - Raw user context string (may be undefined)
 * @returns Sanitization result with cleaned text and flagging info
 *
 * Security layers:
 * 1. Normalize whitespace to prevent obfuscation
 * 2. Remove control characters (except newlines/tabs)
 * 3. Check for suspicious patterns
 * 4. Enforce length limit
 */
export function sanitizeUserContext(input: string | undefined): SanitizationResult {
  // Handle empty/undefined input
  if (!input || typeof input !== 'string') {
    return {
      sanitized: '',
      flagged: false,
      flags: [],
    };
  }

  const flags: string[] = [];

  // Step 1: Normalize whitespace (collapse multiple spaces, normalize line breaks)
  let sanitized = input
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')      // Convert tabs to spaces
    .replace(/ +/g, ' ')      // Collapse multiple spaces
    .trim();

  // Step 2: Remove control characters (keep newlines)
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Step 3: Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      flags.push(`Pattern match: ${pattern.source}`);
    }
  }

  // Step 4: Enforce length limit
  if (sanitized.length > MAX_CONTEXT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_CONTEXT_LENGTH);
    flags.push(`Truncated from ${input.length} to ${MAX_CONTEXT_LENGTH} characters`);
  }

  return {
    sanitized,
    flagged: flags.length > 0,
    flags,
  };
}

/**
 * Wraps user context in XML-style spotlight tags.
 * This signals to the AI that the content is untrusted user input.
 *
 * @param context - Sanitized user context
 * @returns XML-wrapped context or empty string
 *
 * Example output: <user_context>grilled chicken</user_context>
 */
export function spotlightUserContext(context: string): string {
  if (!context || context.trim().length === 0) {
    return '';
  }

  return `<user_context>${context.trim()}</user_context>`;
}
