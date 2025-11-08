import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: unknown): string {
  let dateObj: Date;

  if (typeof date === "object" && date && 'seconds' in date) {
    // Firestore-like timestamp object
    dateObj = new Date((date as { seconds: number }).seconds * 1000);
  } else if (date instanceof Timestamp) {
    dateObj = date.toDate();
  } else if (typeof date === "string" || typeof date === "number") {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    throw new Error("Invalid date format");
  }

  if (isNaN(dateObj.getTime())) {
    throw new Error("Invalid time value");
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(dateObj);
}
