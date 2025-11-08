# Firebase Setup for Local Events

This document provides instructions for setting up the Firebase backend for the Local Events application, including the Firestore database structure, authentication, and security rules.

## Table of Contents

1. [Setting Up Firebase Project](#setting-up-firebase-project)
2. [Firebase Authentication](#firebase-authentication)
3. [Firestore Database Structure](#firestore-database-structure)
4. [Security Rules](#security-rules)
5. [Indexes](#indexes)
6. [Environment Variables](#environment-variables)

## Setting Up Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click "Add project" and follow the setup wizard.
3. Give your project a name (e.g., "Local Events").
4. Enable or disable Google Analytics as preferred.
5. Click "Create project".

### Adding Firebase to your Web App

1. In the Firebase Console, click on the project you just created.
2. Click on the web icon (`</>`) to add a web app.
3. Register your app with a nickname (e.g., "Local Events Web").
4. Copy the Firebase configuration object for later use in the environment variables.

## Firebase Authentication

1. In the Firebase Console, navigate to "Authentication" in the left sidebar.
2. Click "Get started".
3. In the "Sign-in method" tab, enable "Google" provider:
   - Click on "Google" in the provider list.
   - Toggle the "Enable" switch.
   - Add your support email.
   - Click "Save".

## Firestore Database Structure

1. In the Firebase Console, navigate to "Firestore Database" in the left sidebar.
2. Click "Create database".
3. Choose "Start in production mode" or "Start in test mode" (switch to production mode later).
4. Select the Firestore location closest to your users.
5. Click "Enable".

### Collections and Documents Structure

The application uses the following collections:

#### `users` Collection

Stores user profile information.

```
users/
├── {userId}/
    ├── uid: string - User ID
    ├── email: string - Email address
    ├── displayName: string - Display name
    ├── photoURL: string - Profile photo URL
    ├── createdAt: timestamp - Creation date
    ├── updatedAt: timestamp - Last update
    ├── role: string - User role ("user", "organization", "admin")
    ├── organizationId: string (optional) - Organization reference
    └── preferences: object - User preferences
        ├── notificationMethods: array - Preferred notification methods
        ├── emailNotifications: boolean
        ├── smsNotifications: boolean
        ├── whatsappNotifications: boolean
        ├── location: string (optional)
        ├── interests: array (optional)
        └── savedEvents: array (optional)
```

#### `organizations` Collection

Stores organization profile information.

```
organizations/
├── {organizationId}/
    ├── id: string - Organization ID
    ├── name: string - Organization name
    ├── description: string (optional) - Description
    ├── logo: string (optional) - Logo URL
    ├── website: string (optional) - Website URL
    ├── contactEmail: string - Contact email
    ├── contactPhone: string (optional) - Contact phone
    ├── socialLinks: object (optional) - Social media links
    │   ├── facebook: string (optional)
    │   ├── twitter: string (optional)
    │   ├── instagram: string (optional)
    │   └── linkedin: string (optional)
    ├── verified: boolean - Verification status
    ├── createdAt: timestamp - Creation date
    ├── updatedAt: timestamp - Last update
    └── adminIds: array - User IDs of organization admins
```

#### `events` Collection

Stores event information.

```
events/
├── {eventId}/
    ├── id: string - Event ID
    ├── title: string - Event title
    ├── description: string - Event description
    ├── startDate: timestamp - Event start date/time
    ├── endDate: timestamp (optional) - Event end date/time
    ├── location: object - Event location
    │   ├── address: string - Full address
    │   ├── city: string - City
    │   ├── state: string (optional) - State/province
    │   ├── country: string - Country
    │   ├── postalCode: string (optional) - Postal code
    │   ├── venueDetails: string (optional) - Venue details
    │   └── geoPoint: object (optional) - Coordinates
    │       ├── latitude: number - Latitude
    │       └── longitude: number - Longitude
    ├── organizerId: string - Creator's user ID
    ├── organizationId: string (optional) - Organization ID
    ├── categories: array - Event categories
    ├── images: array - Event images
    │   ├── url: string - Image URL
    │   ├── alt: string (optional) - Alt text
    │   ├── isPrimary: boolean - Primary image flag
    │   ├── width: number (optional) - Image width
    │   └── height: number (optional) - Image height
    ├── flyerUrl: string (optional) - Original flyer URL
    ├── status: string - Event status
    ├── createdAt: timestamp - Creation date
    ├── updatedAt: timestamp - Last update
    ├── published: boolean - Public visibility flag
    ├── maxAttendees: number (optional) - Maximum capacity
    ├── price: object (optional) - Price information
    │   ├── amount: number - Price amount
    │   ├── currency: string - Currency code
    │   ├── freeEntry: boolean - Free entry flag
    │   └── ticketUrl: string (optional) - Ticket URL
    ├── contactInfo: object (optional) - Contact details
    │   ├── name: string (optional) - Contact name
    │   ├── email: string (optional) - Contact email
    │   ├── phone: string (optional) - Contact phone
    │   ├── website: string (optional) - Event website
    │   └── socialLinks: object (optional) - Social media
    │       ├── facebook: string (optional)
    │       ├── twitter: string (optional)
    │       ├── instagram: string (optional)
    │       └── other: string (optional)
    └── metadata: object (optional) - Additional metadata
    
    # Subcollection for attendees/saved events
    ├── attendees/
        ├── {userId}/
            ├── userId: string - User ID
            ├── reminderSet: boolean - Reminder status
            ├── reminderTime: timestamp (optional) - Reminder time
            ├── saved: boolean - Saved status
            ├── createdAt: timestamp - Creation date
            └── updatedAt: timestamp (optional) - Last update
```

#### `reminders` Collection

Stores user reminders for events.

```
reminders/
├── {reminderId}/
    ├── id: string - Reminder ID
    ├── userId: string - User ID
    ├── eventId: string - Event ID
    ├── reminderTime: timestamp - When to send reminder
    ├── notificationMethods: array - Notification methods
    ├── status: string - Reminder status
    ├── createdAt: timestamp - Creation date
    ├── updatedAt: timestamp (optional) - Last update
    ├── message: string (optional) - Custom message
    └── customData: object (optional) - Additional data
```

#### `submissions` Collection

Stores information about flyer submissions.

```
submissions/
├── {submissionId}/
    ├── id: string - Submission ID
    ├── submitterId: string (optional) - User ID
    ├── submissionMethod: string - Method
    ├── submissionSource: string (optional) - Source
    ├── status: string - Submission status
    ├── createdAt: timestamp - Creation date
    ├── updatedAt: timestamp (optional) - Last update
    ├── fileUrl: string - Uploaded file URL
    ├── fileType: string - File MIME type
    ├── fileName: string (optional) - Original filename
    ├── extractedData: object (optional) - Extracted data
    │   ├── title: string (optional) - Event title
    │   ├── description: string (optional) - Description
    │   ├── startDate: timestamp (optional) - Start date
    │   ├── endDate: timestamp (optional) - End date
    │   ├── location: object (optional) - Location
    │   ├── categories: array (optional) - Categories
    │   ├── price: object (optional) - Price info
    │   ├── contactInfo: object (optional) - Contact info
    │   ├── confidence: number (optional) - Confidence score
    │   └── rawText: string (optional) - Extracted text
    ├── moderatorId: string (optional) - Moderator's user ID
    ├── moderatorNotes: string (optional) - Moderation notes
    └── eventId: string (optional) - Created event ID
```

## Security Rules

1. In the Firebase Console, navigate to "Firestore Database" in the left sidebar.
2. Click on the "Rules" tab.
3. Copy and paste the rules from the `firestore.rules` file:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
    
    // ... (rest of the rules from the firestore.rules file)
  }
}
```

4. Click "Publish" to apply the rules.

## Indexes

1. In the Firebase Console, navigate to "Firestore Database" in the left sidebar.
2. Click on the "Indexes" tab.
3. Create each of the indexes specified in the `firestore.indexes.json` file.

For each composite index:

- Click "Add Index".
- Select the collection (e.g., "events").
- Add the fields and order directions as specified in the indexes file.
- Click "Create Index".

Alternatively, you can deploy indexes using the Firebase CLI:

```bash
firebase deploy --only firestore:indexes
```

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

Replace the placeholder values with the configuration from your Firebase project.

## Firebase Storage Setup (Optional)

If you plan to store files (like event flyers):

1. In the Firebase Console, navigate to "Storage" in the left sidebar.
2. Click "Get started".
3. Choose the default security rules (adjust later as needed).
4. Select the storage location (same as your Firestore location).
5. Click "Done".

## Firebase CLI Setup

For deployment and further project management:

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   
   Select Firestore, Storage (if needed), and Hosting options.

4. Deploy to Firebase:
   ```bash
   firebase deploy
   ```