# Debugging Firebase Secrets Issue

## Current Situation
- ✅ Secrets are set correctly
- ✅ Access is granted
- ✅ Fresh deployments have been tried
- ❌ Still getting Firebase config errors

## Diagnostic Steps

### 1. Check Deployment Logs
Go to Firebase Console → App Hosting → `chess-klub-backend` → Latest deployment → View logs

**Look for:**
- Any errors about secrets
- Messages about environment variables
- Build output showing env vars being set

### 2. Verify Secret Format
Make sure secrets don't have:
- Extra spaces
- Newlines
- Special characters that need escaping

### 3. Check Build Logs for Env Vars
In the build logs, you should see:
- Environment variables being set
- No "Permission denied" errors
- Successful secret resolution

### 4. Test Secret Access
Run this to verify backend can access secrets:
```bash
firebase apphosting:secrets:access NEXT_PUBLIC_FIREBASE_API_KEY
```

### 5. Check if Secrets Are Project-Level vs Backend-Level
Secrets might need to be:
- Project-level (shared across backends)
- Backend-specific (scoped to one backend)

### 6. Verify apphosting.yaml Syntax
The YAML might have:
- Indentation issues
- Missing quotes
- Invalid characters

### 7. Check Next.js Build Output
Next.js might be:
- Caching old builds
- Not reading env vars at build time
- Having issues with NEXT_PUBLIC_ prefix

## Possible Solutions

### Solution 1: Re-grant Access
Sometimes permissions get out of sync:
```bash
firebase apphosting:secrets:grantaccess NEXT_PUBLIC_FIREBASE_API_KEY --backend chess-klub-backend
# Repeat for all secrets
```

### Solution 2: Recreate Secrets
Delete and recreate secrets (in case they're corrupted):
1. Delete secret
2. Create new one with same name
3. Grant access again

### Solution 3: Check Secret Versions
Make sure you're using the latest version:
```bash
firebase apphosting:secrets:describe NEXT_PUBLIC_FIREBASE_API_KEY
```

### Solution 4: Verify Backend Service Account
The backend's service account needs permission to read secrets. This should be automatic, but might need manual setup.

### Solution 5: Check Build Timing
Secrets might not be available at the exact moment the build starts. Try:
- Waiting a few minutes after setting secrets
- Then triggering deployment

## What to Check in Console

1. **App Hosting → Your Backend → Secrets Tab**
   - Are all secrets listed?
   - Do they show as "Enabled"?
   - Are they linked to the backend?

2. **Build Logs**
   - Look for "Pinned secret" messages
   - Check for any errors
   - Verify env vars are being set

3. **Deployment Status**
   - Is the deployment successful?
   - Any warnings about secrets?

## Next Steps

1. Check the deployment logs first
2. Verify secret access from CLI
3. Check if there are any error messages we're missing
4. Consider contacting Firebase support if nothing works

