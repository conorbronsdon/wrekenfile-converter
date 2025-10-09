// Defensive fixes for OpenAPI v3 schema traversal
// 1. Guard all property accesses ($ref, type, properties, items, allOf, oneOf, anyOf) with checks for existence and correct type
// 2. Guard all calls to getTypeFromSchema or similar with checks for defined/object
// 3. Apply these checks in all recursive struct extraction and interface extraction logic

// Example for a recursive schema traversal:
// if (schema && typeof schema === 'object' && schema.$ref) { ... }
// if (prop && typeof prop === 'object' && prop.type === 'array' && prop.items) { ... }
// ...

// Please apply these patterns throughout the file, especially in struct extraction and interface extraction functions. 