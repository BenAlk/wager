#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Language mapping with their placeholder suffixes
const LANGUAGES = {
  pl: 'Polski',
  ro: 'Română',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
  fr: 'Français',
  ar: 'العربية',
  bg: 'Български'
};

// Base path to locales
const LOCALES_PATH = path.join(__dirname, '..', 'public', 'locales');

// Domain terms that should never be translated (always stay in English)
const DOMAIN_TERMS = [
  'Normal', 'DRS', 'Manual',  // Route types
  'Poor', 'Fair', 'Great', 'Fantastic', 'Fantastic+',  // Performance levels
  'Fleet', 'Flexi',  // Van types
  'Self-Invoicing', 'Verso-Basic', 'Verso-Full'  // Invoicing services
];

// Function to recursively add placeholders to translation values
function addPlaceholders(obj, languageName) {
  if (typeof obj === 'string') {
    // Skip currency symbols
    if (obj === '£') {
      return obj;
    }
    // Skip interpolation variables
    if (obj.includes('{{')) {
      return obj;
    }
    // Skip domain terms (they stay in English)
    if (DOMAIN_TERMS.includes(obj)) {
      return obj;
    }
    // Check if placeholder already exists
    if (obj.endsWith(`[${languageName}]`)) {
      return obj;
    }
    return `${obj} [${languageName}]`;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => addPlaceholders(item, languageName));
  }

  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = addPlaceholders(value, languageName);
    }
    return result;
  }

  return obj;
}

// Main function to update all translation files
function updateTranslations() {
  const englishPath = path.join(LOCALES_PATH, 'en');
  const englishFiles = fs.readdirSync(englishPath).filter(f => f.endsWith('.json'));

  console.log('Updating translation files with proper placeholders...\n');

  for (const file of englishFiles) {
    const englishFilePath = path.join(englishPath, file);
    const englishContent = JSON.parse(fs.readFileSync(englishFilePath, 'utf-8'));

    console.log(`Processing ${file}...`);

    for (const [langCode, languageName] of Object.entries(LANGUAGES)) {
      const targetPath = path.join(LOCALES_PATH, langCode, file);

      // Read existing file to preserve any actual translations that might exist
      let existingContent = {};
      if (fs.existsSync(targetPath)) {
        try {
          existingContent = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
        } catch (e) {
          console.log(`  Warning: Could not parse ${langCode}/${file}, will recreate`);
        }
      }

      // Create new content with placeholders
      const newContent = addPlaceholders(englishContent, languageName);

      // Write the file
      fs.writeFileSync(targetPath, JSON.stringify(newContent, null, 2) + '\n', 'utf-8');
      console.log(`  ✓ Updated ${langCode}/${file}`);
    }

    console.log('');
  }

  console.log('All translation files updated successfully!');
}

// Run the script
try {
  updateTranslations();
} catch (error) {
  console.error('Error updating translations:', error);
  process.exit(1);
}
