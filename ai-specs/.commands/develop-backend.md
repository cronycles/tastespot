Please analyze and fix the Jira ticket: $ARGUMENTS.

Follow these steps:

1. Resolve and read the Jira ticket details first (summary, description, acceptance criteria, status, dependencies).
2. Understand the backend problem and map impacted areas in `backend/` (controllers, models, routes, validations, migrations, tests, and docs).
3. Create or switch to a branch that follows the team convention:
    - `feature/ID-TAREA_resumen-corto`
    - Example: `feature/RBW-8896_refactor_activity_filters`
4. Implement the ticket in small incremental steps, following project standards in `docs/base-standards.mdc` and `docs/backend-standards.mdc`.
5. Add or update backend tests in `backend/tests/Feature` and `backend/tests/Unit` according to the change scope.
6. Run backend quality gates from `backend/`:
    - `composer run pint`
    - `composer test`
7. If API behavior changed, update `docs/api-spec.yml`; if data model changed, update `docs/data-model.md`; review `README.md` when relevant.
8. Stage only files related to the ticket, leaving unrelated working tree changes untouched.
9. Create one descriptive commit message in English.
10. Push the branch and create/update PR with `gh`, referencing the Jira ID in title/body.

Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.
