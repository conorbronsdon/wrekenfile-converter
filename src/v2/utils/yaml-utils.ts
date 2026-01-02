/**
 * Shared YAML utility functions for v2 converters
 */
import { load as yamlLoad } from 'js-yaml';

/**
 * Clean YAML string by removing tabs, non-breaking spaces, and other problematic characters
 */
export function cleanYaml(yamlString: string): string {
  return yamlString
    .replace(/\t/g, '  ')
    .replace(/[\u00A0]/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\r\n/g, '\n');
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
 * Post-process YAML to remove quotes from type strings
 * - Removes quotes from STRUCT(...) values
 * - Converts quoted array types to YAML block scalar format
 */
export function removeTypeQuotes(yamlString: string): string {
  // Remove quotes from STRUCT(...) values
  yamlString = yamlString.replace(/(TYPE|RETURNTYPE):\s*"STRUCT\(([^)]+)\)"/g, '$1: STRUCT($2)');
  
  // Remove quotes from array types - use YAML block scalar syntax (|-) to avoid quotes
  // YAML requires quotes for values starting with [], so we use block scalar format
  // Handle both regular lines and array items (lines starting with -)
  yamlString = yamlString.replace(/^(\s+)(-?\s*)(TYPE|RETURNTYPE):\s*['"](\[\]STRUCT\([^)]+\)|\[\][A-Z]+)['"]/gm, (match, indent, arrayPrefix, key, value) => {
    // Use block scalar format: key: |-\n  value (requires newline after |-)
    return `${indent}${arrayPrefix}${key}: |-\n${indent}${arrayPrefix.replace(/-/, ' ')}  ${value}`;
  });
  
  return yamlString;
}

