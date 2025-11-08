import { NextResponse } from "next/server";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
} from "firebase/firestore";

// Firebase config (from .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper: compare only Year/Month/Day
function sameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export async function GET() {
  try {
    // 1. Calculate target date (7 days ahead)
    const now = new Date();
    const targetDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    console.log("Target reminder date (local):", targetDate);

    // 2. Get all events
    const eventsSnap = await getDocs(collection(db, "events"));
    const events: any[] = [];

    for (const d of eventsSnap.docs) {
      const data: any = d.data();
      let start: Date | null = null;

      if (data.startDate && typeof data.startDate.toDate === "function") {
        start = data.startDate.toDate();
      } else if (typeof data.startDate === "string") {
        start = new Date(data.startDate);
      }

      console.log("Event:", d.id, data.title, "→ startDate parsed:", start);

      if (start && sameDay(start, targetDate)) {
        events.push({ id: d.id, ...data, startDate: start });
      }
    }

    if (events.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No events exactly 1 week away today",
      });
    }

    let remindersSent = 0;

    // 3. For each event, find registrations in subcollection
    for (const event of events) {
      console.log("Checking registrations for event:", event.id, event.title);

      const regsQuery = collection(db, "events", event.id, "registrations");
      const regsSnap = await getDocs(regsQuery);

      if (regsSnap.empty) {
        console.log("⚠️ No registrations for", event.id);
      }

      for (const reg of regsSnap.docs) {
        const r: any = reg.data();
        if (!r.email) continue;

        console.log("Sending reminder to:", r.email, "for event:", event.title);

        // Build email
        const eventDate = event.startDate.toLocaleString();
        const html = `
          <h2>Reminder: ${event.title} is in one week!</h2>
          <p>Dear ${r.firstName || "Attendee"},</p>
          <p>This is a friendly reminder that your registered event is coming up:</p>

          <p><strong>${event.title}</strong><br/>
          Date: ${eventDate}<br/>
          Location: ${event.location?.address || ""}, ${event.location?.city || ""}, ${event.location?.state || ""} ${event.location?.postalCode || ""}</p>

          <h3>Event Contact</h3>
          <p>
            ${event.contactInfo?.name || ""}<br/>
            Email: ${event.contactInfo?.email || ""}<br/>
            Phone: ${event.contactInfo?.phone || ""}
          </p>

          <h3>Need help with our website?</h3>
          <p>
            Contact us:<br/>
            Email: support@chessklub.com<br/>
            Phone: +1 (980) 321-9159<br/>
            Team Chess Klub
          </p>
        `;

        // Call your existing email API
        await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/email/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: r.email,
              subject: `Reminder: ${event.title} is in one week`,
              html,
            }),
          }
        );

        remindersSent++;
      }
    }

    return NextResponse.json({ success: true, remindersSent });
  } catch (err: any) {
    console.error("Reminder job failed:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
