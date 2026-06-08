---
name: MedaGama Project Rules
description: Complete technical documentation for MedaGama healthcare platform - Laravel + React architecture, 4-level hierarchy system (L1-L4), MedStream social media integration, PremiumGate paywall, and critical implementation rules. Essential for Claude Code to understand project structure and maintain business logic integrity.
---

# MEDAGAMA_RULES.md — Claude Code Skill Documentation

## Project Architecture

**Tech Stack:**
- **Backend:** Laravel 11 (PHP 8.2+) with JWT auth
- **Frontend:** React 19 + Vite + TailwindCSS + Lucide icons
- **Database:** MySQL with UUID primary keys
- **Queue:** Redis for async processing (video thumbnails)
- **Deployment:** Railway (Docker) + Vercel (frontend)

**Core Modules:**
- **MedStream:** Social media platform (posts, comments, likes, bookmarks)
- **PremiumGate:** Paywall system for CRM features
- **Telehealth:** Daily.co + Deepgram integration
- **Multi-language:** i18next (22 languages) + RTL support

## 4-Level Hierarchy System

### Level 1 (L1) — Patients
- Browse clinics/doctors
- Book appointments
- View MedStream feeds
- GDPR data management

### Level 2 (L2) — Doctors
- Public profile with MedStream tab
- Appointment management
- Basic CRM (free tier)
- Telehealth hosting
- **Verification badge** displayed on profile

### Level 3 (L3) — Clinics
- Multi-location via `branches` table
- Public profile with MedStream tab
- Staff management
- **No verification required** (removed logic)
- Appointment booking system

### Level 4 (L4) — Hospitals
- **CRITICAL RULE:** No appointment buttons on main profile
- Only display branch list
- Each branch has its own appointment system
- Admin-level CRM access

## L4 Specific Rule Implementation

```php
// In ClinicController@show
if ($clinic->level === 4) {
    $clinic->hide_appointment_button = true;
    $clinic->show_branches_only = true;
}
```

```javascript
// Frontend ClinicDetailPage.jsx
const showAppointmentButton = apiClinic.level !== 4;
```

## Database Schema: Branches System

### Tables Structure

```sql
-- branches
CREATE TABLE branches (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    coordinates POINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- clinic_branches (Many-to-Many)
CREATE TABLE clinic_branches (
    clinic_id CHAR(36),
    branch_id CHAR(36),
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- doctor_branches (Assignments)
CREATE TABLE doctor_branches (
    doctor_id CHAR(36),
    branch_id CHAR(36),
    schedule JSON, -- Working hours per branch
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);
```

### Relationships

```php
// Clinic.php
public function branches()
{
    return $this->belongsToMany(Branch::class, 'clinic_branches')
        ->withPivot('is_primary')
        ->where('branches.is_active', true);
}

// Branch.php
public function clinics()
{
    return $this->belongsToMany(Clinic::class, 'clinic_branches');
}

// User.php (Doctor)
public function branches()
{
    return $this->belongsToMany(Branch::class, 'doctor_branches')
        ->withPivot('schedule');
}
```

## MedStream Integration Rules

### Profile Feed Filtering

```php
// API Endpoint: GET /api/medstream/posts
// Query Parameters:
// - author_id (for doctor profiles)
// - clinic_id (for clinic profiles)
// - per_page (pagination)

public function posts(Request $request)
{
    $query = MedStreamPost::visible();
    
    if ($request->author_id) {
        $query->where('author_id', $request->author_id);
    }
    
    if ($request->clinic_id) {
        $query->where('clinic_id', $request->clinic_id);
    }
    
    return $query->paginate($request->per_page ?? 10);
}
```

### Frontend Component Usage

```jsx
// DoctorProfile.jsx
<MedstreamProfileFeed authorId={doctorId} />

// ClinicDetailPage.jsx
<MedstreamProfileFeed clinicId={apiClinic?.id} />
```

## PremiumGate Paywall Logic

