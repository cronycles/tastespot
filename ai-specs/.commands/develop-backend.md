Please analyze and implement the backend task request: $ARGUMENTS.

Follow these steps:

1. Resolve and read the task request details first (goal, scope, constraints, acceptance criteria).
2. Understand the backend problem and map impacted areas in `backend/` (controllers, models, routes, validations, migrations, tests, and docs).
3. Create or switch to a task branch following this convention:
    - `feature/<task-slug>`
    - Example: `feature/refactor-activity-filters`
4. Implement the task in small incremental steps, following project standards in `docs/tech-doc.mdc`, especially the **backend** standards referenced from that document.
5. Add or update backend tests in `backend/tests/Feature` and `backend/tests/Unit` according to the change scope.
6. Run backend quality gates from `backend/`:
    - `composer run pint`
    - `composer test`
7. If the API exists and behavior changed, update `docs/specific-api-model.yml` when applicable. If the data model changed, update `docs/specific-data-model.md` when applicable. Review `README.md` when relevant.
8. Stage only files related to the task, leaving unrelated working tree changes untouched.
9. Create one descriptive commit message in English.
10. Push the branch and create/update PR with `gh` targeting `develop`.
11. Never merge to `main` from this command. `main` merges are manual and done by the project owner when releasing to production.

Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.
