# Firestore Database Schema

This document describes the Firestore collections and documents structure for the Local Events application.

## Collections

### `users`
Stores user profile information.

- Document ID: User's Firebase Auth UID
- Fields:
  - `uid`: string - User ID (same as document ID)
  - `email`: string - User's email address
  - `displayName`: string - User's display name
  - `photoURL`: string - URL to user's profile photo
  - `createdAt`: timestamp - When the user was created
  - `updatedAt`: timestamp - When the user was last updated
  - `role`: string - User role ("user", "organization", "admin")
  - `organizationId`: string (optional) - Reference to organization if applicable
  - `preferences`: object - User preferences
    - `notificationMethods`: array - Preferred notification methods
    - `emailNotifications`: boolean - Email notifications enabled
    - `smsNotifications`: boolean - SMS notifications enabled
    - `whatsappNotifications`: boolean - WhatsApp notifications enabled
    - `location`: string (optional) - Preferred location
    - `interests`: array (optional) - Categories of interest
    - `savedEvents`: array (optional) - IDs of saved events

### `organizations`
Stores organization profile information.

- Document ID: Auto-generated
- Fields:
  - `id`: string - Organization ID (same as document ID)
  - `name`: string - Organization name
  - `description`: string (optional) - Organization description
  - `logo`: string (optional) - URL to organization logo
  - `website`: string (optional) - Organization website
  - `contactEmail`: string - Organization contact email
  - `contactPhone`: string (optional) - Organization contact phone
  - `socialLinks`: object (optional) - Social media links
    - `facebook`: string (optional)
    - `twitter`: string (optional)
    - `instagram`: string (optional)
    - `linkedin`: string (optional)
  - `verified`: boolean - Whether the organization is verified
  - `createdAt`: timestamp - When the organization was created
  - `updatedAt`: timestamp - When the organization was last updated
  - `adminIds`: array - User IDs of organization admins

### `events`
Stores event information.

- Document ID: Auto-generated
- Fields:
  - `id`: string - Event ID (same as document ID)
  - `title`: string - Event title
  - `description`: string - Event description
  - `startDate`: timestamp - Event start date and time
  - `endDate`: timestamp (optional) - Event end date and time
  - `location`: object - Event location
    - `address`: string - Full address
    - `city`: string - City
    - `state`: string (optional) - State/province
    - `country`: string - Country
    - `postalCode`: string (optional) - Postal code
    - `venueDetails`: string (optional) - Additional venue details
    - `geoPoint`: object (optional) - Geographical coordinates
      - `latitude`: number - Latitude
      - `longitude`: number - Longitude
  - `organizerId`: string - User ID of creator
  - `organizationId`: string (optional) - Organization ID if applicable
  - `categories`: array - Event categories
  - `images`: array - Event images
    - Each image: object
      - `url`: string - Image URL
      - `alt`: string (optional) - Alternative text
      - `isPrimary`: boolean - Whether this is the primary image
      - `width`: number (optional) - Image width
      - `height`: number (optional) - Image height
  - `flyerUrl`: string (optional) - URL to original flyer image
  - `status`: string - Event status ("draft", "pending_review", "published", "cancelled", "completed")
  - `createdAt`: timestamp - When the event was created
  - `updatedAt`: timestamp - When the event was last updated
  - `published`: boolean - Whether the event is publicly visible
  - `maxAttendees`: number (optional) - Maximum number of attendees
  - `price`: object (optional) - Price information
    - `amount`: number - Price amount
    - `currency`: string - Currency code
    - `freeEntry`: boolean - Whether entry is free
    - `ticketUrl`: string (optional) - URL to purchase tickets
  - `contactInfo`: object (optional) - Contact information
    - `name`: string (optional) - Contact name
    - `email`: string (optional) - Contact email
    - `phone`: string (optional) - Contact phone
    - `website`: string (optional) - Event website
    - `socialLinks`: object (optional) - Social media links
      - `facebook`: string (optional)
      - `twitter`: string (optional)
      - `instagram`: string (optional)
      - `other`: string (optional)
  - `metadata`: object (optional) - Additional extracted metadata
  - `registrationConfig`: object (optional) - Registration configuration
    - `enabled`: boolean - Whether registration is enabled
    - `fields`: array - Array of registration field configurations
      - Each field: object
        - `id`: string - Unique field identifier
        - `type`: string - Field type (text, email, phone, select, etc.)
        - `label`: string - Field label
        - `placeholder`: string (optional) - Field placeholder
        - `description`: string (optional) - Field description
        - `required`: boolean - Whether field is required
        - `order`: number - Field display order
        - `options`: array (optional) - Options for select/radio/checkbox fields
        - `minLength`: number (optional) - Minimum length for text fields
        - `maxLength`: number (optional) - Maximum length for text fields
        - `min`: number (optional) - Minimum value for number fields
        - `max`: number (optional) - Maximum value for number fields
        - `acceptedFileTypes`: array (optional) - Accepted file types for file fields
        - `maxFileSize`: number (optional) - Maximum file size in bytes
        - `showWhen`: object (optional) - Conditional display logic
    - `deadline`: timestamp (optional) - Registration deadline
    - `maxRegistrations`: number (optional) - Maximum number of registrations
    - `allowWaitlist`: boolean - Whether to allow waitlist when at capacity
    - `requireApproval`: boolean - Whether registrations require approval
    - `confirmationMessage`: string (optional) - Custom confirmation message
    - `submissionMessage`: string (optional) - Custom submission message
    - `sendConfirmationEmail`: boolean - Whether to send confirmation emails
    - `confirmationEmailSubject`: string (optional) - Email subject template
    - `confirmationEmailTemplate`: string (optional) - Email body template