```javascript
// CRMLayout.jsx
const isPremium = user?.subscription?.plan === 'premium';

const PremiumGate = ({ children }) => {
    if (!isPremium) {
        return <UpgradePrompt />;
    }
    return children;
};

// Premium Features (Gated)
<PremiumGate>
    <CRMRevenue />
    <CRMPrescriptions />
    <CRMReports />
    <CRMBulkMessaging />
</PremiumGate>

// Free Features (Always Available)
<AppointmentsManagement />
<PatientRecords />
<BasicTelehealth />
<MedStreamPosting />
```

## Technical Standards

### Code Style

**PHP/Laravel:**
- Use UUID primary keys (`HasUuids` trait)
- Follow PSR-12 coding standard
- Use type hints for all methods
- Model properties: `$fillable`, `$casts`, `$hidden`
- API resources for data transformation

```php
class ExampleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = ExampleModel::query()
            ->with(['relation'])
            ->paginate($request->per_page ?? 15);
            
        return ExampleResource::collection($data);
    }
}
```

**JavaScript/React:**
- Functional components with hooks
- TypeScript-style prop comments
- Custom hooks for complex logic
- Optimistic UI patterns

```jsx
// Custom Hook Example
const useMedstreamFeed = ({ authorId, clinicId }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (authorId) params.author_id = authorId;
            if (clinicId) params.clinic_id = clinicId;
            
            const response = await medStreamAPI.posts(params);
            setPosts(response.data);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setLoading(false);
        }
    }, [authorId, clinicId]);
    
    return { posts, loading, loadPosts };
};
```

### Migration Rules

1. **Use UUID primary keys**
2. **Foreign key constraints** with `onDelete('cascade')`
3. **Timestamps** on all tables
4. **Soft deletes** where appropriate
5. **Index** frequently queried columns

```php
Schema::create('example_tables', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('foreign_id');
    $table->string('name');
    $table->json('metadata')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();
    
    $table->foreign('foreign_id')
          ->references('id')
          ->on('foreign_table')
          ->onDelete('cascade');
          
    $table->index(['foreign_id', 'is_active']);
});
```

### Folder Structure

```
backend/
├── app/
│   ├── Http/Controllers/Api/
│   ├── Models/
│   ├── Services/
│   ├── Jobs/
│   └── Http/Middleware/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
└── tests/

src/
├── components/
│   ├── common/
│   ├── forms/
│   ├── profile/
│   └── timeline/
├── context/
├── hooks/
├── pages/
├── lib/
└── utils/
```

## Critical Implementation Rules

### 1. No Appointment Buttons on L4 Profiles
```jsx
// ClinicDetailPage.jsx - ALWAYS check this
{apiClinic.level !== 4 && (
    <BookAppointmentButton clinicId={apiClinic.id} />
)}
```

### 2. Branch Display for L4
```jsx
// L4 clinics show branches list instead of appointment booking
{apiClinic.level === 4 ? (
    <BranchesList branches={apiClinic.branches} />
) : (
    <AppointmentBooking />
)}
```

### 3. MedStream Filtering
```php
// Always filter by author_id OR clinic_id, never both
// Author posts go to doctor profiles
// Clinic posts go to clinic profiles
```

### 4. PremiumGate Implementation
```jsx
// Check subscription before rendering premium features
const canAccessPremium = user?.subscription?.plan === 'premium';
```

## Environment Variables

```bash
# Required
REACT_APP_API_BASE=http://127.0.0.1:8001/api
JWT_SECRET
DB_CONNECTION=mysql

# Optional (Telehealth)
DAILY_API_KEY=
DAILY_BASE_URL=
DAILY_DOMAIN=
DEEPGRAM_API_KEY=
DEEPGRAM_BASE_URL=

# Queue (for video processing)
QUEUE_CONNECTION=redis
```

## Deployment Commands

```bash
# Backend
php artisan migrate
php artisan queue:work
php artisan config:cache

# Frontend
npm run build
npm run preview
```

## Testing Rules

1. **Unit Tests** for all Services and Models
2. **Feature Tests** for all API endpoints
3. **Component Tests** for critical React components
4. **Browser Tests** for user flows

```bash
# Run tests
php artisan test
npm run test
```

---

**Claude Code:** Follow these rules strictly when modifying the MedaGama project. The 4-level hierarchy and L4 appointment rule are critical business logic that must never be violated.
