# Firestore Security Rules Documentation

This document explains the security rules implemented for the Local Events application's Firestore database.

## Helper Functions

The security rules include several helper functions to simplify access control:

- `isAuthenticated()`: Checks if the user is logged in
- `isOwner(userId)`: Checks if the current user owns the resource
- `isAdmin()`: Checks if the current user has admin role
- `isOrganization()`: Checks if the current user has organization role
- `isOrgAdmin(organizationId)`: Checks if the current user is an admin of the specified organization
- `isValidUser()`: Validates user document structure
- `isValidOrganization()`: Validates organization document structure
- `isValidEvent()`: Validates event document structure

## Collection Access Controls

### Users Collection

- **Read:**
  - Users can read their own profiles
  - Admins can read any profile
  - Admins can list all users
- **Write:**
  - Users can create their own profiles with valid data
  - Users can update their own profiles
  - Admins can update any profile
  - Only admins can delete users

### Organizations Collection

- **Read:**
  - Anyone can read organizations (public data)
- **Write:**
  - Authenticated users can create organizations with valid data
  - Organization admins can update their organizations
  - System admins can update any organization
  - Only system admins can delete organizations

### Events Collection

- **Read:**
  - Anyone can read published events
  - Event creators can read their own events
  - Organization admins can read their organization's events
  - System admins can read all events
- **Write:**
  - Organizations and system admins can create events with valid data
  - Event owners, organization admins, and system admins can update events
  - Event owners, organization admins, and system admins can delete events

### Event Attendees Subcollection

- **Read:**
  - Users can read their own attendee records
  - Event owners can read all attendee records for their events
  - Organization admins can read all attendee records for their events
  - System admins can read all attendee records
- **Write:**
  - Users can create/update their own attendee records
  - Only admins can delete attendee records

### Reminders Collection

- **Read:**
  - Users can read their own reminders
  - System admins can read all reminders
- **Write:**
  - Users can create their own reminders
  - Users can update their own reminders
  - System admins can update any reminder
  - Users can delete their own reminders
  - System admins can delete any reminder

### Submissions Collection

- **Read:**
  - Submitters can read their own submissions
  - Organizations can read all submissions (for moderation)
  - System admins can read all submissions
- **Write:**
  - Authenticated users can create submissions
  - Only organizations and system admins can update submissions (for moderation)
  - Only system admins can delete submissions

## Security Considerations

1. **Resource Ownership**: Rules enforce that users can only modify their own resources.
2. **Role-Based Access**: Different permissions are granted based on user roles.
3. **Data Validation**: Rules ensure that documents have required fields before being created.
4. **Data Privacy**: Users can only access data that belongs to them or is public.
5. **Administrative Access**: Admins have broader access for moderation and management.

## Deployment

These security rules should be deployed to Firestore using the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```