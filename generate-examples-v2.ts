#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { load } from 'js-yaml';
import { generateWrekenfile as generateOpenAPI } from './src/v2/openapi-to-wreken';
import { generateWrekenfile as generatePostman } from './src/v2/postman-to-wrekenfile';
import { validateWrekenfile } from './src/v1/wrekenfile-validator';
import { generateMiniWrekenfiles, saveMiniWrekenfiles } from './src/v2/mini-wrekenfile-generator';

async function main() {
  console.log('Generating Wrekenfiles using v2...\n');

  // 1. Generate wrekenfile for 3n.yaml (OpenAPI v3)
  console.log('📄 Processing 3n.yaml (OpenAPI v3)...');
  try {
    const openapiPath = path.resolve('./examples/3n.yaml');
    const openapiContent = fs.readFileSync(openapiPath, 'utf8');
    const openapiSpec = load(openapiContent);
    const baseDir = path.dirname(openapiPath);
    
    const wrekenfileYaml = generateOpenAPI(openapiSpec, baseDir);
    const outputPath = './examples/3n_wrekenfile_v2.yaml';
    fs.writeFileSync(outputPath, wrekenfileYaml);
    console.log(`Generated: ${outputPath}`);
    
    // Validate
    console.log('🔍 Validating...');
    const validation = validateWrekenfile(outputPath);
    if (validation.isValid) {
      console.log('Validation passed!');
    } else {
      console.log('Validation failed:');
      validation.errors.forEach(err => console.log(`  - ${err}`));
    }
    if (validation.warnings.length > 0) {
      console.log('Warnings:');
      validation.warnings.forEach(warn => console.log(`  - ${warn}`));
    }
    
    // Generate mini-wrekenfiles
    console.log('Generating mini-wrekenfiles...');
    const miniFiles = generateMiniWrekenfiles(wrekenfileYaml);
    const miniOutputDir = './examples/3n_mini-wrekenfiles-v2';
    saveMiniWrekenfiles(miniFiles, miniOutputDir);
    console.log(`Generated ${miniFiles.length} mini-wrekenfiles in ${miniOutputDir}\n`);
    
  } catch (error: any) {
    console.error(`Error processing 3n.yaml: ${error.message}`);
    console.error(error.stack);
  }

  // 2. Generate wrekenfile for Nium Postman collection
  console.log('📄 Processing Nium APIpostman_collection.json (Postman)...');
  try {
    const postmanPath = path.resolve('./examples/Nium APIpostman_collection.json');
    const postmanContent = fs.readFileSync(postmanPath, 'utf8');
    const postmanCollection = JSON.parse(postmanContent);
    
    const wrekenfileYaml = generatePostman(postmanCollection, {});
    const outputPath = './examples/nium_wrekenfile_v2.yaml';
    fs.writeFileSync(outputPath, wrekenfileYaml);
    console.log(`Generated: ${outputPath}`);
    
    // Validate
    console.log('🔍 Validating...');
    const validation = validateWrekenfile(outputPath);
    if (validation.isValid) {
      console.log('Validation passed!');
    } else {
      console.log('Validation failed:');
      validation.errors.forEach(err => console.log(`  - ${err}`));
    }
    if (validation.warnings.length > 0) {
      console.log('Warnings:');
      validation.warnings.forEach(warn => console.log(`  - ${warn}`));
    }
    
    // Generate mini-wrekenfiles
    console.log('Generating mini-wrekenfiles...');
    const miniFiles = generateMiniWrekenfiles(wrekenfileYaml);
    const miniOutputDir = './examples/nium_mini-wrekenfiles-v2';
    saveMiniWrekenfiles(miniFiles, miniOutputDir);
    console.log(`Generated ${miniFiles.length} mini-wrekenfiles in ${miniOutputDir}\n`);
    
  } catch (error: any) {
    console.error(`Error processing Nium Postman collection: ${error.message}`);
    console.error(error.stack);
  }

  console.log('Done!');
}

main();

