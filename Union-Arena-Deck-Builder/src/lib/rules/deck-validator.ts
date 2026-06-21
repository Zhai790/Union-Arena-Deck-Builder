import type { Deck, ValidationResult, CardWithMetadata } from '../data/card-types';
import { validateDeckSize } from './size-rule';
import { validateCopyLimit } from './copy-limit-rule';
import { validateIPLock } from './ip-lock-rule';
import { validateMonoColor } from './mono-color-rule';

/**
 * Main deck validator - runs all validation rules
 */
export function validateDeck(
  deck: Deck,
  cardIndex: Map<string, CardWithMetadata>
): ValidationResult {
  const errors = [];
  const warnings = [];

  // Rule 1: Deck size (50 cards exactly)
  const sizeError = validateDeckSize(deck);
  if (sizeError) {
    errors.push(sizeError);
  }

  // Rule 2: Copy limit (4 max, or card-specific limit)
  const copyErrors = validateCopyLimit(deck, cardIndex);
  errors.push(...copyErrors);

  // Rule 3: IP Lock (same series only)
  const ipLockError = validateIPLock(deck, cardIndex);
  if (ipLockError) {
    errors.push(ipLockError);
  }

  // Rule 4: Mono-color (same primary color)
  const monoColorError = validateMonoColor(deck, cardIndex);
  if (monoColorError) {
    errors.push(monoColorError);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get a summary of validation results for display
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.valid) {
    return '✓ Deck is legal';
  }

  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;

  const parts = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount === 1 ? '' : 's'}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount === 1 ? '' : 's'}`);
  }

  return `✗ ${parts.join(', ')}`;
}
