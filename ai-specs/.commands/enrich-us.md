# Status

This command is currently **not usable in this project**.

# Why

The original command depends on Jira and User Story workflow operations that are not used in this personal project.

# Agent-first behavior

When this command is invoked:

1. Clearly state that Jira-based enrichment is disabled in this repository.
2. Suggest using task-based planning commands instead:
    - `/plan-backend-ticket` for backend tasks
    - `/plan-frontend-ticket` for frontend tasks
3. If the user still wants help, ask for a plain task description and redirect execution to the appropriate task-based plan/develop flow.

# Notes

- Do not attempt Jira MCP calls from this command.
- Do not attempt ticket transitions or User Story enrichment workflows.
