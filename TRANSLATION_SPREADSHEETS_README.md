# Translation Spreadsheets

Created: December 31, 2024

## Files Created

### 1. `translations-master.csv` (69 KB)
**Full translation workbook with all 8 target languages**

Columns:
- **Namespace**: The translation namespace (auth, calendar, common, etc.)
- **Key**: The specific key within the namespace
- **Full Key Path**: Complete reference path (e.g., `auth:login.title`)
- **English Text**: The source English text to translate
- **Polski**: Empty column for Polish translations
- **Română**: Empty column for Romanian translations
- **Español**: Empty column for Spanish translations
- **Português**: Empty column for Portuguese translations
- **Deutsch**: Empty column for German translations
- **Français**: Empty column for French translations
- **العربية**: Empty column for Arabic translations
- **Български**: Empty column for Bulgarian translations
- **Context/Notes**: Empty column for translator notes

**Total Rows**: 690 (1 header + 689 translation keys)

**Use case**: Send to translation agency or use with Google Sheets/Excel for collaborative translation work.

### 2. `translations-english-only.csv` (33 KB)
**Simplified list with just English text**

Columns:
- **Namespace**: The translation namespace
- **Full Key Path**: Complete reference path
- **English Text**: The source English text

**Total Rows**: 690 (1 header + 689 translation keys)

**Use case**: Quick reference, review, or to send to a single translator working on one language at a time.

## Translation Breakdown by Namespace

| Namespace       | Keys | Description                                    |
|-----------------|------|------------------------------------------------|
| auth            | 39   | Authentication (login, signup, forgot password) |
| calendar        | 58   | Calendar view and work day editing              |
| common          | 44   | Common UI elements (actions, labels, time)      |
| dashboard       | 98   | Dashboard tiles and quick actions               |
| domain          | 13   | **Domain terms (DO NOT translate)**             |
| onboarding      | 116  | Onboarding wizard and guided tour               |
| settings        | 91   | Settings page and dialogs                       |
| toast           | 64   | Toast notification messages                     |
| validation      | 40   | Form validation error messages                  |
| van             | 51   | Van hire modal and dialogs                      |
| vanManagement   | 27   | Van management page                             |
| week-summary    | 48   | Week summary and pay breakdown                  |
| **TOTAL**       | **689** | **Total translation keys**                   |

## Important Notes for Translators

### 1. DO NOT Translate Domain Terms (domain namespace)

The `domain.json` namespace contains business-specific terms that **must remain in English**:
- Route types: Normal, DRS, Manual
- Performance levels: Poor, Fair, Great, Fantastic, Fantastic+
- Van types: Fleet, Flexi
- Invoicing services: Self-Invoicing, Verso-Basic, Verso-Full

### 2. Preserve Interpolation Variables

Keep placeholders like `{{week}}`, `{{amount}}`, `{{date}}` exactly as they appear:
- ✓ CORRECT: "Week {{week}}, {{year}}"
- ✗ WRONG: "Semana {{semana}}, {{año}}"

### 3. Keep Currency Symbols

The pound symbol (£) should remain unchanged as this is a UK-only app.

### 4. Maintain Formatting

Preserve:
- Line breaks (`\n`)
- Punctuation at the end of sentences
- Capitalization style (e.g., Title Case for headings)

### 5. Context Matters

Some keys appear in multiple contexts. Use the "Full Key Path" to understand where the text appears:
- `auth:login.title` vs `settings:title` - different contexts
- `common:actions.save` - generic save button used everywhere

## How to Use These Spreadsheets

### Option 1: Google Sheets (Recommended for collaboration)
1. Upload `translations-master.csv` to Google Sheets
2. Share with translators
3. Assign one column per translator/language
4. Translators fill in their columns
5. Export back to CSV when done

### Option 2: Excel
1. Open `translations-master.csv` in Excel
2. Use "Text to Columns" if needed
3. Translators fill in their language column
4. Save as CSV (UTF-8) to preserve special characters

### Option 3: Professional Translation Service
1. Send `translations-master.csv` to translation agency
2. They'll use their own tools (CAT tools, etc.)
3. They'll return completed translations

### Option 4: One Language at a Time
1. Use `translations-english-only.csv`
2. Add a third column for the target language
3. Translator completes their column
4. Repeat for each language

## After Translation

Once translations are complete, you'll need to:

1. **Import translations back into JSON files**
   - We can create a script to convert CSV back to JSON format
   - Or manually update the JSON files in `public/locales/{lang}/`

2. **Review and test**
   - Load the app in each language
   - Check for text overflow, layout breaks
   - Verify all strings are translated

3. **Native speaker review**
   - Have native speakers review the translations
   - Check for cultural appropriateness
   - Verify technical terms make sense

## Questions?

If you need any modifications to these spreadsheets (different format, additional columns, filtered by namespace, etc.), just ask!
