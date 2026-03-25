import { describe, it, expect } from 'vitest';
import { mapOpenApiType } from '../src/v2/utils/type-utils';

describe('mapOpenApiType', () => {
  it('maps string type', () => {
    expect(mapOpenApiType('string')).toBe('STRING');
  });

  it('maps integer type', () => {
    expect(mapOpenApiType('integer')).toBe('INT');
  });

  it('maps number type to FLOAT', () => {
    expect(mapOpenApiType('number')).toBe('FLOAT');
  });

  it('maps boolean type', () => {
    expect(mapOpenApiType('boolean')).toBe('BOOL');
  });

  it('maps null type', () => {
    expect(mapOpenApiType('null')).toBe('NULL');
  });

  it('maps date-time format to TIMESTAMP', () => {
    expect(mapOpenApiType('string', 'date-time')).toBe('TIMESTAMP');
  });

  it('maps date format to DATE', () => {
    expect(mapOpenApiType('string', 'date')).toBe('DATE');
  });

  it('maps time format to TIME', () => {
    expect(mapOpenApiType('string', 'time')).toBe('TIME');
  });

  it('maps uuid format to STRING', () => {
    expect(mapOpenApiType('string', 'uuid')).toBe('STRING');
  });

  it('maps binary format to STRING', () => {
    expect(mapOpenApiType('string', 'binary')).toBe('STRING');
  });

  it('handles array of types (nullable)', () => {
    expect(mapOpenApiType(['string', 'null'])).toBe('STRING');
    expect(mapOpenApiType(['integer', 'null'])).toBe('INT');
    expect(mapOpenApiType(['boolean', 'null'])).toBe('BOOL');
  });

  it('returns ANY for unknown types', () => {
    expect(mapOpenApiType('unknown')).toBe('ANY');
  });

  it('returns ANY for undefined type', () => {
    expect(mapOpenApiType(undefined)).toBe('ANY');
  });

  it('is case-insensitive', () => {
    expect(mapOpenApiType('String')).toBe('STRING');
    expect(mapOpenApiType('INTEGER')).toBe('INT');
    expect(mapOpenApiType('Boolean')).toBe('BOOL');
  });
});
