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
    } else if (Array.isArray(value)) {
      // Handle arrays (convert to string representation)
      flattened.push({ key: newKey, value: JSON.stringify(value), type: 'array' });
    } else {
      flattened.push({ key: newKey, value: String(value), type: typeof value });
    }
  }

  return flattened;
}

// Escape CSV cell
function escapeCSV(text) {
  const str = String(text);
  // If contains comma, newline, or quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Main function
function createSpreadsheet() {
  const files = fs.readdirSync(LOCALES_PATH).filter(f => f.endsWith('.json'));

  const rows = [['Namespace', 'Key', 'Full Key Path', 'English Text', 'Polski', 'Română', 'Español', 'Português', 'Deutsch', 'Français', 'العربية', 'Български', 'Context/Notes']];

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
        item.key,
        fullPath,
        item.value,
        '', // Polski
        '', // Română
        '', // Español
        '', // Português
        '', // Deutsch
        '', // Français
        '', // العربية
        '', // Български
        '' // Context/Notes
      ]);
    }
  }

  // Create CSV
  const csv = rows.map(row =>
    row.map(cell => escapeCSV(cell)).join(',')
  ).join('\n');

  const outputPath = path.join(__dirname, '..', 'translations-master.csv');
  fs.writeFileSync(outputPath, csv, 'utf-8');

  console.log(`✓ Spreadsheet created: ${outputPath}`);
  console.log(`✓ Total translation keys: ${totalKeys}`);
  console.log(`✓ Namespaces: ${files.length}`);
  console.log('');
  console.log('Breakdown by namespace:');

  for (const file of files.sort()) {
    const namespace = file.replace('.json', '');
    const filePath = path.join(LOCALES_PATH, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const count = flattenObject(content).length;
    console.log(`  ${namespace.padEnd(20)} ${count} keys`);
  }
}

createSpreadsheet();
