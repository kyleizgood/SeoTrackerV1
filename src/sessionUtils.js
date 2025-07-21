// All sessions expire at 6 PM every day

// Returns a Date object for the next 6 PM cutoff after a given date
function getNext6PMAfter(date) {
  const cutoff = new Date(date);
  cutoff.setHours(18, 0, 0, 0); // 18:00:00.000
  if (date >= cutoff) {
    cutoff.setDate(cutoff.getDate() + 1);
  }
  return cutoff;
}

// Returns true if the session is expired based on session start time
export const isSessionExpired = () => {
  const start = getSessionStartTime();
  if (!start) return false; // No session started yet
  const now = new Date();
  const cutoff = getNext6PMAfter(new Date(start));
  return now >= cutoff;
};

// Returns milliseconds remaining until 6 PM
export const getRemainingSessionTime = () => {
  const start = getSessionStartTime();
  if (!start) return 0;
  const now = new Date();
  const cutoff = getNext6PMAfter(new Date(start));
  const diff = cutoff - now;
  return isNaN(diff) ? 0 : diff;
};

// Format remaining time in a human-readable format
export const formatRemainingTime = (milliseconds) => {
  if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) return 'Expired';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
};

import { getAuth } from 'firebase/auth';

export function setSessionStartTime() {
  const user = getAuth().currentUser;
  if (user) {
    localStorage.setItem(`sessionStartTime_${user.uid}`, Date.now().toString());
  }
}

export function getSessionStartTime() {
  const user = getAuth().currentUser;
  if (user) {
    const val = localStorage.getItem(`sessionStartTime_${user.uid}`);
    if (!val) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }
  return null;
}

export function clearSessionStartTime() {
  const user = getAuth().currentUser;
  if (user) {
    localStorage.removeItem(`sessionStartTime_${user.uid}`);
  }
} 