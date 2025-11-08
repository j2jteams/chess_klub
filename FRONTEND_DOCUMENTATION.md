# Frontend Documentation - Local Events Platform

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Project Structure](#project-structure)
4. [Pages & Routes](#pages--routes)
5. [Components](#components)
6. [State Management & Context](#state-management--context)
7. [Data Models](#data-models)
8. [Features & Functionality](#features--functionality)
9. [Styling & Theming](#styling--theming)
10. [Authentication System](#authentication-system)
11. [API Integration](#api-integration)
12. [User Flows](#user-flows)
13. [Key Implementation Details](#key-implementation-details)

---

## Overview

This is a comprehensive local events platform built with Next.js 15, React 19, TypeScript, and Firebase. The platform allows users to discover, create, and manage local events in their community. It features event browsing, search, filtering, registration, reminders, and a full dashboard for event organizers.

### Key Features
- **Event Discovery**: Browse events with search, filtering, and category navigation
- **Event Creation**: Rich event creation form with image upload, registration configuration
- **User Authentication**: Google OAuth and email/password authentication
- **Event Registration**: Customizable registration forms with approval workflows
- **Reminders & Calendar**: Email reminders and calendar integration
- **Dashboard**: Organizer dashboard for managing events and registrations
- **Responsive Design**: Mobile-first responsive design with modern UI

---

## Architecture & Technology Stack

### Core Technologies
- **Framework**: Next.js 15.3.2 (App Router)
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Styling**: Tailwind CSS 4.1.13
- **Form Handling**: React Hook Form 7.56.4 with Zod validation
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   ├── dashboard/          # Protected dashboard pages
│   ├── events/             # Public event pages
│   └── [other pages]       # Contact, login, terms, etc.
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── events/             # Event-related components
│   ├── layout/             # Layout components (Header, Footer)
│   └── ui/                 # Reusable UI components
├── lib/                    # Utilities and configurations
│   ├── constants/          # Constants (categories, theme)
│   ├── context/            # React contexts
│   ├── firebase/           # Firebase configuration & repositories
│   ├── hooks/              # Custom React hooks
│   ├── models/             # TypeScript models/interfaces
│   ├── schemas/            # Zod validation schemas
│   └── utils/              # Utility functions
└── public/                 # Static assets
```

---

## Pages & Routes

### Public Pages

#### 1. Home Page (`/`)
**File**: `src/app/page.tsx`

**Purpose**: Main landing page displaying featured and upcoming events

**Features**:
- Displays featured banner events (rotating carousel)
- Shows upcoming events in a grid layout
- Location-based event filtering
- Search and category filtering
- Location selector with geolocation support
- Auto-saves user location to preferences

**Key Functionality**:
- Fetches featured banner events (admin-selected)
- Fetches upcoming published events
- Client-side filtering by search term and category
- Integrates with Header component for search/filter
- Shows active filters when applied
- Responsive grid: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)

**State Management**:
- `events`: All fetched events
- `filteredEvents`: Events after applying filters
- `featuredEvents`: Banner events
- `location`: User's location (from geolocation or manual input)
- `searchTerm`: Search query
- `selectedCategory`: Selected category filter

#### 2. Events Listing Page (`/events`)
**File**: `src/app/events/page.tsx`

**Purpose**: Comprehensive events listing with pagination

**Features**:
- Infinite scroll / "Load More" pagination
- Search and category filtering
- Event count display
- Error handling and retry
- Loading states with skeletons

**Key Functionality**:
- Fetches events in batches (30 initially, 9 per "Load More")
- Maintains pagination state with Firestore cursor
- Client-side filtering of loaded events
- Shows filtered count vs total count

#### 3. Event Detail Page (`/events/[id]`)
**File**: `src/app/events/[id]/page.tsx`

**Purpose**: Individual event detail view

**Features**:
- Server-side rendering with dynamic metadata
- SEO-optimized with Open Graph tags
- Full event information display
- Registration form integration
- Image gallery with modal
- Google Maps integration
- Share functionality

**Key Functionality**:
- Fetches event by ID server-side
- Generates dynamic metadata for SEO
- Increments view count on load
- Handles 404 for non-existent events

**Client Component**: `EventDetailClient.tsx` (see Components section)

#### 4. Login Page (`/login`)
**File**: `src/app/login/page.tsx`

**Purpose**: User authentication

**Features**:
- Google OAuth sign-in
- Email/password sign-in and sign-up
- Email verification flow
- Redirect handling after authentication
- Two-mode interface (sign in / sign up)

**Key Functionality**:
- Handles OAuth redirect results
- Email verification link processing
- Redirects authenticated users
- Supports redirect query parameter

### Protected Pages (Dashboard)

#### 5. Dashboard Home (`/dashboard`)
**File**: `src/app/dashboard/page.tsx`

**Purpose**: Organizer dashboard overview

**Features**:
- Welcome message with user info
- Quick actions (Create Event)
- User's events list
- Search and filter for user's events
- Protected route (requires authentication)

**Key Functionality**:
- Displays user's created events
- Filtering and search for user's events
- Quick navigation to create new event

#### 6. Create Event Page (`/dashboard/event/new`)
**File**: `src/app/dashboard/event/new/page.tsx`

**Purpose**: Event creation form

**Features**:
- Comprehensive event creation form
- Image upload with progress
- Registration form builder
- Preview before submission
- Protected route

**Key Functionality**:
- Multi-step form with validation
- Image upload to Firebase Storage
- Registration configuration builder
- Preview modal before submission
- Converts form data to Firestore format

#### 7. Edit Event Page (`/dashboard/event/[id]`)
**File**: `src/app/dashboard/event/[id]/page.tsx`

**Purpose**: Edit existing event

**Features**:
- Pre-populated form with existing data
- Same form as create page
- Update functionality

#### 8. Event Registrations (`/dashboard/event/[id]/registrations`)
**File**: `src/app/dashboard/event/[id]/registrations/page.tsx`

**Purpose**: View and manage event registrations

**Features**:
- Registration table/list
- Approval/rejection workflow
- Export functionality
- Registration status management

### Other Pages
- `/contact` - Contact page
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/refunds` - Refunds & cancellations
- `/whygolocalevent` - About page

---

## Components

### Layout Components

#### Header Component
**File**: `src/components/layout/Header.tsx`

**Purpose**: Main site navigation and search

**Structure**:
```
Header
├── Logo (links to home)
├── Desktop Search Bar
│   ├── Search input
│   ├── Location input
│   └── Search button
├── Mobile Search Toggle
├── Create Event Button
└── User Menu / Sign In Button
```

**Features**:
- Sticky header (stays at top on scroll)
- Responsive: Desktop shows full search bar, mobile shows toggle
- Integrated search with debouncing (300ms)
- Location input with geolocation support
- User dropdown menu (when authenticated)
- Category navigation (via CategoryNav component)

**Props**:
- `activePage`: 'home' | 'events' | 'dashboard'
- `onSearch`: (searchTerm: string, location: string) => void
- `initialLocation`: string
- `initialSearchTerm`: string
- `onCategorySelect`: (categoryId: string) => void
- `selectedCategory`: string | null

**Key Functionality**:
- Auto-triggers search on input change (debounced)
- Updates location from geolocation hook
- Shows user menu for authenticated users
- Redirects to login for anonymous users trying to create event

#### Footer Component
**File**: `src/components/layout/Footer.tsx`

**Purpose**: Site footer with links and information

**Structure**:
- Business information
- Links for attendees
- Links for organizations
- Support links
- Social media icons
- Copyright

#### CategoryNav Component
**File**: `src/components/layout/CategoryNav.tsx`

**Purpose**: Category filter navigation bar

**Features**:
- Horizontal scrolling category buttons
- Active state highlighting
- Icons for each category
- Toggle selection (click again to deselect)

**Categories**:
- Music
- Food & Drink
- Education
- Entertainment
- Community
- Sports
- Arts & Culture
- Business

### Event Components

#### EventCard Component
**File**: `src/components/events/EventCard.tsx`

**Purpose**: Display event in card format

**Features**:
- Event image (primary or first)
- Event title and description
- Date and location display
- Category badge
- Save button (heart icon)
- View count
- Price display (if available)
- Clickable card (links to detail page)

**Props**:
- `event`: Event object
- `featured`: boolean (for larger featured display)

**Layout**:
- Image section (top)
- Content section (bottom)
- Responsive sizing

#### EventCardSkeleton Component
**File**: `src/components/events/EventCardSkeleton.tsx`

**Purpose**: Loading placeholder for EventCard

**Features**:
- Animated skeleton
- Matches EventCard dimensions

#### EventDetailClient Component
**File**: `src/components/events/EventDetailClient.tsx`

**Purpose**: Client-side event detail view

**Layout** (Desktop):
- Left: Sticky event image (portrait)
- Middle: Event details (title, description, date, location, contact)
- Right: Sticky action panel (price, registration, reminders, views)

**Layout** (Mobile):
- Top: Event image
- Middle: Event details
- Bottom: Action panel

**Features**:
- Save/unsave event
- Share event (native share API or clipboard)
- Add to calendar (Google Calendar, Outlook)
- Email reminders (1 hour, 1 day, 3 days, 1 week before)
- Registration form modal
- Image modal (fullscreen)
- Google Maps embed
- View count display
- Registration stats (if enabled)
- Contact information display

**Key Functionality**:
- Increments view count on mount
- Checks if user has saved event
- Checks registration status
- Fetches registration stats
- Handles reminder creation
- Calendar export (ICS format)

#### NewEventForm Component
**File**: `src/components/events/NewEventForm.tsx`

**Purpose**: Comprehensive event creation/editing form

**Sections**:
1. **Basic Information**
   - Title
   - Description
   - Start date/time
   - End date/time (optional)

2. **Location**
   - Address
   - City
   - State/Province
   - Country
   - Postal code
   - Venue details

3. **Categories**
   - Multi-select category buttons
   - Minimum 1 category required

4. **Pricing** (Optional)
   - Free entry checkbox
   - Price amount
   - Currency selector
   - Ticket URL

5. **Contact Information** (Optional)
   - Contact name
   - Email
   - Phone
   - Website

6. **Event Images**
   - Drag & drop upload
   - Multiple image support
   - Upload progress
   - Primary image selection
   - Image preview and removal

7. **Publication Settings**
   - Publish immediately checkbox
   - Featured banner (admin only)
   - Maximum attendees

8. **Registration Configuration**
   - Enable/disable registration
   - Custom form builder
   - Approval workflow
   - Capacity limits
   - Waitlist support

**Features**:
- Form validation with Zod
- Image upload to Firebase Storage
- Preview before submission
- Edit mode support
- Admin-only features (featured banner)

#### EventRegistrationForm Component
**File**: `src/components/events/EventRegistrationForm.tsx`

**Purpose**: Dynamic registration form based on event configuration

**Features**:
- Dynamic field rendering based on registration config
- Field types: text, textarea, email, phone, number, date, URL, select, radio, checkbox, file
- Conditional field display (show/hide based on other fields)
- Required field validation
- Pre-filled user information
- Registration status checking
- Waitlist handling
- Approval workflow support

**Field Types Supported**:
- TEXT: Single-line text input
- TEXTAREA: Multi-line text input
- EMAIL: Email input with validation
- PHONE: Phone number input
- NUMBER: Numeric input with min/max
- DATE: Date picker
- URL: URL input with validation
- SELECT: Dropdown select
- RADIO: Radio button group
- CHECKBOX: Single or multiple checkboxes
- FILE: File upload with type/size validation

**Registration Flow**:
1. Check if registration is open
2. Check if user already registered
3. Validate form data
4. Check capacity (if max registrations set)
5. Create registration (approved/pending/waitlisted)
6. Show success message
7. Update registration stats

#### BannerEvent Component
**File**: `src/components/events/BannerEvent.tsx`

**Purpose**: Rotating banner carousel for featured events

**Features**:
- Auto-rotates every 5 seconds
- Manual navigation (arrows, dots)
- Clickable banner (links to event)
- Responsive image sizing
- Smooth transitions

**Props**:
- `events`: Array of Event objects

#### ActiveFilters Component
**File**: `src/components/events/ActiveFilters.tsx`

**Purpose**: Display and clear active filters

**Features**:
- Shows active search term
- Shows active category
- Clear individual filters
- Clear all filters button

#### UserEventsList Component
**File**: `src/components/events/UserEventsList.tsx`

**Purpose**: Display user's created events in dashboard

**Features**:
- Lists user's events
- Search and filter support
- Event status display
- Quick actions (edit, view registrations)
- Empty state

#### RegistrationFormBuilder Component
**File**: `src/components/events/RegistrationFormBuilder.tsx`

**Purpose**: Builder interface for creating custom registration forms

**Features**:
- Add/remove fields
- Configure field properties
- Set field order
- Conditional logic (show/hide fields)
- Field validation rules
- Preview form

### Authentication Components

#### AuthProvider Component
**File**: `src/components/auth/AuthProvider.tsx`

**Purpose**: Wrapper for Firebase authentication context

**Features**:
- Provides auth state to entire app
- Handles user profile creation/loading
- Manages authentication state

#### LoginButton Component
**File**: `src/components/auth/LoginButton.tsx`

**Purpose**: Google OAuth sign-in button

**Features**:
- Google sign-in with popup
- Fallback to redirect if popup blocked
- Error handling

#### LogoutButton Component
**File**: `src/components/auth/LogoutButton.tsx`

**Purpose**: Sign out button

**Features**:
- Signs out user
- Clears auth state

#### ProtectedRoute Component
**File**: `src/components/auth/ProtectedRoute.tsx`

**Purpose**: Route protection wrapper

**Features**:
- Redirects unauthenticated users to login
- Shows loading state
- Preserves redirect URL

### UI Components

Located in `src/components/ui/`:
- `button.tsx` - Button component with variants
- `input.tsx` - Input field component
- `textarea.tsx` - Textarea component
- `form.tsx` - Form components (FormField, FormItem, etc.)
- `label.tsx` - Label component
- `dropdown-menu.tsx` - Dropdown menu component
- `notification.tsx` - Toast notification system
- `confirmation-dialog.tsx` - Confirmation dialog
- `linkified-text.tsx` - Text component that auto-links URLs

---

## State Management & Context

### AuthContext
**File**: `src/lib/context/AuthContext.tsx`

**Purpose**: Global authentication state management

**State**:
- `user`: User object from Firestore
- `firebaseUser`: Firebase Auth user object
- `loading`: Authentication loading state
- `error`: Authentication error message

**Methods**:
- `signInWithGoogle()`: Google OAuth sign-in
- `logout()`: Sign out user
- `updateUserLocation(location)`: Update user's location preference
- `signUpWithEmail(firstName, lastName, email, password)`: Email sign-up
- `loginWithEmail(email, password)`: Email sign-in
- `verifyEmailOobCode(code)`: Verify email with OOB code

**Functionality**:
- Listens to Firebase auth state changes
- Creates/loads user profile in Firestore
- Handles OAuth redirect results
- Manages email verification flow

### LocationContext
**File**: `src/lib/context/LocationContext.tsx`

**Purpose**: Global location state management

**Features**:
- Provides location to components
- Caches location in localStorage
- Geolocation support

### NotificationContext
**File**: `src/lib/context/NotificationContext.tsx`

**Purpose**: Global notification/toast system

**Features**:
- Show success/error/warning notifications
- Auto-dismiss after timeout
- Position configuration
- Multiple notifications support

---

## Data Models

### Event Model
**File**: `src/lib/models/event.ts`

```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Timestamp | string;
  endDate?: Timestamp | string;
  location: EventLocation;
  organizerId: string;
  organizationId?: string;
  categories: string[];
  images: EventImage[];
  flyerUrl?: string;
  status: EventStatus;
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  published: boolean;
  maxAttendees?: number;
  price?: EventPrice;
  contactInfo?: EventContactInfo;
  viewCount?: number;
  metadata?: Record<string, unknown>;
  isFeaturedBanner?: boolean;
  registrationConfig?: RegistrationConfig;
}
```

**Event Statuses**:
- `DRAFT`: Not published
- `PENDING_REVIEW`: Awaiting moderation
- `PUBLISHED`: Live and visible
- `CANCELLED`: Event cancelled
- `COMPLETED`: Event finished

### User Model
**File**: `src/lib/models/user.ts`

```typescript
interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  role: UserRole;
  organizationId?: string;
  preferences: UserPreferences;
}
```

**User Roles**:
- `USER`: Regular user
- `ORGANIZATION`: Organization account
- `ADMIN`: Admin user

### Registration Model
**File**: `src/lib/models/registration.ts`

```typescript
interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string;
  status: RegistrationStatus;
  formData: Record<string, any>;
  email: string;
  firstName: string;
  lastName: string;
  submittedAt: string;
  updatedAt?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}
```

**Registration Statuses**:
- `PENDING`: Awaiting approval
- `APPROVED`: Registration confirmed
- `REJECTED`: Registration denied
- `WAITLISTED`: On waitlist
- `CANCELLED`: Registration cancelled

### Reminder Model
**File**: `src/lib/models/reminder.ts`

```typescript
interface Reminder {
  id: string;
  userId: string;
  eventId: string;
  reminderTime: Timestamp;
  notificationMethods: NotificationMethod[];
  status: ReminderStatus;
  message?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

---

## Features & Functionality

### Event Discovery

#### Search Functionality
- **Location**: Header search bar
- **Implementation**: Client-side filtering
- **Features**:
  - Search by title and description
  - Debounced input (300ms)
  - Real-time results
  - Search term highlighting (via ActiveFilters)

#### Category Filtering
- **Location**: CategoryNav component
- **Implementation**: Client-side filtering
- **Features**:
  - 8 main categories
  - Multi-select support (can select multiple)
  - Visual active state
  - Clear filter option

#### Location-Based Filtering
- **Features**:
  - Geolocation detection
  - Manual location input
  - Location saved to user preferences
  - Location-based event display

### Event Creation

#### Form Sections
1. **Basic Info**: Title, description, dates
2. **Location**: Full address details
3. **Categories**: Multi-select
4. **Pricing**: Optional pricing info
5. **Contact**: Optional contact details
6. **Images**: Multiple image upload
7. **Publication**: Publish settings
8. **Registration**: Custom form builder

#### Image Upload
- **Storage**: Firebase Storage
- **Features**:
  - Drag & drop support
  - Multiple file selection
  - Upload progress tracking
  - Image preview
  - Primary image selection
  - File validation (type, size)
  - Max 10MB per file

#### Registration Form Builder
- **Features**:
  - Add custom fields
  - Field types: text, email, phone, number, date, select, radio, checkbox, file
  - Field validation rules
  - Conditional field display
  - Field ordering
  - Required/optional fields
  - Approval workflow
  - Capacity limits
  - Waitlist support

### Event Registration

#### Registration Flow
1. User clicks "Register for Event"
2. Check if registration is open
3. Check if user already registered
4. Display dynamic form based on event config
5. Validate form data
6. Check capacity
7. Create registration (approved/pending/waitlisted)
8. Show confirmation

#### Registration Features
- Dynamic form fields
- Pre-filled user information
- Field validation
- Capacity checking
- Waitlist support
- Approval workflow
- Email notifications (future)

### Reminders & Calendar

#### Email Reminders
- **Options**: 1 hour, 1 day, 3 days, 1 week before event
- **Implementation**: Creates Reminder document in Firestore
- **Processing**: Backend cron job (API route)

#### Calendar Integration
- **Google Calendar**: Direct link to add event
- **Outlook Calendar**: Direct link to add event
- **ICS Export**: Download .ics file (future)

### User Management

#### Authentication Methods
1. **Google OAuth**
   - Popup method (preferred)
   - Redirect fallback if popup blocked
   - Auto-creates user profile

2. **Email/Password**
   - Sign up with email verification
   - Sign in with email/password
   - Email verification required

#### User Profile
- Auto-created on first sign-in
- Stored in Firestore `users` collection
- Preferences stored (location, notifications)
- Role-based access control

### Admin Features

#### Featured Banner Events
- Admin-only feature
- Select events to feature on homepage
- Rotating carousel display
- Set via `isFeaturedBanner` flag

#### Event Moderation
- Event status management
- Approval workflow (future)

---

## Styling & Theming

### Design System

#### Color Palette (Sunset Glow Theme)
- **Primary**: Sunset orange (`oklch(0.65 0.2 35)`)
- **Secondary**: Light peach (`oklch(0.92 0.03 40)`)
- **Accent**: Golden yellow (`oklch(0.75 0.15 25)`)
- **Background**: Warm cream (`oklch(0.98 0.01 35)`)
- **Foreground**: Deep warm brown (`oklch(0.18 0.02 30)`)

#### Typography
- **Sans**: Geist Sans (Google Fonts)
- **Mono**: Geist Mono (Google Fonts)

#### Spacing & Layout
- Container max-width: `7xl` (1280px)
- Responsive breakpoints: `sm`, `md`, `lg`, `xl`
- Grid system: 1 column (mobile) → 2 (tablet) → 3 (desktop)

#### Components Styling
- Uses Tailwind CSS utility classes
- Custom CSS variables for theming
- Dark mode support (prepared but not fully implemented)
- Responsive design throughout

### Custom CSS Classes

#### Sunset Text Gradient
```css
.sunset-text-gradient {
  background: linear-gradient(135deg, #f97316, #fb923c, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Authentication System

### Firebase Authentication

#### Providers
1. **Google OAuth**
   - Uses Firebase GoogleAuthProvider
   - Popup method with redirect fallback
   - Auto-creates user profile

2. **Email/Password**
   - Email verification required
   - Password reset support (future)
   - Email verification links

#### Authentication Flow

**Sign Up (Email)**:
1. User enters first name, last name, email, password
2. Create account with Firebase
3. Update profile with display name
4. Create user document in Firestore
5. Send verification email
6. Redirect to sign-in

**Sign In (Email)**:
1. User enters email and password
2. Verify email is verified
3. Sign in with Firebase
4. Load user profile from Firestore
5. Redirect to dashboard or home

**Sign In (Google)**:
1. User clicks "Continue with Google"
2. Open Google OAuth popup
3. User authorizes
4. Get user credentials
5. Create/load user profile
6. Redirect to dashboard or home

**Sign Out**:
1. Call Firebase signOut()
2. Clear user state
3. Redirect to home

### Protected Routes

**Implementation**: `ProtectedRoute` component

**Features**:
- Checks authentication state
- Shows loading while checking
- Redirects to login if not authenticated
- Preserves redirect URL in query params

---

## API Integration

### Firebase Services

#### Firestore
- **Collections**:
  - `events`: Event documents
  - `users`: User profiles
  - `registrations`: Event registrations
  - `reminders`: User reminders
  - `organizations`: Organization profiles

#### Firebase Storage
- **Paths**:
  - `events/{eventId}/images/{imageId}`: Event images
  - `events/{eventId}/flyers/{flyerId}`: Event flyers

#### Firebase Authentication
- User authentication
- Email verification
- OAuth providers

### API Routes

#### `/api/email/send`
**Purpose**: Send emails (SendGrid integration)

#### `/api/geocode`
**Purpose**: Geocode addresses to coordinates

#### `/api/reminders/run`
**Purpose**: Process and send reminders (cron job)

### Repository Pattern

**Location**: `src/lib/firebase/repositories/`

**Repositories**:
- `EventRepository`: Event CRUD operations
- `UserRepository`: User profile operations
- `RegistrationRepository`: Registration operations
- `ReminderRepository`: Reminder operations
- `OrganizationRepository`: Organization operations

**Benefits**:
- Centralized data access
- Type-safe operations
- Consistent error handling
- Easy to mock for testing

---

## User Flows

### Event Discovery Flow

1. User lands on homepage
2. Sees featured banner events (if any)
3. Sees upcoming events grid
4. Can search by keyword
5. Can filter by category
6. Can set location
7. Clicks event card → Event detail page

### Event Creation Flow

1. User clicks "Create Event" (requires auth)
2. Redirected to login if not authenticated
3. Fills out event creation form
4. Uploads images
5. Configures registration (optional)
6. Previews event
7. Submits event
8. Redirected to dashboard
9. Event appears in user's events list

### Event Registration Flow

1. User views event detail page
2. Clicks "Register for Event"
3. Registration form modal opens
4. Fills out form (some fields pre-filled)
5. Submits registration
6. Registration created (approved/pending/waitlisted)
7. Confirmation message shown
8. Registration stats updated

### Reminder Flow

1. User views event detail page
2. Clicks "Email Reminder"
3. Selects reminder time (1 hour, 1 day, etc.)
4. Reminder created in Firestore
5. Backend cron job processes reminders
6. Email sent at reminder time

---

## Key Implementation Details

### Image Handling

#### Upload Process
1. User selects files
2. Files validated (type, size)
3. Files uploaded to Firebase Storage
4. Upload progress tracked
5. URLs returned and stored in form state
6. Images mapped to EventImage objects on submit

#### Display
- Primary image: First image or image with `isPrimary: true`
- Fallback: `/placeholder-event.jpg`
- Responsive sizing with Next.js Image component
- Lazy loading for performance

### Form Validation

#### Schema-Based Validation
- Uses Zod schemas
- React Hook Form integration
- Real-time validation
- Error messages displayed inline

#### Custom Validation
- Category selection (min 1)
- Date validation (end date after start date)
- File validation (type, size)
- Registration field validation

### State Management Patterns

#### Local State
- Component-level state with `useState`
- Form state with React Hook Form
- Loading states for async operations

#### Global State
- Authentication: AuthContext
- Location: LocationContext
- Notifications: NotificationContext

#### Server State
- Data fetching in `useEffect`
- Firestore real-time listeners (future)
- Server-side data fetching (SSR)

### Performance Optimizations

#### Image Optimization
- Next.js Image component
- Responsive images with `sizes` prop
- Lazy loading
- Image compression before upload

#### Code Splitting
- Next.js automatic code splitting
- Dynamic imports for heavy components
- Route-based code splitting

#### Caching
- Location cached in localStorage
- User preferences cached
- Firestore query caching

### Error Handling

#### Client-Side Errors
- Try-catch blocks for async operations
- Error state in components
- User-friendly error messages
- Notification system for errors

#### Server-Side Errors
- Error boundaries (future)
- 404 handling for missing events
- Error pages for server errors

### Accessibility

#### ARIA Labels
- Button labels
- Form field labels
- Navigation landmarks

#### Keyboard Navigation
- Tab order
- Enter to submit forms
- Escape to close modals

#### Screen Reader Support
- Semantic HTML
- Alt text for images
- Descriptive link text

---

## Development Notes

### Environment Variables

Required `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
SENDGRID_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
NEXT_PUBLIC_BASE_URL=
```

### Running the Application

```bash
npm install
npm run dev
```

Application runs on `http://localhost:3000`

### Building for Production

```bash
npm run build
npm start
```

---

## Future Enhancements

### Planned Features
- Real-time event updates
- Push notifications
- Social sharing enhancements
- Event recommendations
- User reviews and ratings
- Event analytics dashboard
- Payment integration
- Multi-language support
- Advanced search filters
- Event calendar view
- Export registrations to CSV
- Email templates customization
- SMS reminders
- WhatsApp integration

### Technical Improvements
- Service Worker for offline support
- Progressive Web App (PWA)
- Advanced caching strategies
- Performance monitoring
- Error tracking (Sentry)
- Analytics integration
- A/B testing framework
- Automated testing suite

---

## Conclusion

This frontend documentation provides a comprehensive overview of the Local Events platform. The application is built with modern web technologies and follows best practices for React/Next.js development. The architecture is scalable, maintainable, and ready for future enhancements.

For questions or contributions, please refer to the main project repository.

