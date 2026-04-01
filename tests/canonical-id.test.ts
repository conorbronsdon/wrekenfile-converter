import { describe, it, expect } from 'vitest';
import { computeCanonicalId, resolveCanonicalIds } from '../src/v2/utils/canonical-id';

describe('computeCanonicalId', () => {
  it('generates id from simple GET endpoint', () => {
    const id = computeCanonicalId('GET', '/pets');
    expect(id).toBe('pets.pet.list');
  });

  it('generates id from GET with path param (singular resource)', () => {
    const id = computeCanonicalId('GET', '/pets/{petId}');
    expect(id).toBe('pets.pet.get');
  });

  it('generates id from POST endpoint', () => {
    const id = computeCanonicalId('POST', '/pets');
    expect(id).toBe('pets.pet.create');
  });

  it('generates id from PUT endpoint', () => {
    const id = computeCanonicalId('PUT', '/pets/{petId}');
    expect(id).toBe('pets.pet.update');
  });

  it('generates id from DELETE endpoint', () => {
    const id = computeCanonicalId('DELETE', '/pets/{petId}');
    expect(id).toBe('pets.pet.delete');
  });

  it('strips version prefix', () => {
    const id = computeCanonicalId('GET', '/v1/users');
    expect(id).toBe('users.user.list');
  });

  it('handles nested resources', () => {
    const id = computeCanonicalId('GET', '/users/{userId}/posts');
    // Resource is derived from segment after namespace; path params stripped
    expect(id).toBe('users.post.get');
  });

  it('handles deeply nested resources with subresource', () => {
    const id = computeCanonicalId('POST', '/users/{userId}/posts/{postId}/comments');
    // Collapses to namespace.resource.subresource.action
    expect(id).toBe('users.post.comments.create');
  });

  it('handles namespace prefixes (api, admin)', () => {
    const id = computeCanonicalId('GET', '/api/clusters');
    expect(id).toBe('api.cluster.list');
  });

  it('returns fallback for empty path', () => {
    const id = computeCanonicalId('GET', '/');
    expect(id).toBe('api.resource.execute');
  });

  it('handles kebab-case segments', () => {
    const id = computeCanonicalId('GET', '/api/helm-releases');
    // singularize strips trailing 's' but doesn't camelCase the resource segment
    expect(id).toBe('api.helm-releas.list');
  });

  it('handles paths with action verbs', () => {
    const id = computeCanonicalId('POST', '/api/clusters/{id}/restart');
    expect(id).toBe('api.cluster.restart');
  });

  it('handles irregular plurals', () => {
    const id = computeCanonicalId('GET', '/policies');
    expect(id).toBe('policies.policy.list');
  });

  it('handles :param style path parameters', () => {
    const id = computeCanonicalId('GET', '/pets/:petId');
    expect(id).toBe('pets.pet.get');
  });

  it('handles PATCH method', () => {
    const id = computeCanonicalId('PATCH', '/users/{id}');
    expect(id).toBe('users.user.update');
  });

  it('defaults to GET when method is missing', () => {
    const id = computeCanonicalId('', '/pets');
    expect(id).toBe('pets.pet.list');
  });

  it('handles OPTIONS method', () => {
    const id = computeCanonicalId('OPTIONS', '/pets');
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.split('.').length).toBeGreaterThanOrEqual(3);
  });

  it('handles HEAD method', () => {
    const id = computeCanonicalId('HEAD', '/pets/{petId}');
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  it('handles triple-nested resources', () => {
    const id = computeCanonicalId('GET', '/orgs/{orgId}/teams/{teamId}/members/{memberId}');
    expect(id).toBeDefined();
    expect(id.split('.').length).toBeGreaterThanOrEqual(3);
  });

  it('handles paths with numeric version segments', () => {
    const id = computeCanonicalId('GET', '/v2/users/{id}/settings');
    expect(id).not.toContain('v2');
  });

  it('handles single-segment paths', () => {
    const id = computeCanonicalId('GET', '/health');
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });

  it('handles paths with trailing slash', () => {
    const withSlash = computeCanonicalId('GET', '/pets/');
    const withoutSlash = computeCanonicalId('GET', '/pets');
    expect(withSlash).toBe(withoutSlash);
  });
});

describe('resolveCanonicalIds', () => {
  it('assigns unique IDs to non-colliding methods', () => {
    const result = resolveCanonicalIds([
      { methodId: 'listPets', httpMethod: 'GET', endpoint: '/pets' },
      { methodId: 'createPet', httpMethod: 'POST', endpoint: '/pets' },
      { methodId: 'getPet', httpMethod: 'GET', endpoint: '/pets/{petId}' },
    ]);

    expect(result.size).toBe(3);
    expect(result.get('listPets')).toBe('pets.pet.list');
    expect(result.get('createPet')).toBe('pets.pet.create');
    expect(result.get('getPet')).toBe('pets.pet.get');
  });

  it('handles collisions with hash suffix', () => {
    // Two different endpoints that produce the same canonical ID
    const result = resolveCanonicalIds([
      { methodId: 'method1', httpMethod: 'GET', endpoint: '/pets' },
      { methodId: 'method2', httpMethod: 'GET', endpoint: '/pets' },
    ]);

    expect(result.size).toBe(2);
    const ids = [...result.values()];
    // All IDs should be unique
    expect(new Set(ids).size).toBe(2);
  });

  it('preserves existing canonical IDs', () => {
    const result = resolveCanonicalIds([
      { methodId: 'listPets', existingCanonicalId: 'custom.pets.list' },
    ]);

    expect(result.get('listPets')).toBe('custom.pets.list');
  });

  it('handles SDK-only methods without HTTP info', () => {
    const result = resolveCanonicalIds([
      { methodId: 'sdk--client--initialize' },
    ]);

    expect(result.size).toBe(1);
    const id = result.get('sdk--client--initialize');
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });
});
