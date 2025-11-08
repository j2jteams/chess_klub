# Firestore Indexes Documentation

This document explains the composite indexes created for efficient querying of the Local Events application's Firestore database.

## Index Configurations

### Events Collection

1. **Upcoming Published Events (Ascending Order)**
   - Fields: `status` (ASC), `published` (ASC), `startDate` (ASC)
   - Purpose: Efficiently retrieve upcoming events sorted by start date (earliest first)
   - Used in: Home page, event discovery features

2. **Upcoming Published Events (Descending Order)**
   - Fields: `status` (ASC), `published` (ASC), `startDate` (DESC)
   - Purpose: Efficiently retrieve upcoming events sorted by start date (latest first)
   - Used in: Alternative event sorting views

3. **Events by Organizer**
   - Fields: `organizerId` (ASC), `createdAt` (DESC)
   - Purpose: Efficiently retrieve events created by a specific user/organizer
   - Used in: User dashboard, profile views

4. **Events by Organization**
   - Fields: `organizationId` (ASC), `createdAt` (DESC)
   - Purpose: Efficiently retrieve events associated with a specific organization
   - Used in: Organization dashboard, profile views

5. **Events by Category**
   - Fields: `categories` (ARRAY_CONTAINS), `status` (ASC), `published` (ASC), `startDate` (ASC)
   - Purpose: Efficiently retrieve events in a specific category
   - Used in: Category filtering, interest-based recommendations

6. **Events by Location (City)**
   - Fields: `location.city` (ASC), `status` (ASC), `published` (ASC), `startDate` (ASC)
   - Purpose: Efficiently retrieve events in a specific city
   - Used in: Location-based search and filtering

7. **Featured Banner Events**
   - Fields: `isFeaturedBanner` (ASC), `published` (ASC), `status` (ASC), `startDate` (ASC)
   - Purpose: Efficiently retrieve events marked as featured banners
   - Used in: Dashboard banner display, featured event queries
   - **Creation URL**: [Firebase Console Index Creation](https://console.firebase.google.com/v1/r/project/local-events-3ab8e/firestore/indexes?create_composite=ClFwcm9qZWN0cy9sb2NhbC1ldmVudHMtM2FiOGUvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2V2ZW50cy9pbmRleGVzL18QARoUChBpc0ZlYXR1cmVkQmFubmVyEAEaDQoJcHVibGlzaGVkEAEaCgoGc3RhdHVzEAEaDQoJc3RhcnREYXRlEAEaDAoIX19uYW1lX18QAQ)

### Reminders Collection

1. **Reminders by User**
   - Fields: `userId` (ASC), `reminderTime` (ASC)
   - Purpose: Efficiently retrieve reminders for a specific user
   - Used in: User dashboard, reminder management

2. **Reminders by Event**
   - Fields: `eventId` (ASC), `reminderTime` (ASC)
   - Purpose: Efficiently retrieve reminders for a specific event
   - Used in: Event analytics, notification processing

3. **Due Reminders**
   - Fields: `reminderTime` (ASC), `status` (ASC)
   - Purpose: Efficiently retrieve reminders that are due to be sent
   - Used in: Reminder processing background jobs

### Submissions Collection

1. **Submissions by Status**
   - Fields: `status` (ASC), `createdAt` (DESC)
   - Purpose: Efficiently retrieve submissions with a specific status
   - Used in: Moderation queue, submission management

2. **Submissions by Submitter**
   - Fields: `submitterId` (ASC), `createdAt` (DESC)
   - Purpose: Efficiently retrieve submissions from a specific user
   - Used in: User dashboard, submission history

3. **Submissions by Method**
   - Fields: `submissionMethod` (ASC), `createdAt` (DESC)
   - Purpose: Efficiently retrieve submissions by submission method
   - Used in: Analytics, submission source tracking

### Organizations Collection

1. **Organizations by Admin**
   - Fields: `adminIds` (ARRAY_CONTAINS), `name` (ASC)
   - Purpose: Efficiently retrieve organizations where a user is an admin
   - Used in: User dashboard, organization management

### Event Registrations Subcollection (events/{eventId}/registrations)

1. **Registrations by User**
   - Fields: `userId` (ASC), `status` (ASC)
   - Purpose: Efficiently find a user's registration for an event
   - Used in: Registration duplicate checking, user registration status

2. **Registrations by Status**
   - Fields: `status` (ASC), `submittedAt` (DESC)
   - Purpose: Efficiently retrieve registrations by status for event management
   - Used in: Registration management, approval workflows

3. **Registrations by Date**
   - Fields: `submittedAt` (DESC), `status` (ASC)
   - Purpose: Efficiently retrieve registrations ordered by submission date
   - Used in: Registration lists, chronological sorting

## Deployment

These indexes should be deployed to Firestore using the Firebase CLI:

```bash
firebase deploy --only firestore:indexes
```

## Performance Considerations

1. **Index Size**: Each index requires additional storage and increases write operations cost
2. **Query Performance**: Indexes significantly improve read performance for the specified queries
3. **Maintenance**: Indexes should be updated as query patterns evolve
4. **Development**: The Firebase Emulator Suite can be used to test indexes locally

## Additional Index Creation

Additional indexes may be required as the application evolves. Firebase will suggest required indexes in the console when queries without matching indexes are executed.