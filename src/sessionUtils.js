// Simple countdown timer to 6 PM every day
export const getTimeUntil6PM = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sixPM = new Date(today);
  sixPM.setHours(18, 0, 0, 0); // 6 PM (18:00:00.000)
  
  // If it's past 6 PM today, calculate for tomorrow
  if (now >= sixPM) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    sixPM.setDate(sixPM.getDate() + 1);
  }
  
  const timeRemaining = sixPM.getTime() - now.getTime();
  return Math.max(0, timeRemaining);
};

// Format remaining time in a human-readable format
export const formatRemainingTime = (milliseconds) => {
  if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) return '6:00 PM';
  
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

// Legacy functions for compatibility (keeping them but they won't be used for the timer)
import { getAuth } from 'firebase/auth';

export function setSessionStartTime() {
  // No longer needed for the new timer
}

export function getSessionStartTime() {
  // No longer needed for the new timer
  return null;
}

export function clearSessionStartTime() {
  // No longer needed for the new timer
}

export const updateActivityTime = () => {
  // No longer needed for the new timer
};

export const isSessionExpired = () => {
  // No longer needed for the new timer
  return false;
};

export const getRemainingSessionTime = () => {
  // Redirect to the new timer function
  return getTimeUntil6PM();
};

// Set up activity listeners to track user interaction
export const setupActivityTracking = () => {
  // No longer needed for the new timer
  return () => {};
}; 