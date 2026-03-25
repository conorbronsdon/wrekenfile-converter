import { describe, it, expect } from 'vitest';
import { generateReturnVarName, generateErrorWhen } from '../src/v2/utils/response-utils';

describe('generateReturnVarName', () => {
  it('generates _result suffix for 200', () => {
    expect(generateReturnVarName('listPets', '200')).toBe('list_pets_result');
  });

  it('includes status code for non-200 success', () => {
    expect(generateReturnVarName('createPet', '201')).toBe('create_pet_201');
  });

  it('handles camelCase operationIds', () => {
    const result = generateReturnVarName('getUserProfile', '200');
    expect(result).toBe('get_user_profile_result');
  });
});

describe('generateErrorWhen', () => {
  it('uses response description when available', () => {
    const result = generateErrorWhen({ description: 'Not found' }, '404');
    expect(result).toBe('Not found (HTTP 404)');
  });

  it('generates client error message for 4xx', () => {
    const result = generateErrorWhen(null, '403');
    expect(result).toContain('Client error');
    expect(result).toContain('403');
  });

  it('generates server error message for 5xx', () => {
    const result = generateErrorWhen(null, '500');
    expect(result).toContain('Server error');
    expect(result).toContain('500');
  });

  it('falls back to HTTP code for other statuses', () => {
    const result = generateErrorWhen(null, '301');
    expect(result).toBe('HTTP 301');
  });
});
