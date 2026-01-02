import * as yaml from 'js-yaml';
import * as fs from 'fs';

export interface MiniWrekenfile {
  content: string;
  metadata: {
    endpoint: string;
    methods: string[];
    structs: string[];
    filename: string;
  };
}

interface WrekenfileData {
  VERSION: string;
  DEFAULTS?: Record<string, any>;
  METHODS: Record<string, any>;
  STRUCTS?: Record<string, any>;
}

/**
 * Generates mini Wrekenfiles by grouping methods by endpoint
 * Each mini Wrekenfile contains all methods for a single endpoint plus their required structs
 */
export function generateMiniWrekenfiles(wrekenfileContent: string): MiniWrekenfile[] {
  if (!wrekenfileContent || typeof wrekenfileContent !== 'string') {
    throw new Error("Argument 'wrekenfileContent' is required and must be a string");
  }
  try {
    // Parse the main Wrekenfile from YAML string
    const data = yaml.load(wrekenfileContent) as WrekenfileData;
    
    if (!data.METHODS) {
      throw new Error('No METHODS section found in Wrekenfile');
    }

    // Group methods by endpoint
    const endpointGroups = groupMethodsByEndpoint(data.METHODS);
    
    const miniWrekenfiles: MiniWrekenfile[] = [];
    
    // Generate a mini Wrekenfile for each endpoint group
    for (const [endpoint, methods] of Object.entries(endpointGroups)) {
      const miniWrekenfile = createMiniWrekenfile(data, endpoint, methods);
      miniWrekenfiles.push(miniWrekenfile);
    }
    
    return miniWrekenfiles;
  } catch (error) {
    console.error('Error generating mini Wrekenfiles:', error);
    throw error;
  }
}

/**
 * Groups methods by their endpoint path
 */
function groupMethodsByEndpoint(methods: Record<string, any>): Record<string, Record<string, any>> {
  const groups: Record<string, Record<string, any>> = {};
  
  for (const [methodName, methodData] of Object.entries(methods)) {
    let endpoint = methodData.HTTP?.ENDPOINT;
    if (!endpoint) {
      console.warn(`Method ${methodName} has no HTTP.ENDPOINT, skipping`);
      continue;
    }
    // Normalize endpoint: remove backticks and trim whitespace
    if (typeof endpoint === 'string') {
      endpoint = endpoint.trim();
      if (endpoint.startsWith('`') && endpoint.endsWith('`')) {
        endpoint = endpoint.slice(1, -1).trim();
      }
      // Remove leading slash if present for consistency
      if (endpoint.startsWith('/')) {
        endpoint = endpoint.substring(1);
      }
    }
    if (!groups[endpoint]) {
      groups[endpoint] = {};
    }
    groups[endpoint][methodName] = methodData;
  }
  
  return groups;
}

/**
 * Creates a complete mini Wrekenfile for a specific endpoint
 */
function createMiniWrekenfile(
  data: WrekenfileData, 
  endpoint: string, 
  methods: Record<string, any>
): MiniWrekenfile {
  // Collect all structs referenced by the methods in this group
  const requiredStructs = collectRequiredStructs(methods, data.STRUCTS || {});
  
  // Create the mini Wrekenfile structure (v2.0.1 format)
  const miniData: any = {
    VERSION: data.VERSION,
    METHODS: methods,
  };
  
  // Add DEFAULTS if present
  if (data.DEFAULTS && Object.keys(data.DEFAULTS).length > 0) {
    miniData.DEFAULTS = data.DEFAULTS;
  }
  
  // Add STRUCTS if there are any required
  if (Object.keys(requiredStructs).length > 0) {
    miniData.STRUCTS = requiredStructs;
  }
  
  // Convert to YAML
  const content = yaml.dump(miniData, { 
    indent: 2, 
    lineWidth: -1,
    noRefs: true 
  });
  
  // Generate metadata
  const methodList = Object.values(methods).map((method: any) => method.HTTP?.METHOD).filter(Boolean);
  const structNames = Object.keys(requiredStructs);
  const filename = generateFilename(endpoint);
  
  return {
    content,
    metadata: {
      endpoint: `/${endpoint}`, // Add leading slash for consistency
      methods: methodList,
      structs: structNames,
      filename
    }
  };
}

/**
 * Collects all structs required by the given methods
 */
