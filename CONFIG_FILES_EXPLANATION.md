# Configuration Files Explained - Firebase App Hosting Context

## The Problem
Your app is showing Firebase configuration errors because environment variables are missing in your **deployed** Firebase App Hosting backend. The error says:
- Missing: `apiKey`, `authDomain`, `projectId`, `appId`
- These need to be set as **Firebase Secrets** (not in files)

---

## File Roles & When They're Used

### 1. `.env.local` (Local Development Only)
**Role:** Stores environment variables for **local development** on your machine

**When it's used:**
- ✅ When you run `npm run dev` locally
- ✅ When you build/test locally
- ❌ **NOT used** in Firebase App Hosting deployment
- ❌ **NOT committed** to git (should be in `.gitignore`)

**Example content:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=chess-klub
# ... etc
```

**Why it doesn't work in production:**
- Firebase App Hosting doesn't read `.env.local`
- It's a local-only file for your development environment

---

### 2. `.env.production` (Not Used by Firebase App Hosting)
**Role:** Would store production environment variables (if you were using traditional hosting)

**When it's used:**
- ❌ **NOT used** by Firebase App Hosting
- ✅ Would be used by Vercel, Netlify, or other traditional hosting
- ❌ Firebase App Hosting uses **Secrets** instead (see `apphosting.yaml`)

**Why it doesn't work:**
- Firebase App Hosting doesn't read `.env.production`
- You must use Firebase Secrets (configured in `apphosting.yaml`)

---

### 3. `apphosting.yaml` (Firebase App Hosting Configuration)
**Role:** Tells Firebase App Hosting which **Secrets** to use and how to configure your backend

**When it's used:**
- ✅ **ONLY** when deploying to Firebase App Hosting
- ✅ Defines which Firebase Secrets to inject as environment variables
- ✅ Configures backend resources (CPU, memory, instances)

**Key sections:**
```yaml
buildConfig:
  env:
    - variable: NEXT_PUBLIC_FIREBASE_API_KEY
      secret: NEXT_PUBLIC_FIREBASE_API_KEY  # ← References a Firebase Secret
```

**How it works:**
1. `apphosting.yaml` says "use the secret named `NEXT_PUBLIC_FIREBASE_API_KEY`"
2. You must create that secret in Firebase Console
3. Firebase injects the secret value as an environment variable during build/runtime

**Current status:** ✅ Your `apphosting.yaml` is correctly configured to use secrets

---

### 4. `.firebaserc` (Firebase Project Mapping)
**Role:** Maps your local project to a Firebase project ID

**When it's used:**
- ✅ When running `firebase deploy`
- ✅ When using Firebase CLI commands
- ✅ Tells Firebase which project to deploy to

**Content:**
```json
{
  "projects": {
    "default": "chess-klub"  // ← Your Firebase project ID
  }
}
```

**Status:** ✅ Correctly set to `chess-klub`

---

### 5. `next.config.ts` (Next.js Configuration)
**Role:** Configures Next.js build settings, image domains, rewrites, etc.

**When it's used:**
- ✅ During `next build` (both local and production)
- ✅ Configures allowed image domains
- ✅ Sets up URL rewrites
- ❌ Does NOT handle environment variables

**Status:** ✅ Your config looks fine

---

### 6. `package.json` (Dependencies & Scripts)
**Role:** Defines project dependencies, scripts, and metadata

**When it's used:**
- ✅ When installing dependencies (`npm install`)
- ✅ When running scripts (`npm run dev`, `npm run build`)
- ✅ Defines project name and version

**Status:** ✅ Standard Next.js setup

---

### 7. `firestore.rules` (Database Security Rules)
**Role:** Defines who can read/write data in Firestore

**When it's used:**
- ✅ When deploying Firestore rules (`firebase deploy --only firestore:rules`)
- ✅ Every time someone tries to access Firestore
- ❌ Not related to environment variables or Firebase config

**Status:** ✅ Your rules are configured

---

## The Solution: Setting Firebase Secrets

Your `apphosting.yaml` is correctly configured, but the **Secrets don't exist** in Firebase Console yet.

### Step-by-Step Fix:

1. **Go to Firebase Console:**
   - Navigate to: https://console.firebase.google.com/project/chess-klub/apphosting
   - Or: Project Settings → App Hosting → Your backend

2. **Create Secrets:**
   - Click on your backend (`chess-klub-backend`)
   - Go to "Secrets" or "Environment Variables" section
   - Create these secrets (one by one):
     - `NEXT_PUBLIC_FIREBASE_API_KEY` = (your API key)
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = (your auth domain)
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `chess-klub`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = (your bucket)
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = (your sender ID)
     - `NEXT_PUBLIC_FIREBASE_APP_ID` = (your app ID)
     - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` = (your measurement ID, optional)

3. **Get the values from:**
   - Firebase Console → Project Settings → Your apps → Web app
   - Or from your local `.env.local` file (if you have one)

4. **Redeploy:**
   - After creating secrets, trigger a new deployment
   - The secrets will be injected as environment variables
   - Your app should work!

---

## Summary: File Usage Matrix

| File | Local Dev | Firebase App Hosting | Purpose |
|------|-----------|---------------------|---------|
| `.env.local` | ✅ Used | ❌ Ignored | Local environment variables |
| `.env.production` | ❌ Not used | ❌ Ignored | Not used by Firebase App Hosting |
| `apphosting.yaml` | ❌ Ignored | ✅ Used | Maps Firebase Secrets to env vars |
| `.firebaserc` | ✅ Used | ✅ Used | Firebase project mapping |
| `next.config.ts` | ✅ Used | ✅ Used | Next.js configuration |
| `package.json` | ✅ Used | ✅ Used | Dependencies & scripts |
| `firestore.rules` | ✅ Used | ✅ Used | Database security rules |

---

## Quick Fix Checklist

- [ ] Create Firebase Secrets in Firebase Console
- [ ] Ensure secret names match exactly what's in `apphosting.yaml`
- [ ] Redeploy your backend
- [ ] Verify secrets are injected (check deployment logs)
- [ ] Test your app - Firebase errors should be gone!

