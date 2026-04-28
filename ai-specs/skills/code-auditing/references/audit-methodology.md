# Code Audit Methodology

This document provides a comprehensive, systematic approach to code quality auditing for TasteSpot.

## Phase 0: Pre-Analysis Setup

Before analyzing code, establish the context:

### 1. Project Configuration

- **Stack and scopes**:
    - Backend: Laravel API in `backend/`
    - Frontend: React + TypeScript app in `web/`
- **Project docs first**:
    - `docs/project-doc.mdc`
    - `README.md`

### 2. Baseline Checks

Run existing linting and testing:

```bash
# Backend
cd backend && composer run pint && composer test

# Frontend
cd web && npm run lint && npm run build
```

Document existing errors/warnings as baseline.

## Phase 1: Discovery

### File Identification

Find all code files by type:

```
*.js, *.ts, *.jsx, *.tsx  (JavaScript/TypeScript)
*.py                       (Python)
*.java                     (Java)
*.go                       (Go)
*.rs                       (Rust)
*.rb                       (Ruby)
```

For this repository, prioritize:

- `backend/app/**`, `backend/routes/**`, `backend/tests/**`
- `web/src/**`
- `docs/**` when behavior/contracts are changed

### Organization

- Group files by module/feature for contextual analysis
- Create a tracking list for systematic progress
- Prioritize core business logic over utilities

## Phase 2: File-by-File Analysis

For each file, analyze for the following categories:

### Dead Code

- Unused functions and methods
- Unused variables and imports
- Unreachable code blocks
- Commented-out code
- Deprecated features still present

### Code Smells & Anti-Patterns

- Functions longer than 50 lines
- High cyclomatic complexity (> 10)
- Deeply nested conditionals (> 3 levels)
- Magic numbers without constants
- Copy-paste code duplication
- God objects/functions doing too much
- Long parameter lists (> 5 params)

### Security Vulnerabilities

- Hardcoded secrets, API keys, passwords
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting) risks
- Command injection risks
- Missing input validation
- Information disclosure in errors

### Performance Issues

- O(n²) or worse algorithms in hot paths
- Missing database indexes
- N+1 query patterns
- Unnecessary synchronous operations
- Large memory allocations in loops
- Blocking I/O in async contexts

### TypeScript/Type Safety Issues

- Missing type annotations
- Excessive use of `any` type
- Type assertions that could be avoided
- Custom types duplicating official @types/\* packages
- Missing null/undefined checks

### Async/Promise Issues

- Missing `await` keywords
- Unhandled promise rejections
- Callback hell that should use async/await
- Fire-and-forget promises without error handling

### Memory Leaks

- Event listeners not removed on cleanup
- Timers (setInterval, setTimeout) not cleared
- Large objects retained unnecessarily
- Closures holding references too long
- DOM references kept after element removal

### Error Handling

- Empty catch blocks
- Catch-and-ignore patterns
- Missing try/catch in async code
- Inconsistent error types
- Generic error messages hiding root cause

### Laravel/API Contract Checks

- Route versioning and endpoint consistency under `/api/v1`
- Correct auth protection on private endpoints
- Validation failures mapped correctly (422 + errors payload)
- Not-found/auth exceptions mapped consistently
- Ownership checks on user-scoped resources

## Phase 3: Best Practices Verification

### Cross-Reference Findings

- Compare actual implementation vs repository standards in `docs/`
- Identify deviations from recommended patterns
- Note outdated patterns that need modernization
- Flag anti-patterns explicitly discouraged in project standards

## Phase 3.5: TypeScript Types Verification

For TypeScript projects, perform additional type analysis:

### Check for Duplicate Types

Search for custom interfaces that mirror official types:

- React types (React.FC, React.Component, event types)
- Node.js types (Buffer, Process, Global)
- DOM types (HTMLElement, Event types)
- Popular library types already available in the stack

### Verify @types Packages

```bash
# Check if official types exist
npm view @types/[library] types

# Verify installed @types versions
npm ls @types/*
```

### Common Issues

- Custom event types when React provides them
- Duplicating `@types/node` built-in types