function collectRequiredStructs(
  methods: Record<string, any>, 
  allStructs: Record<string, any>
): Record<string, any> {
  const requiredStructs: Record<string, any> = {};
  const processedStructs = new Set<string>();
  
  // Extract struct references from methods
  const structRefs = new Set<string>();
  
  for (const methodData of Object.values(methods)) {
    // Check INPUTS
    if (methodData.INPUTS) {
      for (const input of methodData.INPUTS) {
        // Handle both simple form (key: type) and extended form (key: { TYPE: ... })
        for (const [key, value] of Object.entries(input)) {
          let type: string;
          if (typeof value === 'string') {
            type = value; // Simple form
          } else if (value && typeof value === 'object' && 'TYPE' in value) {
            type = (value as any).TYPE; // Extended form
          } else {
            continue;
          }
          const structNames = extractAllStructNames(type);
          for (const structName of structNames) {
            if (structName) structRefs.add(structName);
          }
        }
      }
    }
    
    // Check RETURNS
    if (methodData.RETURNS) {
      for (const ret of methodData.RETURNS) {
        if (ret.RETURNTYPE) {
          const structNames = extractAllStructNames(ret.RETURNTYPE);
          for (const structName of structNames) {
            if (structName) structRefs.add(structName);
          }
        }
      }
    }
    
    // Check ERRORS
    if (methodData.ERRORS) {
      for (const error of methodData.ERRORS) {
        if (error.TYPE) {
          const structNames = extractAllStructNames(error.TYPE);
          for (const structName of structNames) {
            if (structName) structRefs.add(structName);
          }
        }
      }
    }
    
    // Check ASYNC.RESULT.TYPE
    if (methodData.ASYNC?.RESULT?.TYPE) {
      const structNames = extractAllStructNames(methodData.ASYNC.RESULT.TYPE);
      for (const structName of structNames) {
        if (structName) structRefs.add(structName);
      }
    }
  }
  
  // Recursively collect all required structs and their dependencies
  for (const structName of structRefs) {
    collectStructRecursively(structName, allStructs, requiredStructs, processedStructs);
  }
  
  return requiredStructs;
}

/**
 * Recursively collects a struct and all its nested struct dependencies
 */
function collectStructRecursively(
  structName: string,
  allStructs: Record<string, any>,
  requiredStructs: Record<string, any>,
  processedStructs: Set<string>
) {
  if (processedStructs.has(structName)) {
    return; // Already processed
  }
  
  processedStructs.add(structName);
  
  if (!allStructs[structName]) {
    console.warn(`Struct ${structName} not found in STRUCTS section`);
    return;
  }
  
  // Add the struct
  requiredStructs[structName] = allStructs[structName];
  
  // Check for nested struct references
  const structFields = allStructs[structName];
  if (Array.isArray(structFields)) {
    for (const field of structFields) {
      if (field.type) {
        // Handle STRUCT(SomeStruct) and []STRUCT(SomeStruct)
        const nestedStructNames = extractAllStructNames(field.type);
        for (const nestedStructName of nestedStructNames) {
          if (nestedStructName) {
            collectStructRecursively(nestedStructName, allStructs, requiredStructs, processedStructs);
          }
        }
      }
    }
  }
}

/**
 * Extracts all struct names from a type string, e.g. STRUCT(SomeStruct), []STRUCT(SomeStruct), map[STRING]STRUCT(SomeStruct)
 */
function extractAllStructNames(typeString: string): string[] {
  const matches: string[] = [];
  // Match STRUCT(SomeStruct)
  const match1 = typeString.match(/^STRUCT\(([^)]+)\)/);
  if (match1) matches.push(match1[1]);
  // Match []STRUCT(SomeStruct)
  const match2 = typeString.match(/^\[\]STRUCT\(([^)]+)\)/);
  if (match2) matches.push(match2[1]);
  // Match map[KEY]STRUCT(SomeStruct)
  const match3 = typeString.match(/map\[[^\]]+\]STRUCT\(([^)]+)\)/);
  if (match3) matches.push(match3[1]);
  return matches;
}

/**
 * Extracts struct name from STRUCT(name) format
 */
function extractStructName(typeString: string): string | null {
  const match = typeString.match(/^STRUCT\(([^)]+)\)/) || 
                typeString.match(/^\[\]STRUCT\(([^)]+)\)/) ||
                typeString.match(/map\[[^\]]+\]STRUCT\(([^)]+)\)/);
  return match ? match[1] : null;
}

/**
 * Generates a filename for the mini Wrekenfile
 */
function generateFilename(endpoint: string): string {
  // Clean the endpoint to create a valid filename
  const cleanEndpoint = endpoint
    .replace(/^\/+/, '') // Remove leading slashes
    .replace(/\/+$/, '') // Remove trailing slashes
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  return `mini-${cleanEndpoint}.yaml`;
}

/**
 * Saves mini Wrekenfiles to disk (optional utility function)
 */
export function saveMiniWrekenfiles(miniWrekenfiles: MiniWrekenfile[], outputDir: string = './mini-wrekenfiles'): void {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const miniFile of miniWrekenfiles) {
    const filePath = `${outputDir}/${miniFile.metadata.filename}`;
    fs.writeFileSync(filePath, miniFile.content);
    console.log(`Saved: ${filePath}`);
  }
}

