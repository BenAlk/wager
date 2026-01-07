#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LOCALES_PATH = path.join(__dirname, '..', 'public', 'locales', 'en');

// Flatten nested object into dot notation keys
function flattenObject(obj, prefix = '') {
  const flattened = [];

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flattened.push(...flattenObject(value, newKey));
    } else {
      flattened.push({ key: newKey, value: String(value) });
    }
  }

  return flattened;
}

// Escape CSV cell
function escapeCSV(text) {
  const str = String(text);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Main function
function createEnglishList() {
  const files = fs.readdirSync(LOCALES_PATH).filter(f => f.endsWith('.json'));

  const rows = [['Namespace', 'Full Key Path', 'English Text']];

  let totalKeys = 0;

  for (const file of files.sort()) {
    const namespace = file.replace('.json', '');
    const filePath = path.join(LOCALES_PATH, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const flattened = flattenObject(content);
    totalKeys += flattened.length;

    for (const item of flattened) {
      const fullPath = `${namespace}:${item.key}`;
      rows.push([
        namespace,
        fullPath,
        item.value
      ]);
    }
  }

  // Create CSV
  const csv = rows.map(row =>
    row.map(cell => escapeCSV(cell)).join(',')
  ).join('\n');

  const outputPath = path.join(__dirname, '..', 'translations-english-only.csv');
  fs.writeFileSync(outputPath, csv, 'utf-8');

  console.log(`✓ English-only list created: ${outputPath}`);
  console.log(`✓ Total translation keys: ${totalKeys}`);
}

createEnglishList();
