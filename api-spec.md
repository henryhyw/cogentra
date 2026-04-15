# API Spec

Primary REST namespaces under `/api/v1`:

- `/auth`
- `/orgs`
- `/members`
- `/templates`
- `/cases`
- `/artifacts`
- `/submissions`
- `/plans`
- `/sessions`
- `/evidence`
- `/decisions`
- `/audit`
- `/analytics`
- `/health`

The FastAPI app publishes an OpenAPI document and exposes backend-first Pydantic DTOs that are mirrored into `packages/types`.

Authentication model:

- Reviewer routes use session-cookie auth plus CSRF protection on mutating requests.
- Student routes use signed session tokens bound to `DefenseSession`.

Audit export:

- JSON bundle with full event stream
- CSV summaries for decisions, competency outcomes, and review actions
