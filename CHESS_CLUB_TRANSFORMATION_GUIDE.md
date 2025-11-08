# Chess Club Website - Transformation Guide

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Access Control](#user-roles--access-control)
3. [Authentication System Changes](#authentication-system-changes)
4. [First-Time Owner Setup](#first-time-owner-setup)
5. [Admin Management System](#admin-management-system)
6. [Event System Changes](#event-system-changes)
7. [Search & Filtering](#search--filtering)
8. [Dashboard Improvements](#dashboard-improvements)
9. [Implementation Plan](#implementation-plan)
10. [File Changes Checklist](#file-changes-checklist)
11. [Database Schema Changes](#database-schema-changes)
12. [Security Rules Updates](#security-rules-updates)

---

## Overview

### Purpose
Transform the Local Events platform into a Chess Club event management system where:
- **Owner**: Chess club owner who manages admins and creates events
- **Admins**: Selected students who can create and manage events
- **Users/Attendees**: Regular users who can browse and register for chess club events **WITHOUT needing to sign in**

### Key Differences from Original Platform

| Feature | Original | Chess Club |
|---------|----------|------------|
| **Authentication** | Google OAuth + Email | Email/Password only (Admin/Owner only) |
| **User Roles** | User, Organization, Admin | Admin, Owner (no public user accounts) |
| **Public Access** | Requires login for some features | **No login required** - browse & register freely |
| **Event Creation** | Any authenticated user | Owner + Admins only |
| **Categories** | 8 categories (Music, Food, etc.) | Keep for now (will remove later) |
| **Admin Management** | Not available | Owner can manage admins |
| **Public Registration** | Yes (with account) | Yes (**without account** - anonymous registration) |
| **Search** | Title, description, category | Title, description, location, date |
| **Login Purpose** | For all users | **Only for Admins and Owners** |

---

## User Roles & Access Control

### Role Hierarchy

```
Owner (Highest)
  ├── Full system access
  ├── Admin management (promote/demote admins)
  ├── Event creation/editing
  └── All admin capabilities

Admin
  ├── Event creation/editing
  ├── View registrations for their events
  └── Manage assigned events

Public Users (No Account Required)
  ├── Browse events (no login needed)
  ├── Register for events (no login needed)
  └── Anonymous registration (name, email, etc. in registration form)
```

**Important**: Regular users/attendees do NOT need accounts. They can browse and register anonymously.

### UserRole Enum Changes

**Current** (`src/lib/models/user.ts`):
```typescript
enum UserRole {
  USER = 'user',
  ORGANIZATION = 'organization',
  ADMIN = 'admin'
}
```

**New**:
```typescript
enum UserRole {
  ADMIN = 'admin',     // Chess club admin (can create events)
  OWNER = 'owner'      // Chess club owner (can manage admins + create events)
  // Note: No USER role - public users don't need accounts
}
```

### Access Control Matrix

| Action | Owner | Admin | Public User (No Login) |
|--------|-------|-------|------------------------|
| Browse events | ✅ | ✅ | ✅ (no login required) |
| Register for events | ✅ | ✅ | ✅ (no login required - anonymous) |
| Create events | ✅ | ✅ | ❌ |
| Edit any event | ✅ | ✅ (own events) | ❌ |
| Delete events | ✅ | ✅ (own events) | ❌ |
| Manage admins | ✅ | ❌ | ❌ |
| View all registrations | ✅ | ✅ (own events) | ❌ |
| Approve/reject registrations | ✅ | ✅ (own events) | ❌ |
| Sign up for admin account | ✅ | ❌ | ✅ (can sign up, then owner promotes) |

---

## Authentication System Changes

### Removed Features
- ❌ Google OAuth sign-in
- ❌ Google sign-in button
- ❌ OAuth redirect handling
- ❌ Google provider configuration
- ❌ Public user accounts (users don't need to sign in)

### Kept Features
- ✅ Email/password sign-up (**Admin/Owner only**)
- ✅ Email/password sign-in (**Admin/Owner only**)
- ✅ Email verification
- ✅ Password reset (if exists)
- ✅ Protected routes (for admin/owner only)

### Important: Public Access
- ✅ **No authentication required** for browsing events
- ✅ **No authentication required** for event registration
- ✅ Registration form collects: Name, Email, Phone, etc. (no account needed)
- ✅ All public pages accessible without login

### Modified Components

#### 1. AuthContext (`src/lib/context/AuthContext.tsx`)
**Changes**:
- Remove `signInWithGoogle()` method
- Remove Google OAuth provider imports
- Remove redirect result handling for OAuth
- Keep email/password authentication only
- **Remove default USER role** - new sign-ups should have no role initially (owner will promote)
- Only create user document if signing up as admin/owner candidate

#### 2. LoginButton (`src/components/auth/LoginButton.tsx`)
**Action**: DELETE this component (no longer needed)

#### 3. Login Page (`src/app/login/page.tsx`)
**Changes**:
- **Add prominent message**: "This login is for Admins and Owners only. Regular users can browse and register for events without signing in."
- Remove Google sign-in button
- Remove "Continue with Google" option
- Keep only email/password form
- Simplify UI (no divider needed)
- Update text: 
  - "Admin/Owner Sign In" 
  - "Sign up to become an Admin" (with note that owner will approve)
- **Add info box**: "Not an admin? You can browse and register for events without signing in."

#### 4. AuthProvider (`src/components/auth/AuthProvider.tsx`)
**Changes**: No changes needed (wrapper component)

#### 5. Header Component (`src/components/layout/Header.tsx`)
**Changes**:
- **Remove "Sign in" button for public users** (or make it very small/inconspicuous)
- **Remove "Create Event" button** (only show for authenticated admin/owner)
- Keep search bar (public access)
- Show user menu only for authenticated admin/owner

#### 6. Event Registration Form (`src/components/events/EventRegistrationForm.tsx`)
**Changes**:
- **Remove authentication requirement**
- Allow anonymous registration
- Collect: First Name, Last Name, Email, Phone (no account needed)
- Registration works without login

### Authentication Flow

**Sign Up (Admin Candidate)**:
1. User clicks "Sign up to become an Admin"
2. User enters: First name, Last name, Email, Password
3. Create Firebase account
4. Create user document with **NO role** (or pending role)
5. Send verification email
6. Show message: "Your account has been created. The owner will review and grant admin access."
7. Redirect to sign-in (but they can't access dashboard until promoted)

**Sign In (Admin/Owner)**:
1. User enters: Email, Password
2. Verify email is verified
3. Sign in with Firebase
4. Load user profile
5. **Check if user has ADMIN or OWNER role**
6. If no role: Show message "Your account is pending admin approval"
7. If has role: Check role and redirect:
   - Owner → `/dashboard` (owner dashboard)
   - Admin → `/dashboard` (admin dashboard)

---

## First-Time Owner Setup

### Problem Statement
How does the first owner get created? The system needs an initial owner account.

### Solution Options

#### Option 1: Environment Variable (Recommended)
**Implementation**:
- Add `INITIAL_OWNER_EMAIL` to `.env.local`
- On first user creation, check if email matches
- If match, set role to `OWNER` automatically
- Only works for the first user with that email

**Pros**:
- Simple implementation
- Secure (only works for specified email)
- No manual database editing needed

**Cons**:
- Requires environment variable setup
- Only one initial owner

**Code Location**: `src/lib/firebase/repositories/user-repository.ts`
```typescript
// In createUser method
const initialOwnerEmail = process.env.NEXT_PUBLIC_INITIAL_OWNER_EMAIL;
if (initialOwnerEmail && user.email === initialOwnerEmail) {
  userData.role = UserRole.OWNER;
} else {
  userData.role = UserRole.USER;
}
```

#### Option 2: Manual Database Edit
**Implementation**:
- First user signs up normally (gets `USER` role)
- Admin manually edits Firestore to change role to `OWNER`
- Document: `users/{userId}` → Set `role: 'owner'`

**Pros**:
- No code changes needed
- Flexible

**Cons**:
- Requires Firebase console access
- Manual process
- Not user-friendly

#### Option 3: Special Sign-Up Code
**Implementation**:
- Add "Owner Code" field to sign-up form
- If code matches secret, set role to `OWNER`
- Code stored in environment variable

**Pros**:
- User-friendly
- Can be shared securely

**Cons**:
- Code can be leaked
- Additional UI complexity

### Recommended Approach
**Use Option 1 (Environment Variable)** for initial setup, then Option 2 for additional owners if needed.

### Environment Variable
Add to `.env.local`:
```
NEXT_PUBLIC_INITIAL_OWNER_EMAIL=owner@chessclub.com
```

### Admin Sign-Up Flow
1. User wants to become admin
2. Clicks "Sign up to become an Admin" on login page
3. Fills form: First Name, Last Name, Email, Password
4. Account created with **no role** (or `pending` status)
5. Owner sees new sign-up in admin management dashboard
6. Owner can promote user to admin
7. User can then sign in and access admin dashboard

---

## Admin Management System

### Owner Dashboard Features

#### Admin Management Section
**Location**: `/dashboard` (Owner view only)

**Components Needed**:
1. **AdminList Component** (`src/components/admin/AdminList.tsx`)
   - Display all current admins
   - Show admin details (name, email, created date)
   - Remove admin button
   - Search/filter admins

2. **PendingAdmins Component** (`src/components/admin/PendingAdmins.tsx`)
   - Display users who signed up but don't have admin role yet
   - Show: Name, Email, Sign-up date
   - "Promote to Admin" button
   - "Reject" button (delete account or mark as rejected)

3. **AddAdminForm Component** (`src/components/admin/AddAdminForm.tsx`)
   - Search for user by email (who already signed up)
   - Select user to promote to admin
   - Confirm promotion
   - Show success/error messages

**Functionality**:
- **View Admins**: List all users with `role: 'admin'`
- **View Pending Admins**: List users who signed up but have no role (or pending status)
- **Add Admin**: 
  - From pending list: Promote user to `ADMIN`
  - Or search by email: Promote existing user to `ADMIN`
  - Send notification email (optional)
- **Remove Admin**:
  - Demote admin from `ADMIN` → no role (or delete account)
  - Confirm action (prevent accidental removal)
  - Handle existing events (keep them, just remove admin access)

**API Methods Needed**:
```typescript
// In UserRepository
promoteToAdmin(userId: string): Promise<void>
demoteFromAdmin(userId: string): Promise<void>
getAllAdmins(): Promise<User[]>
```

### Admin Dashboard Features

**Location**: `/dashboard` (Admin view)

**Features**:
- Create Event button (prominent)
- My Events list
- Event statistics
- Recent registrations
- Quick actions

**No Admin Management**: Admins cannot see or access admin management features.

---

## Event System Changes

### Important Note
**Event pages and event creation form will remain unchanged for now. Categories will be removed in a future phase after core functionality is working.**

### Features to Keep (For Now)
- ✅ Event categories (will remove later)
- ✅ Category navigation bar (will remove later)
- ✅ Category filtering (will remove later)
- ✅ Category badges on events (will remove later)
- ✅ Category selection in event form (will remove later)

### Kept Features (Permanent)
- ✅ Event creation form (simplified)
- ✅ Image upload
- ✅ Location details
- ✅ Date/time selection
- ✅ Registration configuration
- ✅ Price information
- ✅ Contact information
- ✅ Event status (draft/published)

### Components to Keep Unchanged (For Now)

**All event-related components will remain unchanged:**
- ✅ CategoryNav Component - Keep as-is
- ✅ EventCard Component - Keep as-is (with categories)
- ✅ NewEventForm Component - Keep as-is (with category selection)
- ✅ EventDetailClient Component - Keep as-is (with category display)
- ✅ Home Page - Keep category filtering
- ✅ Events Page - Keep category filtering
- ✅ Header Component - Keep CategoryNav

**These will be modified in Phase 6 (Future Phase)**

---

## Search & Filtering

### Search Functionality

#### Search Criteria
1. **Text Search**:
   - Event title
   - Event description
   - Location (city, address)

2. **Location Filter**:
   - City
   - State/Province
   - Country
   - Full address search

3. **Date Filter**:
   - Upcoming events only (default)
   - Specific date range
   - Past events (optional)

4. **Combined Search**:
   - Search term + location + date range

### Search UI Components

#### Enhanced Search Bar
**Location**: Header component

**Features**:
- Search input (title/description)
- Location input (with autocomplete)
- Date range picker (optional, can be in advanced search)
- Search button
- Clear filters button

#### Search Results Page
**Location**: `/events` or `/events/search`

**Features**:
- Display search query
- Show active filters
- Results count
- Sort options (date, relevance)
- Clear all filters

### Implementation

#### Search State Management
```typescript
interface SearchState {
  query: string;           // Text search
  location: string;        // Location filter
  startDate?: Date;        // Date range start
  endDate?: Date;          // Date range end
  sortBy: 'date' | 'relevance';
}
```

#### Search Logic
- **Client-side**: Filter loaded events (for small datasets)
- **Server-side**: Firestore queries (for large datasets)

**Firestore Queries**:
```typescript
// Text search (title/description)
where('title', '>=', searchTerm)
where('title', '<=', searchTerm + '\uf8ff')

// Location search
where('location.city', '==', city)

// Date range
where('startDate', '>=', startTimestamp)
where('startDate', '<=', endTimestamp)
```

---

## Dashboard Improvements

### Owner Dashboard (`/dashboard`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  Owner Dashboard                        │
│  Welcome, [Owner Name]                  │
├─────────────────────────────────────────┤
│  Quick Stats                            │
│  - Total Events                         │
│  - Total Admins                         │
│  - Total Registrations                  │
│  - Upcoming Events                      │
├─────────────────────────────────────────┤
│  [Create Event Button]                  │
├─────────────────────────────────────────┤
│  Admin Management                       │
│  [View/Manage Admins Button]           │
│  - List of current admins               │
│  - Add new admin                        │
│  - Remove admin                         │
├─────────────────────────────────────────┤
│  My Events                              │
│  - All events (owner + admin created)   │
│  - Filter by status                     │
│  - Quick actions                        │
├─────────────────────────────────────────┤
│  Recent Activity                        │
│  - Recent registrations                 │
│  - Recent events created                │
└─────────────────────────────────────────┘
```

#### Components Needed

1. **OwnerDashboard Component** (`src/app/dashboard/page.tsx`)
   - Role check: Only show if `user.role === 'owner'`
   - Display owner-specific sections
   - Admin management section

2. **AdminManagement Component** (`src/components/admin/AdminManagement.tsx`)
   - List admins
   - Add/remove admin functionality
   - Admin search

3. **DashboardStats Component** (`src/components/dashboard/DashboardStats.tsx`)
   - Display statistics cards
   - Real-time updates

### Admin Dashboard (`/dashboard`)

#### Layout Structure
```
┌─────────────────────────────────────────┐
│  Admin Dashboard                        │
│  Welcome, [Admin Name]                  │
├─────────────────────────────────────────┤
│  Quick Stats                            │
│  - My Events                            │
│  - Total Registrations                  │
│  - Upcoming Events                      │
├─────────────────────────────────────────┤
│  [Create Event Button] (Prominent)     │
├─────────────────────────────────────────┤
│  My Events                              │
│  - Events I created                     │
│  - Filter by status                     │
│  - Quick actions                        │
├─────────────────────────────────────────┤
│  Recent Registrations                   │
│  - For my events                        │
│  - Pending approvals                    │
└─────────────────────────────────────────┘
```

#### Components Needed

1. **AdminDashboard Component** (`src/app/dashboard/page.tsx`)
   - Role check: Show if `user.role === 'admin'`
   - Display admin-specific sections
   - No admin management section

### Public User Access (No Dashboard)

**Note**: Regular users/attendees **do NOT have accounts** and **do NOT have a dashboard**.

**Features for Public Users**:
- Browse events (no login required)
- Register for events (no login required)
- Registration form collects: Name, Email, Phone, etc.
- Can view their registration details via email link (optional feature)

**Registration Data**:
- Stored in `registrations` collection
- Linked to event, not to user account
- Can include email for notifications

### Dashboard Route Logic

**File**: `src/app/dashboard/page.tsx`

**Implementation**:
```typescript
export default function DashboardPage() {
  const { user } = useAuth();
  
  // Must be authenticated
  if (!user) {
    return <ProtectedRoute />;
  }
  
  // Must have admin or owner role
  if (!user.role || (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN)) {
    return (
      <div>
        <h1>Access Denied</h1>
        <p>Your account is pending admin approval. The owner will review your request.</p>
      </div>
    );
  }
  
  if (user.role === UserRole.OWNER) {
    return <OwnerDashboard />;
  }
  
  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard />;
  }
}
```

---

## Implementation Plan

### Phase 1: Authentication & Roles
1. ✅ Update UserRole enum (add OWNER, remove ORGANIZATION, remove USER)
2. ✅ Remove Google OAuth from AuthContext
3. ✅ Remove LoginButton component
4. ✅ Update login page:
   - Add message: "For Admins and Owners only"
   - Add "Sign up to become an Admin" option
   - Add info about public access
5. ✅ Implement initial owner setup (environment variable)
6. ✅ Update user creation: **No default role** (owner will promote)
7. ✅ Update protected routes to check ADMIN/OWNER roles only
8. ✅ Remove authentication requirement from public pages
9. ✅ Update Header: Remove sign-in button (or make admin-only)
10. ✅ Update Event Registration: Remove auth requirement

### Phase 2: Remove Categories (DEFERRED - Do Later)
**Note**: Event pages and event creation form will remain unchanged for now. Categories will be removed in a future phase.

**Deferred Changes**:
1. ⏸️ Remove CategoryNav component from Header (keep for now)
2. ⏸️ Remove category filtering from pages (keep for now)
3. ⏸️ Remove category selection from NewEventForm (keep for now)
4. ⏸️ Remove category display from EventCard (keep for now)
5. ⏸️ Remove category display from EventDetailClient (keep for now)
6. ⏸️ Remove category constants file (keep for now)
7. ⏸️ Update Event model (keep categories field for now)

**What to Keep**:
- ✅ Event pages functionality (browse, view details)
- ✅ Event creation form (with categories for now)
- ✅ Event registration form
- ✅ All event-related features

### Phase 2: Admin Management (Moved up - now Phase 2)
1. ✅ Create AdminManagement component
2. ✅ Create AdminList component
3. ✅ Create PendingAdmins component (for new sign-ups)
4. ✅ Create AddAdminForm component
5. ✅ Add promoteToAdmin/demoteFromAdmin methods to UserRepository
6. ✅ Add getPendingAdmins method (users with no role)
7. ✅ Add admin management section to Owner dashboard
8. ✅ Add role-based UI rendering
9. ✅ Add notification when user signs up for admin access

### Phase 3: Dashboard Improvements (Moved up - now Phase 3)
1. ✅ Create OwnerDashboard component
2. ✅ Create AdminDashboard component
3. ✅ Create DashboardStats component
4. ✅ Update dashboard page with role-based rendering
5. ✅ Add quick actions
6. ✅ Improve event management UI

### Phase 4: Search Enhancement (Moved up - now Phase 4)
1. ✅ Enhance search functionality
2. ✅ Add date range filtering
3. ✅ Improve location search
4. ✅ Add search results page
5. ✅ Add sort options

### Phase 5: Testing & Refinement (Moved up - now Phase 5)

### Phase 6: Remove Categories (Future Phase)
**This phase will be done later after core functionality is working.**
1. Remove CategoryNav component from Header
2. Remove category filtering from pages
3. Remove category selection from NewEventForm
4. Remove category display from EventCard
5. Remove category display from EventDetailClient
6. Update Event model (remove categories field or make optional)
1. ✅ Test owner setup flow
2. ✅ Test admin promotion/demotion
3. ✅ Test event creation (owner/admin)
4. ✅ Test event registration (users)
5. ✅ Test search functionality
6. ✅ Test role-based access control
7. ✅ Update security rules

---

## File Changes Checklist

### Files to Delete
- [ ] `src/components/auth/LoginButton.tsx` (Google OAuth button)
- [ ] `src/components/layout/CategoryNav.tsx` (or keep but hide)

### Files to Modify

#### Authentication
- [ ] `src/lib/context/AuthContext.tsx`
  - Remove Google OAuth methods
  - Remove OAuth imports
  - Update user creation: **No default role** (or pending status)
  - Add check for role before allowing dashboard access
  
- [ ] `src/app/login/page.tsx`
  - Remove Google sign-in button
  - **Add prominent message**: "This login is for Admins and Owners only"
  - **Add info**: "Regular users can browse and register without signing in"
  - Add "Sign up to become an Admin" section
  - Simplify UI
  - Remove divider

- [ ] `src/lib/models/user.ts`
  - Update UserRole enum
  - Remove ORGANIZATION role
  - Remove USER role (public users don't need accounts)
  - Add OWNER role
  - Keep only ADMIN and OWNER roles

- [ ] `src/lib/firebase/repositories/user-repository.ts`
  - Add promoteToAdmin method
  - Add demoteFromAdmin method
  - Add getAllAdmins method
  - Add getPendingAdmins method (users with no role)
  - Update createUser to check initial owner email
  - Update createUser: **Don't assign default role** (owner will promote)

#### Event Components (DEFERRED - Keep as-is for now)
**Note**: Event pages and forms will remain unchanged. Categories will be removed later.

- [ ] `src/components/events/NewEventForm.tsx`
  - ⏸️ **DEFERRED**: Remove categories section (keep for now)
  - ⏸️ **DEFERRED**: Remove category validation (keep for now)
  - ⏸️ **DEFERRED**: Remove category state (keep for now)

- [ ] `src/components/events/EventCard.tsx`
  - ⏸️ **DEFERRED**: Remove category badge (keep for now)
  - ⏸️ **DEFERRED**: Remove category prop (keep for now)

- [ ] `src/components/events/EventDetailClient.tsx`
  - ⏸️ **DEFERRED**: Remove category display (keep for now)

- [ ] `src/lib/models/event.ts`
  - ⏸️ **DEFERRED**: Remove categories field (keep for now)

#### Pages (DEFERRED - Keep category filtering for now)
**Note**: Event browsing pages will keep categories for now. Will be removed later.

- [ ] `src/app/page.tsx`
  - ⏸️ **DEFERRED**: Remove category filtering (keep for now)
  - ⏸️ **DEFERRED**: Remove category state/handlers (keep for now)
  - ⏸️ **DEFERRED**: Remove CategoryNav (keep for now)

- [ ] `src/app/events/page.tsx`
  - ⏸️ **DEFERRED**: Remove category filtering (keep for now)
  - ⏸️ **DEFERRED**: Remove category state/handlers (keep for now)

- [ ] `src/app/dashboard/page.tsx`
  - Add role-based rendering
  - Add owner dashboard
  - Add admin dashboard
  - Add admin management section (owner only)

#### Layout
- [ ] `src/components/layout/Header.tsx`
  - ⏸️ **DEFERRED**: Remove CategoryNav component (keep for now)
  - ⏸️ **DEFERRED**: Remove category props (keep for now)
  - Keep search functionality
  - **Remove or hide "Sign in" button** (or make it admin-only)
  - **Remove "Create Event" button** (only show for authenticated admin/owner)
  - Show user menu only for authenticated admin/owner

#### Constants
- [ ] `src/lib/constants/categories.tsx`
  - Keep file but mark as unused
  - Or delete if not needed

### Files to Create

#### Admin Management
- [ ] `src/components/admin/AdminManagement.tsx`
- [ ] `src/components/admin/AdminList.tsx`
- [ ] `src/components/admin/PendingAdmins.tsx` (NEW - for new sign-ups)
- [ ] `src/components/admin/AddAdminForm.tsx`

#### Dashboard
- [ ] `src/components/dashboard/OwnerDashboard.tsx`
- [ ] `src/components/dashboard/AdminDashboard.tsx`
- [ ] `src/components/dashboard/DashboardStats.tsx`
- [ ] `src/components/dashboard/UserDashboard.tsx` (optional)

#### Search
- [ ] `src/components/search/AdvancedSearch.tsx` (optional)
- [ ] `src/components/search/SearchFilters.tsx` (optional)

---

## Database Schema Changes

### Users Collection
**Changes**:
```typescript
// Before
role: 'user' | 'organization' | 'admin'

// After
role: 'user' | 'admin' | 'owner'
```

**Migration**:
- Existing `organization` roles → convert to `admin` or `user`
- Add `owner` role for initial owner

### Events Collection
**Changes**:
```typescript
// Before
categories: string[]  // Required field

// After
categories?: string[]  // Optional (for backward compatibility)
// Or remove entirely
```

**Migration**:
- Keep field for existing events
- New events don't need categories
- Can remove in future migration

### New Collections (Optional)

#### AdminInvitations (Optional)
If you want to add invitation system:
```typescript
{
  id: string;
  email: string;
  invitedBy: string; // Owner user ID
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

---

## Security Rules Updates

### Firestore Rules

#### Users Collection
```javascript
// Owner can read/write all users
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    (request.auth.uid == userId || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner');
  
  // Only owner can change roles
  allow update: if request.auth != null && 
    (request.auth.uid == userId || 
     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner' &&
      // Prevent owner from changing their own role
      request.auth.uid != userId));
}
```

#### Events Collection
```javascript
// Only owner and admins can create events
match /events/{eventId} {
  allow create: if request.auth != null && 
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['owner', 'admin']);
  
  // Owner can edit all, admin can edit own events
  allow update: if request.auth != null && 
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner' ||
     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' &&
      resource.data.organizerId == request.auth.uid));
  
  // Public read for published events
  allow read: if resource.data.published == true || 
    request.auth != null;
}
```

---

## Environment Variables

### Required Variables
```env
# Firebase (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Google Maps (existing)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Email (existing)
SENDGRID_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=

# NEW: Initial Owner
NEXT_PUBLIC_INITIAL_OWNER_EMAIL=owner@chessclub.com
```

---

## Testing Checklist

### Authentication
- [ ] Sign up with email/password (admin candidate)
- [ ] Sign in with email/password (admin/owner only)
- [ ] Email verification works
- [ ] Initial owner gets OWNER role
- [ ] New sign-ups get **NO role** (pending approval)
- [ ] No Google OAuth option appears
- [ ] Login page shows "For Admins and Owners only" message
- [ ] Public users can browse without login
- [ ] Public users can register without login

### Role-Based Access
- [ ] Owner can access admin management
- [ ] Admin cannot access admin management
- [ ] Users without role cannot access dashboard (shows pending message)
- [ ] Owner can create events
- [ ] Admin can create events
- [ ] Public users cannot create events (no create button shown)
- [ ] Public users can browse events without login
- [ ] Public users can register without login

### Admin Management
- [ ] Owner can view all admins
- [ ] Owner can view pending admin sign-ups
- [ ] Owner can promote pending user to admin
- [ ] Owner can promote existing user to admin
- [ ] Owner can demote admin (remove admin access)
- [ ] Admin cannot access admin management
- [ ] Promoted admin can create events
- [ ] New sign-ups appear in pending list

### Event System
- [ ] Event creation works for owner/admin
- [ ] Event creation blocked for regular users (no create button shown)
- [ ] Event pages work (browse, view details)
- [ ] Event registration works without login
- ⏸️ **DEFERRED**: Category removal (will be done later)

### Search & Filtering
- [ ] Text search works
- [ ] Location search works
- [ ] Date filtering works
- [ ] Combined search works
- [ ] No category filtering appears

### Dashboard
- [ ] Owner sees owner dashboard
- [ ] Admin sees admin dashboard
- [ ] User sees limited dashboard (or redirect)
- [ ] Admin management only visible to owner
- [ ] Statistics display correctly

---

## UI/UX Improvements

### Owner Dashboard
- **Admin Management Card**: Prominent card with admin count
- **Quick Actions**: Large buttons for common actions
- **Statistics Cards**: Visual stats with icons
- **Recent Activity**: Timeline of recent actions

### Admin Dashboard
- **Create Event Button**: Large, prominent button
- **My Events Grid**: Visual event cards
- **Registration Stats**: Quick stats for each event
- **Pending Approvals**: Highlight pending registrations

### Event Creation Form
- **Simplified Layout**: Remove category section
- **Step Indicator**: Show progress (optional)
- **Auto-save Draft**: Save as draft automatically
- **Preview**: Better preview before submission

---

## Future Enhancements (Optional)

### Phase 2 Features
1. **Event Templates**: Pre-configured event templates
2. **Bulk Operations**: Bulk approve/reject registrations
3. **Email Notifications**: Automated emails for registrations
4. **Event Analytics**: View count, registration trends
5. **Export Data**: Export registrations to CSV
6. **Event Recurring**: Recurring chess tournaments
7. **Tournament Brackets**: Display tournament brackets
8. **Player Ratings**: Track player ratings (if applicable)

---

## Notes for Implementation

### Backward Compatibility
- Keep `categories` field optional in Event model
- Existing events with categories will still work
- Can migrate/remove in future

### Security Considerations
- Only owner can manage admins
- Only owner/admin can create events
- Validate role changes server-side
- Prevent role escalation attacks

### Performance
- Index Firestore queries for role-based access
- Cache admin list (don't query every time)
- Optimize event queries for search

### Error Handling
- Handle role check failures gracefully
- Show appropriate error messages
- Log security violations

---

## Conclusion

This transformation guide provides a comprehensive roadmap for converting the Local Events platform into a Chess Club event management system. Follow the implementation plan phase by phase, testing each phase before moving to the next.

Key priorities:
1. ✅ Authentication changes (remove Google OAuth)
2. ✅ Role system (Owner, Admin, User)
3. ✅ Admin management (owner-only feature)
4. ✅ Remove categories
5. ✅ Enhance search
6. ✅ Improve dashboards

Good luck with the implementation! 🎯

