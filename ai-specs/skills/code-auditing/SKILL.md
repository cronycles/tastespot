---
name: code-auditing
description: Use this skill when the user asks for a code audit, code review, technical debt analysis, security review, dead code detection, maintainability assessment, or pre-merge quality verification in TasteSpot.
version: 1.0.0
---

# Code Auditing Skill

Comprehensive methodology for systematic code quality audits in this repository (Laravel API + React/Vite web).

## When to Use

- Comprehensive code quality audits
- Security vulnerability assessments
- Technical debt identification
- Pre-release code reviews
- Best practices verification
- Library and dependency audits
- Requests that explicitly ask for a "review"

## Audit Phases

### Phase 0: Pre-Analysis Setup

1. Read project standards and architecture context first:
    - `docs/project-doc.mdc`
    - `README.md`
2. Identify impacted scope (`backend/`, `web/`, `docs/`, or cross-cutting).
3. Check project tooling/config in impacted scope.
4. Run baseline quality commands when requested or useful:
    - Backend (`backend/`): `composer run pint`, `composer test`
    - Frontend (`web/`): `npm run lint`, `npm run build`

### Phase 1: Discovery

1. Discover relevant files by module/feature.
2. Prioritize changed files first, then adjacent files that affect behavior.
3. Build a short scope map before deep inspection.

### Phase 2: File-by-File Analysis

For each file, analyze for:

- Dead code (unused functions, variables, imports)
- Code smells and anti-patterns
- Security vulnerabilities
- Performance issues
- Outdated patterns or deprecated APIs
- Missing error handling
- Overly complex functions
- Duplicate code
- API contract consistency (request/response format, status codes)
- Ownership/auth checks where applicable

### Phase 3: Best Practices Verification

For every impacted framework/library:

1. Compare implementation with repository standards in `docs/`.
2. Validate against current framework conventions (Laravel 13, React 19, Router 7, Zustand).
3. Flag deprecated or discouraged patterns.

### Phase 4: Pattern Detection

Look for recurring issues:

- Common anti-patterns across files
- Duplicated logic that could be abstracted
- Inconsistent coding styles
- Missing error handling patterns
- Repeated violations of project conventions

### Phase 5: Library Recommendations

For custom implementations:

1. Prefer existing project stack first.
2. Recommend new dependencies only when strictly necessary.
3. Explain cost/benefit and integration impact.

### Phase 6: Comprehensive Report

Generate detailed report with:

- Findings first, ordered by severity
- File-level references and concrete impact
- Residual risks and testing gaps
- Secondary summary and suggested next actions

## Issue Priority Levels

- **Critical** - Security vulnerabilities, broken functionality
- **High Priority** - Performance bottlenecks, unmaintainable code
- **Medium Priority** - Code quality, best practices deviations
- **Low Priority** - Style, minor improvements
- **Quick Wins** - Less than 30 minutes to fix

## Analysis Categories

### Security

- Hardcoded secrets
- SQL injection risks
- XSS vulnerabilities
- Missing input validation
- Exposed sensitive data

### Performance

- Inefficient algorithms
- Blocking operations
- Memory leaks
- Missing caching opportunities
- N+1 query patterns

### TypeScript/Type Safety

- Missing type annotations
- Use of `any` type
- Custom types duplicating official types
- Missing @types packages

### Laravel/API Correctness

- Route protection and `auth:sanctum` usage
- Validation and exception mapping consistency
- Ownership checks for user-scoped resources
- Eager loading and query efficiency

### Async/Promise Issues

- Missing await keywords
- Unhandled promise rejections
- Callback hell

### Dead Code

- Unused imports and exports
- Unused functions, classes, and methods
- Unused variables and types
- Unreachable code blocks
- Unused files (not imported anywhere)
- Unused dependencies

**Tools:**

- JavaScript/TypeScript (web): `cd web && npx knip --reporter json`
- General reference search: `rg` / `grep`

**Important:** Always verify tool findings before reporting. Check for:

- Dynamic imports (`import(variable)`)
- Framework patterns (React components, Laravel route/controller bindings)
- Re-exports for public API
- Entry points (CLI scripts, serverless handlers)

## Resources

See the reference documents for complete methodologies:

- `references/audit-methodology.md` - Full 6-phase audit process with detailed checklists
- `references/dead-code-methodology.md` - Dead code detection tools, verification, and cleanup workflows

## Quick Reference

### Before Starting

- [ ] Read project configuration files
- [ ] Read project standards in `docs/`
- [ ] Run existing linters as baseline
- [ ] Create file tracking list

### During Audit

- [ ] Mark files as in-progress
- [ ] Analyze each category systematically
- [ ] Note specific line numbers
- [ ] Document before/after examples
- [ ] Mark files as completed

### After Audit

- [ ] Present findings ordered by severity
- [ ] Include file-level references and testing gaps
- [ ] Provide a concise change/risk summary after findings
