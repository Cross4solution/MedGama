# Project Handover Summary — MedaGama Platform

## Current Status

### Backend Changes (Recent Commits)

**Migrations & Models:**
- `2026_03_15_140000_add_telehealth_columns_to_appointments.php` — Added meeting_id, meeting_url, meeting_status for telehealth
- `2026_03_16_180000_create_allergies_and_medications_tables.php` — Centralized catalog with translations (JSONB)
- `2026_03_19_170000_create_favorites_table.php` — Polymorphic favorites (doctor/clinic) with auto-migration
- `2026_03_20_170000_create_branches_tables.php` — Multi-location clinic support
- `2026_03_21_170000_create_medstream_tables.php` — Complete social media platform (posts, comments, likes, bookmarks, reports)

**Controllers & Services:**
- **MedStreamController** — Full CRUD with engagement counters, polymorphic filtering
- **TelehealthController** — Daily.co integration + Deepgram transcription simulation
- **CatalogController** — Unified search endpoint for diseases, allergies, medications
- **SocialController** — Polymorphic favorites (toggle, list, count)
- **MediaOptimizer** — FFmpeg video processing + thumbnail generation
- **MedStreamService** — Business logic for posts, feed, engagement scoring

**Middleware:**
- **SetLocale** — Accept-Language header + query param locale detection
- **Rate limiting** — API endpoints protected

### Frontend Changes (Recent Commits)

**New Components:**
- `src/components/profile/MedstreamProfileFeed.jsx` — Profile-specific Medstream feed with video player
- `src/components/forms/GlobalSuggest.jsx` — Centralized autocomplete with tag system
- `src/context/FavoritesContext.jsx` — Global favorites state management
- `src/context/CookieConsentContext.jsx` — GDPR granular consent management

**Updated Pages:**
- **DoctorProfile.jsx** — Added Medstream tab + hero background image with overlay
- **ClinicDetailPage.jsx** — Added Medstream tab integration
- **CRMTelehealth.jsx** — Full telehealth room with video/chat/transcript
- **BrowseClinics.jsx** / **BrowseTreatments.jsx** — New browsing interfaces

**State Management:**
- **useSocial hook** — Optimistic UI for favorites with localStorage fallback
- **useTelehealth hook** — Session management + transcription polling
- **i18n system** — 22 languages, RTL support, backend locale middleware

## Hierarchy & Logic

### Level System (L2-L4)

**L2 — Doctors:**
- Public profile pages with Medstream tab
- Verification status displayed (badge)
- No paywall restrictions

**L3 — Clinics:**
- Multi-location support via `branches` table
- **Removed verification logic** — Clinics no longer require verification
- Public profiles with Medstream tab (clinic_id filtered posts)

**L4 — Patients:**
- Full access to browse, book, view profiles
- GDPR compliance tools (data export, consent management)

### CRM Paywall (PremiumGate)

**Technical Implementation:**
```javascript
// CRMLayout.jsx
const isPremium = user?.subscription?.plan === 'premium';
const PremiumGate = ({ children }) => {
  if (!isPremium) return <UpgradePrompt />;
  return children;
};

// Protected routes
<PremiumGate>
  <CRMRevenue />
  <CRMPrescriptions />
  <CRMReports />
</PremiumGate>
```

**Premium Features:**
- Revenue analytics
- Prescription management
- Advanced reporting
- Bulk messaging

**Free Tier:**
- Appointments management
- Patient records
- Basic telehealth
- MedStream posting

## MedStream Integration

### Profile Feed Component

**MedstreamProfileFeed.jsx:**
```javascript
// Props: authorId | clinicId
const { posts, loading, loadMore } = useMedstreamFeed({ authorId, clinicId });

// PostCard Features:
- Video player with thumbnail + custom play button
- Like/Comment/Bookmark/Share (optimistic UI)
- Pagination with "Load More"
- Skeleton loading states
```

### Backend Filtering

**API Endpoint:**
```
GET /api/medstream/posts?author_id={uuid}&clinic_id={uuid}&per_page=10
```

**Controller Logic:**
```php
public function posts(Request $request) {
    $query = MedStreamPost::visible();
    if ($request->author_id) $query->where('author_id', $request->author_id);
    if ($request->clinic_id) $query->where('clinic_id', $request->clinic_id);
    return $query->paginate($request->per_page ?? 10);
}
```

### Video Processing Pipeline

**FFmpeg Integration:**
```php
// MediaOptimizer::processVideoFromPath()
$cmd = escapeshellcmd($ffmpeg) . ' -i ' . escapeshellarg($videoPath)
    . ' -ss 00:00:01 -vframes 1 -vf scale=720:-1 -q:v 4 '
    . escapeshellarg($thumbPath) . ' -y';
```

**Frontend VideoPlayer:**
```javascript
// Fallback when no thumbnail
<video src={`${rawSrc}#t=0.5`} preload="metadata" />
// Uses direct storage URL with #t=0.5 for frame capture
```

## Database Schema Changes

### New Tables

**Branches System:**
- `branches` — Clinic locations (address, contact, coordinates)
- `clinic_branches` — Many-to-many relationship
- `doctor_branches` — Doctor assignments to branches

**MedStream Platform:**
- `med_stream_posts` — Social media posts (polymorphic author)
- `med_stream_comments` — Nested comment system
- `med_stream_likes` — Like/unlike tracking
- `med_stream_bookmarks` — Polymorphic bookmarks
- `med_stream_reports` — Content moderation
- `med_stream_engagement_counters` — Cached counts

**Catalog System:**
- `allergies` — Translatable allergy catalog
- `medications` — Translatable medication catalog
- **Replaced ICD-10** with Treatment Tags system

### Treatment Tags Migration

**From:** ICD-10 diagnosis codes
**To:** Custom treatment tags with translations
```php
// HasTranslations trait
protected $translatable = ['name', 'description'];
```

## Critical Files for Review

### Backend Core
```
backend/app/Services/MedStreamService.php
backend/app/Services/MediaOptimizer.php
backend/app/Http/Controllers/Api/MedStreamController.php
backend/app/Http/Controllers/Api/TelehealthController.php
backend/app/Models/MedStreamPost.php
backend/database/migrations/2026_03_21_170000_create_medstream_tables.php
```

### Frontend Core
```
src/components/profile/MedstreamProfileFeed.jsx
src/components/timeline/TimelineCard.jsx
src/components/forms/GlobalSuggest.jsx
src/context/FavoritesContext.jsx
src/pages/DoctorProfile.jsx
src/pages/ClinicDetailPage.jsx
src/hooks/useSocial.js
src/lib/api.js (medStreamAPI section)
```

### Configuration
```
backend/config/services.php (daily, deepgram)
backend/routes/api.php (medstream, telehealth)
src/i18n/locales/en.json (medstream keys)
```

## Environment Variables Required
```
# Telehealth
DAILY_API_KEY=
DAILY_BASE_URL=
DAILY_DOMAIN=
DEEPGRAM_API_KEY=
DEEPGRAM_BASE_URL=

# Queue (for video processing)
QUEUE_CONNECTION=redis
```

## Deployment Notes

**Railway Configuration:**
- Root Directory: `/backend`
- Builder: `DOCKERFILE`
- Start Command: `/entrypoint.sh`
- Redis environment mapping (REDISHOST → REDIS_HOST)

**Video Processing:**
- Requires FFmpeg installation (`which ffmpeg`)
- Queue worker for async processing
- Thumbnail storage: `/storage/medstream/videos/{id}_thumb.jpg`

This handover provides the complete technical state for Antigravity to continue development seamlessly.