### `reminders`
Stores user reminders for events.

- Document ID: Auto-generated
- Fields:
  - `id`: string - Reminder ID (same as document ID)
  - `userId`: string - User ID
  - `eventId`: string - Event ID
  - `reminderTime`: timestamp - When to send the reminder
  - `notificationMethods`: array - Methods to use for notification
  - `status`: string - Reminder status ("pending", "sent", "failed", "cancelled")
  - `createdAt`: timestamp - When the reminder was created
  - `updatedAt`: timestamp (optional) - When the reminder was last updated
  - `message`: string (optional) - Custom reminder message
  - `customData`: object (optional) - Additional data

### `submissions`
Stores information about flyer submissions.

- Document ID: Auto-generated
- Fields:
  - `id`: string - Submission ID (same as document ID)
  - `submitterId`: string (optional) - User ID of submitter (if known)
  - `submissionMethod`: string - Method of submission ("website_upload", "email", "whatsapp")
  - `submissionSource`: string (optional) - Source of submission (email address, phone number)
  - `status`: string - Submission status ("received", "processing", "extraction_completed", "pending_review", "approved", "rejected", "failed")
  - `createdAt`: timestamp - When the submission was created
  - `updatedAt`: timestamp (optional) - When the submission was last updated
  - `fileUrl`: string - URL to the submitted file
  - `fileType`: string - MIME type of the file
  - `fileName`: string (optional) - Original filename
  - `extractedData`: object (optional) - Data extracted from the flyer
    - `title`: string (optional) - Extracted event title
    - `description`: string (optional) - Extracted event description
    - `startDate`: timestamp (optional) - Extracted event start date
    - `endDate`: timestamp (optional) - Extracted event end date
    - `location`: object (optional) - Extracted location information
    - `categories`: array (optional) - Extracted event categories
    - `price`: object (optional) - Extracted price information
    - `contactInfo`: object (optional) - Extracted contact information
    - `confidence`: number (optional) - Confidence score of extraction
    - `rawText`: string (optional) - Original text extracted from flyer
  - `moderatorId`: string (optional) - User ID who reviewed/approved
  - `moderatorNotes`: string (optional) - Notes from the moderator
  - `eventId`: string (optional) - Created event ID after approval

## Sub-collections

### `events/{eventId}/attendees`
Stores information about users who have set reminders or saved the event.

- Document ID: User ID
- Fields:
  - `userId`: string - User ID
  - `reminderSet`: boolean - Whether the user has set a reminder
  - `reminderTime`: timestamp (optional) - When the reminder is set for
  - `saved`: boolean - Whether the user has saved this event
  - `createdAt`: timestamp - When the record was created
  - `updatedAt`: timestamp (optional) - When the record was last updated

### `events/{eventId}/registrations`
Stores event registrations with custom form data configured by event creators.

- Document ID: Auto-generated
- Fields:
  - `id`: string - Registration ID (same as document ID)
  - `eventId`: string - Event ID
  - `userId`: string (optional) - User ID (for logged-in users)
  - `status`: string - Registration status ("pending", "approved", "rejected", "waitlisted", "cancelled")
  - `formData`: object - Dynamic form data based on event configuration
  - `submittedAt`: timestamp - When the registration was submitted
  - `updatedAt`: timestamp (optional) - When the registration was last updated
  - `approvedAt`: timestamp (optional) - When the registration was approved
  - `approvedBy`: string (optional) - User ID of approver
  - `email`: string - Registrant's email (required)
  - `firstName`: string - Registrant's first name (required)
  - `lastName`: string - Registrant's last name (required)
  - `ipAddress`: string (optional) - IP address of submitter
  - `userAgent`: string (optional) - Browser user agent
  - `referrer`: string (optional) - Referrer URL
  - `notes`: string (optional) - Admin/organizer notes

## Indexes

The following indexes will be needed for efficient querying:

1. `events` collection:
   - `status` + `startDate` (ascending) - For listing upcoming published events
   - `categories` + `startDate` (ascending) - For filtering events by category
   - `location.city` + `startDate` (ascending) - For location-based filtering
   - `organizerId` + `createdAt` (descending) - For listing user's created events
   - `organizationId` + `createdAt` (descending) - For listing organization's events

2. `submissions` collection:
   - `status` + `createdAt` (descending) - For listing submissions by status
   - `submitterId` + `createdAt` (descending) - For listing user's submissions

3. `events/{eventId}/registrations` sub-collections:
   - `status` + `submittedAt` (descending) - For filtering registrations by status
   - `userId` + `submittedAt` (descending) - For user registration history
   - `email` + `submittedAt` (descending) - For searching by email
   - `submittedAt` (descending) - For chronological ordering

## Security Rules

Security rules will enforce the following access patterns:

- All users can read published events
- Organizations can create and manage their own events
- Only admins can view and process submissions
- Users can only access their own reminders
- Organizations can only access their own organization data