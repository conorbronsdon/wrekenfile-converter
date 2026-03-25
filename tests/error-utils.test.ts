import { describe, it, expect } from 'vitest';
import {
  createConverterError,
  validateOpenApiV3Spec,
  validateOpenApiV2Spec,
  validatePostmanCollection,
} from '../src/v2/utils/error-utils';

describe('createConverterError', () => {
  it('creates error with all fields', () => {
    const err = createConverterError('test', 'TEST_CODE', { key: 'val' });
    expect(err.message).toBe('test');
    expect(err.code).toBe('TEST_CODE');
    expect(err.context).toEqual({ key: 'val' });
  });

  it('creates error with cause', () => {
    const cause = new Error('root cause');
    const err = createConverterError('wrapper', 'WRAP', undefined, cause);
    expect(err.cause).toBe(cause);
  });
});

describe('validateOpenApiV3Spec', () => {
  it('accepts valid v3 spec', () => {
    expect(() =>
      validateOpenApiV3Spec({
        openapi: '3.0.3',
        info: { title: 'Test', version: '1.0' },
        paths: { '/test': {} },
      })
    ).not.toThrow();
  });

  it('rejects null spec', () => {
    expect(() => validateOpenApiV3Spec(null)).toThrow();
  });

  it('rejects spec without openapi field', () => {
    expect(() =>
      validateOpenApiV3Spec({ info: {}, paths: {} })
    ).toThrow(/missing/i);
  });

  it('detects swagger v2 spec and suggests v2 converter', () => {
    expect(() =>
      validateOpenApiV3Spec({ swagger: '2.0', info: {}, paths: {} })
    ).toThrow(/v2 converter/i);
  });

  it('rejects spec without paths', () => {
    expect(() =>
      validateOpenApiV3Spec({ openapi: '3.0.0', info: { title: 'T', version: '1' } })
    ).toThrow(/paths/i);
  });
});

describe('validateOpenApiV2Spec', () => {
  it('accepts valid v2 spec', () => {
    expect(() =>
      validateOpenApiV2Spec({
        swagger: '2.0',
        info: { title: 'Test', version: '1.0' },
        paths: { '/test': {} },
      })
    ).not.toThrow();
  });

  it('detects v3 spec and suggests v3 converter', () => {
    expect(() =>
      validateOpenApiV2Spec({ openapi: '3.0.0', info: {}, paths: {} })
    ).toThrow(/v3 converter/i);
  });

  it('rejects invalid swagger version', () => {
    expect(() =>
      validateOpenApiV2Spec({
        swagger: '3.0',
        info: { title: 'T', version: '1' },
        paths: {},
      })
    ).toThrow(/version/i);
  });
});

describe('validatePostmanCollection', () => {
  it('accepts valid collection', () => {
    expect(() =>
      validatePostmanCollection({
        info: { name: 'Test' },
        item: [{ name: 'request' }],
      })
    ).not.toThrow();
  });

  it('rejects null collection', () => {
    expect(() => validatePostmanCollection(null)).toThrow();
  });

  it('rejects collection without info', () => {
    expect(() =>
      validatePostmanCollection({ item: [{ name: 'r' }] })
    ).toThrow(/info/i);
  });

  it('rejects collection with empty items', () => {
    expect(() =>
      validatePostmanCollection({ info: { name: 'T' }, item: [] })
    ).toThrow(/empty/i);
  });
});
