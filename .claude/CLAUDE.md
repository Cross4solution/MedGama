# MedaGama — Claude Code Rules

## Stack
- **Frontend:** React 19 (CRA / react-scripts), TailwindCSS, Lucide icons, React Router v6
- **Backend:** Laravel 11, PHP 8.3, Sanctum auth, Supervisor (nginx + php-fpm in one container)
- **Database:** TiDB Cloud (MySQL-compatible, port 4000, SSL required) — PostgreSQL locally
- **Deploy:** Render (Docker, `dockerContext: ./`) + Vercel (frontend)
- **Queue:** Redis (optional, falls back to sync on Free Tier)

## Repo Layout
```
MedGama/
├── backend/          Laravel app
│   ├── docker/       entrypoint.sh, nginx.conf, supervisord.conf, php-fpm-pool.conf
│   ├── Dockerfile    multi-stage; Stage 1=composer, Stage 2=php-fpm-alpine
│   └── routes/api.php
└── src/              React app (CRA)
    ├── components/
    ├── context/AuthContext.jsx
    ├── lib/api.js    all axios API modules
    ├── pages/
    └── utils/authRedirect.js
```

**Worktree:** `/Users/oguzhan/Documents/MedGama/.claude/worktrees/vigilant-aryabhata`
After every file edit in main repo, sync: `cp <file> .claude/worktrees/vigilant-aryabhata/<file>`

## Role Hierarchy
| role_id | Level | Notes |
|---------|-------|-------|
| `patient` | L1 | Email verification required on register |
| `doctor` | L2 | Email verification required on register |
| `clinicOwner` / `clinic` | L3 | Auto-verified on register, no email check |
| `hospital` | L4 | Auto-verified, CRM always active, no appointment buttons |
| `superAdmin` / `saasAdmin` | L5 | Full access |

## Critical Business Rules

### Login Flow
- **Login NEVER redirects to email verification** — all roles get token immediately
- Email verification only shows during Register (patient/doctor only)
- Hospital + clinic/clinicOwner → auto-verified on register AND login
- `getRedirectFromLoginResult()` → all roles land on `/medstream`

### CRM / isPro Gate (SidebarPatient.jsx)
- **Hospital (L4):** CRM button always active, displayed at TOP of sidebar
- **Doctor/Clinic + isPro=true:** Active CRM button at bottom
- **Doctor/Clinic + isPro=false:** Locked dashed button → upgrade modal → `/crm/upgrade`
- Backend: `CheckCrmAccess` middleware checks `is_crm_active + crm_expires_at`
- `hasCrmSubscription()` in User model → returned as `has_crm_subscription` in UserResource

### URLs
- `/medstream` = canonical (ExploreTimeline) — was `/explore`
- `/explore` → redirects to `/medstream`
- Hospital login: `/hospital-login`

### Migrations — TiDB Compatibility Rules
1. **No `TEXT`/`JSON` column with `->default('')`** — use `->nullable()` instead
2. **No `DROP CONSTRAINT IF EXISTS`** — use `MODIFY COLUMN ENUM(...)` for MySQL
3. **No `~` regex operator** — use `REGEXP` for MySQL; wrap in `if ($driver === 'pgsql')`
4. **No TEXT in UNIQUE/INDEX** — use `varchar` for indexable fields
5. **No `INSERT IGNORE`** on PostgreSQL — add driver guard if needed locally
6. Always wrap PostgreSQL-specific SQL: `$driver = DB::connection()->getDriverName()`

## Key Files
| File | Purpose |
|------|---------|
| `src/utils/authRedirect.js` | `getRedirectForRole(roleId)` — role→URL mapping |
| `src/context/AuthContext.jsx` | `isPro` computed from `user.has_crm_subscription` |
| `src/components/SidebarPatient.jsx` | CrmSection: hospital top / pro bottom / locked modal |
| `backend/app/Services/AuthService.php` | register + login logic, email verification |
| `backend/app/Services/MedStreamService.php` | listPosts, engagement, bookmarks |
| `backend/routes/api.php` | `/api/system/init-db?key=MedaGama2026SecretInit&fresh=1` |
| `backend/docker/entrypoint.sh` | runs `migrate:fresh --force --seed` on container start |
| `backend/database/seeders/DatabaseSeeder.php` | 5 hospitals, 5 clinics, 5 doctors, 5 patients, 10 posts |

## Database Seeder (demo data)
- Hospitals: Medipol İstanbul, Florence Nightingale, Memorial, Acıbadem, Bayındır
- Clinics: MedaGama, Elite Dental, Vision Eye, Life Ortopedi, Prime Cardio
- Doctors: Kardiyoloji, Göz, Diş, Ortopedi, Girişimsel (with full DoctorProfile)
- 10 MedStream posts: 3 video (YouTube), 4 image (Unsplash), 3 text
- All passwords: `Password123!`

## Emergency DB Reset (Render)
```
GET https://medagama-backend.onrender.com/api/system/init-db?key=MedaGama2026SecretInit&fresh=1
```
Returns JSON with migrate output, seed output, and table counts.

## Git Workflow
- Branch: `new-development` → pushes to `main` via `git push origin new-development:main`
- Remote: `https://github.com/Cross4solution/MedGama.git`
