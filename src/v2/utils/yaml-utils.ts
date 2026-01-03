/**
 * Shared YAML utility functions for v2 converters
 */
import { load as yamlLoad } from 'js-yaml';

/**
 * Clean YAML string by removing tabs, non-breaking spaces, and other problematic characters
 * Also removes YAML document separators, excessive blank lines, and leading/trailing whitespace
 */
export function cleanYaml(yamlString: string): string {
  let cleaned = yamlString
    // Replace tabs with spaces
    .replace(/\t/g, '  ')
    // Replace non-breaking spaces
    .replace(/[\u00A0]/g, ' ')
    // Remove non-printable control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Remove trailing whitespace from each line
    .replace(/[ \t]+$/gm, '');

  // Remove YAML document separators (--- and ...) except at the very start
  // Remove --- if it appears after the first line
  const lines = cleaned.split('\n');
  const filteredLines: string[] = [];
  let isFirstLine = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip YAML document separators (except --- at the very start)
    if (trimmed === '---' && !isFirstLine) {
      continue;
    }
    if (trimmed === '...') {
      continue;
    }
    
    // Skip separator lines
    if (trimmed === '===' || trimmed === '___') {
      continue;
    }
    
    // Keep the line
    filteredLines.push(line);
    if (trimmed !== '') {
      isFirstLine = false;
    }
  }
  
  cleaned = filteredLines.join('\n');
  
  // Remove excessive blank lines (3+ consecutive newlines → 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove leading whitespace (whitespace-only lines at the start)
  cleaned = cleaned.replace(/^\s+/, '');
  
  // Remove trailing whitespace (including newlines) and ensure single trailing newline
  cleaned = cleaned.replace(/[\s\n]+$/, '');
  if (cleaned) {
    cleaned += '\n';
  }
  
  return cleaned;
}

/**
 * Check YAML string for hidden/invalid characters
 */
export function checkYamlForHiddenChars(yamlString: string): void {
  const lines = yamlString.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\t/.test(line)) {
      throw new Error(`YAML contains a TAB character at line ${i + 1}:\n${line}`);
    }
    if (/\u00A0/.test(line)) {
      throw new Error(`YAML contains a non-breaking space (U+00A0) at line ${i + 1}:\n${line}`);
    }
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(line)) {
      throw new Error(`YAML contains a non-printable character at line ${i + 1}:\n${line}`);
    }
  }
}

/**
 * Validate YAML string is parseable
 */
export function validateYaml(yamlString: string): void {
  try {
    yamlLoad(yamlString);
  } catch (e) {
    throw new Error('Generated YAML is invalid: ' + (e as any).message);
  }
}

/**
 * Post-process YAML to ensure proper quoting of complex types
 * - Keeps STRUCT(...) unquoted (valid YAML)
 * - Quotes []STRUCT(...) and []TYPE patterns (required for valid YAML)
 * - Converts block scalar format back to quoted format if present
 */
export function removeTypeQuotes(yamlString: string): string {
  // First, convert any block scalar format back to regular format
  // Handle: TYPE: |-\n    []STRUCT(...)
  yamlString = yamlString.replace(/^(\s+)(-?\s*)(TYPE|RETURNTYPE):\s*\|\-\s*\n(\s+)(\[\]STRUCT\([^)]+\)|\[\][A-Z]+)/gm, (match, indent, arrayPrefix, key, valueIndent, value) => {
    return `${indent}${arrayPrefix}${key}: ${value}`;
  });
  
  // Remove quotes from STRUCT(...) values (they don't need quotes)
  yamlString = yamlString.replace(/(TYPE|RETURNTYPE):\s*"STRUCT\(([^)]+)\)"/g, '$1: STRUCT($2)');
  
  // Quote array types ([]STRUCT(...) and []TYPE) - required for valid YAML
  // Handle both regular lines and array items (lines starting with -)
  yamlString = yamlString.replace(/^(\s+)(-?\s*)(TYPE|RETURNTYPE):\s*(\[\]STRUCT\([^)]+\)|\[\][A-Z]+)(\s*)$/gm, (match, indent, arrayPrefix, key, value, trailing) => {
    // Quote the value if it's not already quoted
    if (!value.startsWith('"') && !value.startsWith("'")) {
      return `${indent}${arrayPrefix}${key}: "${value}"${trailing}`;
    }
    return match;
  });
  
  return yamlString;
}

