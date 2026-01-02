/**
 * Shared constants for v2 converters
 */
import { WREKENFILE_V2_VERSION } from '../../versions';

/**
 * Wrekenfile version to use for v2 converters
 */
export const WREKENFILE_VERSION = WREKENFILE_V2_VERSION;

/**
 * Default base URL when none can be extracted
 */
export const DEFAULT_BASE_URL = 'https://api.default.com';

/**
 * Common base URL variable names in Postman collections
 */
export const BASE_URL_VARIABLE_NAMES = [
  'url',
  'baseUrl',
  'base_url',
  'baseURL',
  'api_url',
  'apiUrl',
];

/**
 * Sensitive keys that should be masked in DEFAULTS
 */
export const SENSITIVE_KEYS = [
  'api_key',
  'api-key',
  'x-api-key',
  'signature',
  'x-signature',
  'authorization',
  'token',
  'password',
  'secret',
];

/**
 * YAML dump options
 */
export const YAML_DUMP_OPTIONS = {
  indent: 2,
  lineWidth: -1,
  noRefs: true,
  sortKeys: false,
  quotingType: '"' as const,
  forceQuotes: false,
};

/**
 * Execution mode constants
 */
export const EXECUTION_MODE_ASYNC = 'async';

/**
 * ASYNC section constants
 */
export const ASYNC_RETURNS_RESULT = 'result';

/**
 * Type constants
 */
export const TYPE_VOID = 'VOID';
export const TYPE_ANY = 'ANY';

/**
 * Body type constants
 */
export const BODYTYPE_RAW = 'raw';

/**
 * Default HTTP scheme
 */
export const DEFAULT_HTTP_SCHEME = 'https';

