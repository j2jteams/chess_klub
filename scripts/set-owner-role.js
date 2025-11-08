/**
 * Script to manually set owner role for a user
 * Usage: node scripts/set-owner-role.js <user-email>
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin (you'll need to download service account key)
// For now, this is a template - you'll need to configure it

async function setOwnerRole(email) {
  try {
    // You'll need to initialize Firebase Admin SDK
    // This requires a service account key from Firebase Console
    
    console.log(`Setting owner role for: ${email}`);
    console.log('\nTo set owner role manually:');
    console.log('1. Go to Firebase Console → Firestore Database');
    console.log('2. Find user document in "users" collection');
    console.log('3. Edit document and set: role = "owner"');
    console.log('\nOr use Firebase CLI:');
    console.log(`firebase firestore:set users/{userId} '{ "role": "owner" }'`);
  } catch (error) {
    console.error('Error:', error);
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: node scripts/set-owner-role.js <email>');
  process.exit(1);
}

setOwnerRole(email);

