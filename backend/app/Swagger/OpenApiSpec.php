<?php

namespace App\Swagger;

use OpenApi\Attributes as OA;

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  MedGama API — OpenAPI 3.0 Specification                       ║
 * ║  GDPR / KVKK / HIPAA Compliant Telehealth Platform             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
#[OA\Info(
    version: '1.0.0',
    title: 'MedGama Telehealth API',
    description: <<<'DESC'
## MedGama — Professional Telehealth Platform API

### Authentication
All protected endpoints require a **Bearer token** via the `Authorization` header.
Obtain a token from `POST /api/auth/login`.

### Compliance & Security Notes
- **Encryption at Rest (AES-256-CBC):** All sensitive health data fields (`doctor_note`, `confirmation_note`, `answers`, `medical_history`, `description`) are encrypted using Laravel's Encrypted Casts with the application's `APP_KEY`. Data is stored as ciphertext in the database and automatically decrypted when accessed through Eloquent models.
- **Health Data Audit Logging (HIPAA §164.312):** Every access to patient health data (appointments, patient records, digital anamnesis) is recorded in the `health_data_audit_logs` table with: accessor ID, patient ID, resource type, resource ID, IP address, user agent, and timestamp.
- **GDPR Art. 5(1)(e) — Data Retention:** Soft-deleted records are permanently pruned after their legal retention period expires (User: 3 years, Health data: 10 years) via Laravel's `MassPrunable` trait, scheduled daily at 03:00.
- **GDPR Art. 17 — Right to Erasure:** Account deletion soft-deletes user data. After the retention period, `model:prune` permanently removes it.
- **GDPR Art. 20 — Data Portability:** `GET /api/auth/profile/data-export` provides a full JSON export of all personal data.
- **KVKK Art. 7 — Data Destruction:** Aligned with GDPR pruning schedule.

### Error Response Format (Global)
All API errors return a consistent JSON structure:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

| HTTP | Code | Description |
|------|------|-------------|
| 401 | UNAUTHENTICATED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | RESOURCE_NOT_FOUND | Model not found |
| 422 | VALIDATION_ERROR | Validation failed (includes `errors` object) |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | DATABASE_ERROR | Database query failure |
| 500 | INTERNAL_ERROR | Unexpected server error |

### WebSocket Events (Laravel Broadcasting)
| Channel | Event | Payload |
|---------|-------|---------|
| `private-chat.{conversationId}` | `message.sent` | ChatMessageResource |
| `private-chat.{conversationId}` | `user.typing` | `{user_id, user_name, is_typing}` |
DESC,
    contact: new OA\Contact(name: 'MedGama Dev Team', email: 'dev@medgama.com'),
)]
#[OA\Server(url: 'http://127.0.0.1:8001/api', description: 'Local Development')]
#[OA\Server(url: 'https://api.medgama.com/api', description: 'Production')]
#[OA\SecurityScheme(
    securityScheme: 'sanctum',
    type: 'apiKey',
    name: 'Authorization',
    in: 'header',
    description: 'Enter token in format: Bearer {token}'
)]

// ═══════════════════════════════════════
// REUSABLE SCHEMAS
// ═══════════════════════════════════════
#[OA\Schema(
    schema: 'ErrorResponse',
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: false),
        new OA\Property(property: 'message', type: 'string', example: 'You are not authorized.'),
        new OA\Property(property: 'code', type: 'string', example: 'FORBIDDEN'),
    ]
)]
#[OA\Schema(
    schema: 'ValidationErrorResponse',
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: false),
        new OA\Property(property: 'message', type: 'string', example: 'Validation failed.'),
        new OA\Property(property: 'code', type: 'string', example: 'VALIDATION_ERROR'),
        new OA\Property(property: 'errors', type: 'object', example: '{"email": ["The email field is required."]}'),
    ]
)]
#[OA\Schema(
    schema: 'UserSummary',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'fullname', type: 'string'),
        new OA\Property(property: 'avatar', type: 'string', nullable: true),
    ]
)]
#[OA\Schema(
    schema: 'PaginationMeta',
    properties: [
        new OA\Property(property: 'current_page', type: 'integer'),
        new OA\Property(property: 'last_page', type: 'integer'),
        new OA\Property(property: 'per_page', type: 'integer'),
        new OA\Property(property: 'total', type: 'integer'),
    ]
)]

// ═══════════════════════════════════════
// TAGS
// ═══════════════════════════════════════
#[OA\Tag(name: 'Auth', description: 'Authentication, profile, verification')]
#[OA\Tag(name: 'Appointments', description: 'Appointment CRUD (HIPAA-audited)')]
#[OA\Tag(name: 'Chat', description: 'Real-time 1:1 doctor-patient messaging')]
#[OA\Tag(name: 'MedStream', description: 'Social feed — posts, comments, likes')]
#[OA\Tag(name: 'Notifications', description: 'In-app notification management')]
#[OA\Tag(name: 'Patient Records', description: 'Lab results, reports (encrypted, audited)')]
#[OA\Tag(name: 'Digital Anamnesis', description: 'Health questionnaire (encrypted at rest)')]
#[OA\Tag(name: 'CRM', description: 'Doctor/clinic CRM — tags, stages')]
#[OA\Tag(name: 'Catalog', description: 'Public lookup data')]
#[OA\Tag(name: 'Doctors', description: 'Public doctor listing')]
#[OA\Tag(name: 'Calendar Slots', description: 'Doctor availability management')]
class OpenApiSpec {}