## Phase 4: Pattern Detection

Look for recurring issues across the codebase:

### Cross-File Patterns

- Same anti-pattern repeated in multiple files
- Duplicated utility functions
- Inconsistent error handling approaches
- Different coding styles in different modules

### Abstraction Opportunities

- Repeated code that could be a utility function
- Common patterns that could be hooks (React)
- Cross-cutting concerns needing middleware

### Inconsistencies

- Mixed async styles (callbacks, promises, async/await)
- Inconsistent naming conventions
- Different error handling strategies
- Varying code organization patterns

## Phase 5: Library Recommendations

For custom implementations, find mature replacements:

### Discovery Process

1. **Check existing project libraries first** - Verify if current stack already provides needed functionality
2. **Search package registries** - npm, PyPI, crates.io, etc.
3. **Verify library health**:
    - Recent commits (active development)
    - Open issues (responsiveness)
    - Download stats (community adoption)
    - Security advisories (vulnerability history)

### Evaluation Criteria

- **Maintenance**: Last commit < 6 months
- **Adoption**: Significant download/star count
- **Security**: No unaddressed vulnerabilities
- **Bundle size**: Important for frontend code
- **API stability**: Semantic versioning, migration guides
- **Documentation**: Clear examples and API docs

### Common Replacements

| Custom Implementation | Recommended Library                          |
| --------------------- | -------------------------------------------- |
| Date manipulation     | date-fns, dayjs                              |
| HTTP client           | Keep project wrapper in `web/src/lib/api.ts` |
| Form validation       | zod, yup                                     |
| State management      | zustand, jotai                               |
| Deep cloning          | lodash/cloneDeep, structuredClone            |
| UUID generation       | uuid, nanoid                                 |
| Retry logic           | p-retry, async-retry                         |

## Phase 6: Report Generation

### Report Structure

#### Executive Summary (2-3 paragraphs)

- Total files analyzed
- High-level findings overview
- Key risks and recommendations

#### Findings (Order by Severity)

For each:

- File path and line number
- Issue description
- Security/stability impact
- Effort estimate

Severity buckets:

- Critical
- High
- Medium
- Low

#### Library Recommendations

For each suggested replacement:

- Current custom code location
- Recommended library
- Migration effort
- Bundle size impact

#### Quick Wins

Low-effort, high-value fixes:

- < 30 minutes to implement
- High impact on quality/security

#### Action Plan

Prioritized steps with:

- Effort estimates (S/M/L/XL)
- Dependencies between tasks
- Suggested sprint allocation
- Explicit testing and verification steps

### Report Format Requirements

Each issue should include:

````markdown
### [PRIORITY] Issue Title

**Location:** `src/auth/login.js:42`

**Problem:**
Description of the issue and why it matters.

**Before:**

```javascript
// problematic code
```
````

**After:**

```javascript
// fixed code
```

**Effort:** S (< 30 min) | M (1-4 hours) | L (4-8 hours) | XL (> 8 hours)

````

## Tool Usage Reference

### Project Checks
```bash
# Backend quality baseline
cd backend && composer run pint && composer test

# Frontend quality baseline
cd web && npm run lint && npm run build
````

## Common Pitfalls to Avoid

1. **Don't rely on assumptions** - Always verify with documentation
2. **Don't suggest outdated patterns** - Check current best practices
3. **Don't recommend unmaintained libraries** - Verify activity
4. **Don't ignore project conventions** - Respect `docs/tech-doc.mdc` and area standards
5. **Don't break functionality** - Ensure fixes are safe
6. **Don't over-engineer** - Consider cost/benefit ratio
7. **Don't skip TypeScript type checks** - Types are documentation
8. **Don't ignore bundle size** - Frontend performance matters

## Performance Optimization

For large codebases:

- **Parallel processing**: Analyze multiple files simultaneously
- **Batch operations**: Group similar checks together
- **Selective scanning**: Focus on changed files first
- **Cache documentation context**: Reuse findings from `docs/` and prior checks
- **Progressive reporting**: Provide interim results
