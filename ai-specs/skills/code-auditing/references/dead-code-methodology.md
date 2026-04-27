# Dead Code Detection Methodology

This document provides guidance on detecting and removing dead code in TasteSpot using automated tools and manual verification.

## Overview

Dead code is code that exists in the codebase but is never executed. It increases maintenance burden, bundle size, and cognitive load. This methodology combines tooling with manual verification to filter false positives.

## Types of Dead Code

### 1. Unused Imports

Import statements for modules/symbols that are never used:

```javascript
import { unused } from "./utils"; // Never referenced
```

### 2. Unused Exports

Functions, classes, variables exported but never imported elsewhere:

```javascript
export function formatDate() { ... }  // Not imported anywhere
```

### 3. Unused Variables

Variables declared but never read:

```python
result = compute()  # Never used after assignment
```

### 4. Unused Functions/Methods

Functions defined but never called:

```typescript
function legacyHelper() { ... }  // Never invoked
```

### 5. Unused Files

Entire files not imported anywhere in the codebase.

### 6. Unused Dependencies

Packages in package.json/requirements.txt not used in code.

### 7. Unreachable Code

Code after return/throw statements or in dead branches:

```javascript
function foo() {
    return 42;
    console.log("never runs"); // Unreachable
}
```

## Detection Tools

### Web: Knip (JavaScript/TypeScript)

**Installation:**

```bash
npm install -g knip
# or use via npx (no install required)
```

**Commands:**

```bash
# Detection (default output)
cd web && npx knip

# JSON output for parsing
cd web && npx knip --reporter json

# Fix automatically (use with caution)
cd web && npx knip --fix

# Specific workspace
npx knip --workspace packages/core

# Include/exclude patterns
npx knip --include files --exclude dependencies
```

**Configuration (`knip.json`):**

```json
{
    "$schema": "https://unpkg.com/knip@latest/schema.json",
    "entry": ["src/index.ts"],
    "project": ["src/**/*.ts"],
    "ignore": ["**/*.test.ts"],
    "ignoreDependencies": ["@types/*"]
}
```

**Categories detected:**

- files, dependencies, devDependencies
- exports, nsExports, classMembers
- types, nsTypes, enumMembers
- unlisted, binaries, unresolved, duplicates

### Backend: Reference Search + Safe Manual Verification

For Laravel/PHP in this repository, do not rely on aggressive auto-delete tools by default.
Use conservative detection with reference search and runtime/config checks.

Suggested checks:

```bash
# Search references for a symbol or file basename
grep -Rin "SymbolName" backend/app backend/routes backend/tests

# Route/controller usage map
cd backend && php artisan route:list

# Baseline tests after candidate removal
cd backend && composer test
```

If dedicated static analysis is available in the project later, integrate it as optional.

### Optional: Deadcode (Python)

Not part of this stack, keep only as optional reference when auditing Python repositories.

**Installation:**

```bash
pip install deadcode
```

**Commands:**

```bash
# Detection
deadcode .

# With verbose output
deadcode . --verbose

# Fix automatically
deadcode . --fix

# Dry run (show what would be fixed)
deadcode . --dry

# Specific path
deadcode src/

# Exclude patterns
deadcode . --exclude tests/
```

**Detection capabilities:**

- Unused imports (DC01)
- Unused variables (DC02)
- Unused functions (DC03)
- Unused classes (DC04)
- Unused methods (DC05)

## False Positive Detection

**CRITICAL: Always verify findings before reporting to the user.**

### Common False Positives

#### 1. Dynamic Imports

```javascript
// These imports appear unused but are loaded at runtime
const module = await import(modulePath);
require(variableName);
```

#### 2. Framework Magic

```typescript
// React components used in JSX
export const Button = () => <button />;  // Used as <Button />

// Decorators in TypeScript/Python
@decorator
export class Controller {}

// Vue setup functions
export function useCounter() { ... }  // Used in <script setup>
```

#### 3. Re-exports for Public API

```typescript
// index.ts barrel file - exports ARE the purpose
export { Helper } from "./helper"; // Re-exported for external use
```

#### 4. Entry Points

```javascript
// CLI scripts, serverless handlers, etc.
export const handler = async (event) => { ... };  // AWS Lambda entry
```

#### 5. Test Utilities

```typescript
// Only used in test files
export class TestHelper {} // Referenced in *.test.ts
```

#### 6. String-Based References

```javascript
// Accessed via strings or reflection
const fn = functions["dynamicName"];
getattr(obj, "method_name")();
```

### Verification Checklist

For each flagged item, the agent MUST:

1. **Read the flagged code** to understand context
2. **Search for dynamic references**:
    - `import(` or `require(` with variables
    - String interpolation with the item name
    - `eval`, `getattr`, or reflection patterns
3. **Check framework patterns**:
    - React: Is it a component used in JSX?
    - Laravel: Is it resolved by routes, service container, events, jobs, policies, observers, or console commands?
4. **Check for re-exports**:
    - Is this in an index.ts/index.js barrel file?
    - Is this part of the public API?
5. **Check entry points**:
    - Is this a CLI script, serverless handler, or worker?
    - Is it referenced in package.json scripts or config files?

## Workflow

### 1. Run Detection Tool

```bash
# Web dead code scan
cd web && npx knip --reporter json

# Backend conservative scan (reference-based)
grep -Rin "CandidateSymbol" backend/app backend/routes backend/tests
```

### 2. Parse and Categorize

Group findings by type:

- Unused exports
- Unused files
- Unused dependencies
- Unused imports
- Unused class members

### 3. Verify Each Finding

For each item:

1. Read the code
2. Check for false positive patterns
3. Mark as "verified" or "likely false positive"

### 4. Present Verified Report

Show user:

- Summary counts (verified items only)
- Detailed list with file:line references
- Filtered items with reasons

### 5. Apply Fixes (After Approval)

```bash
# Only after user confirms
cd web && npx knip --fix
```

## Integration with Audits

### Quick Check Integration

- Run detection as part of automated checks
- Report findings under "Dead Code" category
- Don't auto-fix; inform user of findings

### Deep Audit Integration

- Run as Phase 2.5: Dead Code Detection
- Include in comprehensive report
- Provide fix commands for user to run

### Standalone `/dead-code` Command

- Focused workflow for dead code only
- Interactive cleanup with user approval
- Show verification process

## Best Practices

1. **Run regularly** - Include in CI/CD pipeline
2. **Configure properly** - Set up ignore rules for framework patterns
3. **Test after removal** - Ensure nothing breaks
4. **Review before commit** - Manual verification recommended
5. **Document exceptions** - Explain why certain "dead" code is intentional
6. **Never remove critical history artifacts blindly** - Avoid deleting migrations, seeders, and public API exports without explicit verification
7. **Start conservative** - Better to miss some than to break things
